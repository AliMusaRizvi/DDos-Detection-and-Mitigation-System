import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Loader } from 'lucide-react';
import { io } from 'socket.io-client';
import { dbApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socketOrigin = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketOrigin, {
      transports: ['websocket', 'polling']
    });

    socket.on('new_alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 100)); // Keep last 100 alerts live
    });

    const fetchInitialAlerts = async () => {
      try {
        const data = await dbApi.getAlerts();
        // Map Supabase columns to component expectations
        const mappedData = data.map((item: any) => ({
          id: item.id,
          time: new Date(item.created_at).toLocaleTimeString(),
          ip: item.source_ip,
          type: item.attack_type,
          priority: String(item.priority).toLowerCase() === 'high' ? 'High' : String(item.priority).toLowerCase() === 'medium' ? 'Medium' : 'Low',
          tier: item.mitigation_tier,
          action: item.action_taken,
          status: item.status
        }));
        setAlerts(mappedData);
      } catch (error) {
        toast.error('Failed to fetch alerts from database');
        console.error('Failed to fetch initial alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialAlerts();

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'ALL' || alert.priority === filter;
    const ip = String(alert.ip ?? '');
    const type = String(alert.type ?? '').toLowerCase();
    const matchesSearch = ip.includes(searchQuery) || type.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Security Alerts</h1>
          <p className="text-sm text-text-secondary mt-1">Detailed log of detected threats and mitigation actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm hover:border-border-strong transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bento-card p-5">
          <div className="text-sm text-text-secondary mb-1">Total Alerts (24h)</div>
          <div className="text-2xl font-semibold text-text-primary">{alerts.length}</div>
          <div className="text-xs text-brand flex items-center mt-2">Live sync active</div>
        </div>
        <div className="bento-card p-5">
          <div className="text-sm text-text-secondary mb-1">Critical (High)</div>
          <div className="text-2xl font-semibold text-danger">{alerts.filter(a => a.priority === 'High').length}</div>
          <div className="text-xs text-text-muted mt-2">Requires review</div>
        </div>
        <div className="bento-card p-5">
          <div className="text-sm text-text-secondary mb-1">Auto-Mitigated</div>
          <div className="text-2xl font-semibold text-brand">100%</div>
          <div className="text-xs text-text-muted mt-2">Requires no manual intervention</div>
        </div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-surface/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search IP or Type..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-base border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:border-border-strong transition-colors"
            />
          </div>
          <div className="text-xs font-mono text-text-muted">Showing {filteredAlerts.length} alerts</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-text-muted font-mono uppercase bg-bg-base/50">
              <tr>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Source IP</th>
                <th className="px-6 py-3 font-medium">Attack Type</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium text-right">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-brand">
                    <Loader className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredAlerts.map((alert) => (
                <tr key={alert.id} className={`hover:bg-bg-panel transition-colors ${
                  alert.priority === 'High' ? 'border-l-2 border-l-danger' :
                  alert.priority === 'Medium' ? 'border-l-2 border-l-warning' :
                  'border-l-2 border-l-info'
                }`}>
                  <td className="px-6 py-3 text-text-secondary">{alert.time}</td>
                  <td className="px-6 py-3 text-text-primary">{alert.ip}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldAlert className={`w-3 h-3 ${
                        alert.priority === 'High' ? 'text-danger' :
                        alert.priority === 'Medium' ? 'text-warning' :
                        'text-info'
                      }`} />
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-md ${
                      alert.priority === 'High' ? 'bg-danger-dim text-danger' :
                      alert.priority === 'Medium' ? 'bg-warning-dim text-warning' :
                      'bg-info-dim text-info'
                    }`}>
                      {alert.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-text-muted">
                      {alert.tier}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-text-primary">{alert.action}</span>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">No alerts found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
