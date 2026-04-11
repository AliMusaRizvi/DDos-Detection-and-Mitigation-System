import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldAlert, Cpu, Network, Server, ArrowLeft, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [traffic, setTraffic] = useState<number[]>(Array(20).fill(10));
  const [cpu, setCpu] = useState(12);
  const [ram, setRam] = useState(320);
  const [status, setStatus] = useState<'NORMAL' | 'WARNING' | 'MITIGATING'>('NORMAL');

  // Simulate live data
  useEffect(() => {
    const interval = setInterval(() => {
      const isAttack = Math.random() > 0.85;
      const newTraffic = isAttack ? Math.floor(Math.random() * 80) + 20 : Math.floor(Math.random() * 15) + 5;
      
      setTraffic(prev => [...prev.slice(1), newTraffic]);
      
      if (isAttack) {
        setCpu(prev => Math.min(prev + Math.random() * 5, 25));
        setRam(prev => Math.min(prev + Math.random() * 50, 480));
        setStatus('MITIGATING');
        setTimeout(() => setStatus('NORMAL'), 3000);
      } else {
        setCpu(prev => Math.max(prev - Math.random() * 2, 8));
        setRam(prev => Math.max(prev - Math.random() * 10, 280));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch(status) {
      case 'NORMAL': return 'text-neon-green border-neon-green bg-neon-green/10';
      case 'WARNING': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'MITIGATING': return 'text-red-500 border-red-500 bg-red-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-300 font-sans flex flex-col">
      {/* Dashboard Header */}
      <header className="h-16 border-b border-card-border bg-card-bg flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="font-display font-bold text-xl tracking-wider text-white">
            DDoS<span className="text-neon-blue">DEFEND</span> <span className="text-slate-600 font-mono text-sm ml-2">v1.0.4-live</span>
          </div>
        </div>
        <div className={`px-3 py-1 border font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${getStatusColor()}`}>
          {status === 'NORMAL' && <CheckCircle2 className="w-4 h-4" />}
          {status === 'WARNING' && <AlertTriangle className="w-4 h-4" />}
          {status === 'MITIGATING' && <ShieldAlert className="w-4 h-4 animate-pulse" />}
          SYSTEM: {status}
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card-bg border border-card-border p-6">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs mb-4">
              <Cpu className="w-4 h-4" /> CPU UTILIZATION
            </div>
            <div className="text-4xl font-display font-bold text-white mb-2">
              {cpu.toFixed(1)}<span className="text-xl text-slate-500">%</span>
            </div>
            <div className="w-full h-1 bg-dark-bg overflow-hidden">
              <div className="h-full bg-neon-blue transition-all duration-500" style={{ width: `${(cpu / 100) * 100}%` }}></div>
            </div>
            <div className="text-xs font-mono text-slate-500 mt-2 text-right">Target: &lt;15%</div>
          </div>

          <div className="bg-card-bg border border-card-border p-6">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs mb-4">
              <Server className="w-4 h-4" /> RAM USAGE
            </div>
            <div className="text-4xl font-display font-bold text-white mb-2">
              {ram.toFixed(0)}<span className="text-xl text-slate-500">MB</span>
            </div>
            <div className="w-full h-1 bg-dark-bg overflow-hidden">
              <div className="h-full bg-neon-green transition-all duration-500" style={{ width: `${(ram / 1024) * 100}%` }}></div>
            </div>
            <div className="text-xs font-mono text-slate-500 mt-2 text-right">Target: &lt;500MB</div>
          </div>

          <div className="bg-card-bg border border-card-border p-6">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs mb-4">
              <Target className="w-4 h-4" /> ML CONFIDENCE
            </div>
            <div className="text-4xl font-display font-bold text-white mb-2">
              98.4<span className="text-xl text-slate-500">%</span>
            </div>
            <div className="text-xs font-mono text-neon-blue">Random Forest + XGBoost Ensemble</div>
          </div>
        </div>

        {/* Center/Right Column: Main Graph & Logs */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Live Traffic Graph */}
          <div className="bg-card-bg border border-card-border p-6 flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-green"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-white font-mono text-sm">
                <Activity className="w-5 h-5 text-neon-blue" />
                NETWORK TRAFFIC (PACKETS/SEC)
              </div>
              <div className="text-xs font-mono text-slate-500">Scapy Capture Interface: eth0</div>
            </div>
            
            <div className="flex-1 flex items-end gap-1">
              {traffic.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group">
                  <div 
                    className={`w-full transition-all duration-300 ${val > 50 ? 'bg-red-500' : 'bg-neon-blue'}`} 
                    style={{ height: `${val}%`, opacity: val > 50 ? 0.8 : 0.4 }}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          {/* Mitigation Logs */}
          <div className="bg-card-bg border border-card-border p-6 h-64 flex flex-col">
            <div className="flex items-center gap-2 text-white font-mono text-sm mb-4">
              <ShieldAlert className="w-5 h-5 text-neon-green" />
              ACTIVE MITIGATION LOGS
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 custom-scrollbar">
              <div className="flex gap-4 text-slate-500 border-b border-card-border pb-2 mb-2">
                <div className="w-24">TIMESTAMP</div>
                <div className="w-32">SOURCE IP</div>
                <div className="w-24">PREDICTION</div>
                <div className="flex-1">ACTION TAKEN</div>
              </div>
              
              <div className="flex gap-4 text-slate-300 py-1">
                <div className="w-24 text-slate-500">11:42:05</div>
                <div className="w-32">192.168.1.104</div>
                <div className="w-24 text-neon-green">NORMAL</div>
                <div className="flex-1 text-slate-500">ALLOW</div>
              </div>
              <div className="flex gap-4 text-slate-300 py-1">
                <div className="w-24 text-slate-500">11:41:58</div>
                <div className="w-32">45.22.19.10</div>
                <div className="w-24 text-red-400">SYN_FLOOD</div>
                <div className="flex-1 text-red-400">RATE_LIMIT (Tier 1)</div>
              </div>
              <div className="flex gap-4 text-slate-300 py-1">
                <div className="w-24 text-slate-500">11:41:55</div>
                <div className="w-32">45.22.19.10</div>
                <div className="w-24 text-red-500">SYN_FLOOD</div>
                <div className="flex-1 text-red-500">BLOCK_IP (Tier 3)</div>
              </div>
              <div className="flex gap-4 text-slate-300 py-1">
                <div className="w-24 text-slate-500">11:40:12</div>
                <div className="w-32">10.0.0.55</div>
                <div className="w-24 text-neon-green">NORMAL</div>
                <div className="flex-1 text-slate-500">ALLOW</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
