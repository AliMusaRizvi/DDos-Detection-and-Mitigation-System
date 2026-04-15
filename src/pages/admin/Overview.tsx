import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldAlert, Cpu, Network, ArrowUpRight, ArrowDownRight, Layers, ShieldBan } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { dbApi, mlApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';

export default function Overview() {
  const [traffic, setTraffic] = useState<any[]>(Array.from({ length: 40 }).map((_, i) => ({ 
    time: i.toString(), 
    value: 10,
    timestamp: new Date(Date.now() - (39 - i) * 1000).toLocaleTimeString()
  })));
  const [cpu, setCpu] = useState(12.4);
  const [ram, setRam] = useState(342);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isMitigating, setIsMitigating] = useState(false);
  const [mlStatus, setMlStatus] = useState<string>('Checking...');
  
  // DB Stats
  const [stats, setStats] = useState({
    totalPackets: '...',
    blockedThreats: '...',
    activeCases: '...',
    activeRules: '...'
  });

  useEffect(() => {
    const socketOrigin = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketOrigin, {
      transports: ['websocket', 'polling']
    });

    socket.on('metrics', (metrics) => {
      const rawTraffic = Array.isArray(metrics?.traffic) ? metrics.traffic : [];
      const formattedTraffic = rawTraffic.map((item: any, i: number) => ({
        time: i.toString(),
        value: item.value,
        timestamp: new Date(item.timestamp).toLocaleTimeString()
      }));

      if (formattedTraffic.length > 0) {
        setTraffic(formattedTraffic);
      }

      setCpu(typeof metrics?.cpu === 'number' ? metrics.cpu : 0);
      setRam(typeof metrics?.ram === 'number' ? metrics.ram : 0);
      setIsMitigating(Boolean(metrics?.isMitigating));
    });

    socket.on('new_alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
    });

    const fetchInitialData = async () => {
      try {
        // Fetch alerts
        const alertsData = await dbApi.getAlerts();
        const safeAlerts = Array.isArray(alertsData) ? alertsData : [];
        const mappedAlerts = safeAlerts.slice(0, 5).map((item: any) => ({
          id: item.id,
          time: new Date(item.created_at).toLocaleTimeString(),
          ip: item.source_ip,
          type: item.attack_type,
          priority: item.priority === 'high' ? 'High' : item.priority === 'medium' ? 'Medium' : 'Low',
          tier: item.mitigation_tier,
          action: item.action_taken,
        }));
        setAlerts(mappedAlerts);

        // Fetch DB Stats
        const [packetsRes, blockedRes, casesRes, rulesRes] = await Promise.all([
          supabase.from('ddos_attack_logs').select('*', { count: 'exact', head: true }),
          supabase.from('ddos_alerts').select('*', { count: 'exact', head: true }).eq('action_taken', 'blocked'),
          supabase.from('ddos_attack_cases').select('*', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('ddos_mitigation_rules').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
        ]);

        if (packetsRes.error || blockedRes.error || casesRes.error || rulesRes.error) {
          console.error('Failed to fetch one or more overview stats', {
            packets: packetsRes.error,
            blocked: blockedRes.error,
            cases: casesRes.error,
            rules: rulesRes.error,
          });
        }

        const packetsCount = packetsRes.count ?? 0;
        const blockedCount = blockedRes.count ?? 0;
        const casesCount = casesRes.count ?? 0;
        const rulesCount = rulesRes.count ?? 0;

        setStats({
          totalPackets: packetsCount.toLocaleString(),
          blockedThreats: blockedCount.toLocaleString(),
          activeCases: casesCount.toString(),
          activeRules: rulesCount.toString()
        });

        // Check ML API Health
        const isMlHealthy = await mlApi.checkHealth();
        setMlStatus(isMlHealthy ? 'Online (RF+XGB)' : 'Offline (Local Failsafe)');

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Dashboard Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time monitoring of network traffic and ML engine performance.</p>
        </div>
        <div className="flex items-center gap-4">
          {isMitigating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-danger-dim border border-danger/20 rounded-full text-danger text-xs font-medium"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
              </span>
              MITIGATION ACTIVE
            </motion.div>
          )}
          <div className="text-xs font-mono text-text-muted">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Logged Packets (DB)', value: stats.totalPackets, change: '+live stream', trend: 'up', icon: Network },
          { label: 'Blocked Threats', value: stats.blockedThreats, change: 'total to date', trend: 'up', icon: ShieldAlert },
          { label: 'Active Cases', value: stats.activeCases, change: 'needs review', trend: 'down', icon: Layers },
          { label: 'Active Mitigation Rules', value: stats.activeRules, change: 'enforced', trend: 'up', icon: ShieldBan },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bento-card p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-text-secondary">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold text-text-primary">{stat.value}</span>
              <div className={`flex items-center text-xs font-mono ${stat.trend === 'up' ? 'text-brand' : 'text-text-secondary'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Graph */}
        <div className="lg:col-span-2 bento-card p-6 flex flex-col h-80">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-text-primary">Live Network Traffic</h3>
            <span className="text-xs font-mono text-text-muted">Interface: eth0</span>
          </div>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-bg-panel border border-border-strong p-3 rounded-lg shadow-xl">
                          <p className="text-text-secondary text-xs mb-1 font-mono">{payload[0].payload.timestamp}</p>
                          <p className="text-brand font-mono font-medium">
                            {payload[0].value} <span className="text-text-muted text-xs">pkts/s</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#00FF00" strokeWidth={2} fillOpacity={1} fill="url(#colorTraffic)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="bento-card p-6 flex flex-col gap-6">
          <h3 className="text-sm font-medium text-text-primary">Resource Utilization</h3>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">CPU (Target &lt;15%)</span>
              <span className="font-mono text-text-primary">{cpu.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-bg-base rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all duration-500" style={{ width: `${(cpu / 100) * 100}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">RAM (Target &lt;500MB)</span>
              <span className="font-mono text-text-primary">{ram.toFixed(0)} MB</span>
            </div>
            <div className="h-2 bg-bg-base rounded-full overflow-hidden">
              <div className="h-full bg-info transition-all duration-500" style={{ width: `${(ram / 1024) * 100}%` }}></div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border-subtle">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">ML Engine Status</span>
              <span className={`text-xs font-mono px-2 py-1 rounded-md ${mlStatus.includes('Online') ? 'text-brand bg-brand-dim' : 'text-danger bg-danger-dim'}`}>
                {mlStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 border-b border-border-subtle flex justify-between items-center">
          <h3 className="text-sm font-medium text-text-primary">Recent Mitigation Actions</h3>
          <button className="text-xs text-text-secondary hover:text-text-primary transition-colors">View All</button>
        </div>
        <div className="divide-y divide-border-subtle">
          {alerts.map((alert, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-bg-panel transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  alert.priority === 'High' ? 'bg-danger' :
                  alert.priority === 'Medium' ? 'bg-warning' :
                  'bg-info'
                }`}></div>
                <div className="font-mono text-sm text-text-primary">{alert.ip}</div>
                <div className="text-xs text-text-secondary">{alert.type}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs font-mono text-text-muted hidden sm:block">{alert.tier}</div>
                <div className={`text-xs font-mono px-2 py-1 rounded-md ${alert.action === 'blocked' ? 'text-danger bg-danger-dim' : 'text-brand bg-brand-dim'}`}>{alert.action}</div>
                <div className="text-xs font-mono text-text-muted w-20 text-right">{alert.time}</div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">No recent mitigation actions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
