import React, { useEffect, useState } from 'react';
import { dbApi } from '../../lib/api';
import { Briefcase, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Cases() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      try {
        const data = await dbApi.getCases();
        setCases(data);
      } catch (err) {
        console.error('Failed to load cases:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'mitigated': 
      case 'resolved': return 'bg-green-500/20 text-green-500 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Incident Cases</h1>
          <p className="text-text-secondary mt-1">Manage and track security incidents and mitigations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-text-secondary glass-panel rounded-2xl">
            <Briefcase className="w-12 h-12 mb-4 opacity-50" />
            <p>No active incident cases found.</p>
          </div>
        ) : (
          cases.map((c) => (
            <div key={c.id} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-background-light rounded-lg">
                    {getSeverityIcon(c.severity)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{c.title}</h3>
                    <p className="text-xs text-text-secondary capitalize">{c.attack_type}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(c.status)} capitalize`}>
                  {c.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Target IP</span>
                  <span className="text-text-primary font-mono">{c.target_ip}:{c.target_port}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Packets Blocked</span>
                  <span className="text-text-primary font-bold">{c.packets_blocked.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Peak PPS</span>
                  <span className="text-text-primary">{c.peak_pps.toLocaleString()} pps</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-text-secondary line-clamp-2">{c.notes}</p>
                <div className="mt-4 flex items-center text-xs text-text-muted">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
