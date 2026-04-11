import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Power, Search, Loader } from 'lucide-react';
import { dbApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function Rules() {
  const [rules, setRules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRules = async () => {
    try {
      const data = await dbApi.getRules();
      setRules(data);
    } catch (error: any) {
      toast.error('Failed to load mitigation rules');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleRule = async (id: string, currentStatus: string) => {
    const originalRules = [...rules];
    // Optimistic Update
    setRules(rules.map(r => r.id === id ? { ...r, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : r));
    
    try {
      await dbApi.toggleRule(id, currentStatus);
      toast.success('Rule status updated');
    } catch (error) {
      // Revert on failure
      setRules(originalRules);
      toast.error('Failed to toggle rule');
    }
  };

  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    rule.condition_value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center py-4 justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Mitigation Rules</h1>
          <p className="text-sm text-text-secondary mt-1">Manage automated graduated response tiers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search rules..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <button className="pill-button-brand px-5 py-2 text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Custom Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-brand">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredRules.map((rule) => (
          <div key={rule.id} className={`bento-card p-5 flex items-center justify-between transition-all ${rule.status === 'ACTIVE' ? 'border-border-strong' : 'opacity-60'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rule.status === 'ACTIVE' ? 'bg-brand-dim text-brand' : 'bg-bg-base text-text-muted'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary flex items-center gap-2">
                    {rule.name}
                    <span className="text-xs bg-bg-panel px-2 py-0.5 rounded-full border border-border-subtle font-mono text-text-muted">{rule.tier}</span>
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs font-mono text-text-secondary">
                  <span>IF <span className="text-text-primary">{rule.condition_type} {rule.condition_value}</span></span>
                  <span>→</span>
                  <span>THEN <span className="text-text-primary">{rule.action} {rule.action_value ? `(${rule.action_value})` : ''}</span></span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleRule(rule.id, rule.status)}
                className={`w-12 h-6 rounded-full relative transition-colors ${rule.status === 'ACTIVE' ? 'bg-brand' : 'bg-border-strong'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-bg-base transition-transform ${rule.status === 'ACTIVE' ? 'left-7' : 'left-1'}`}></div>
              </button>
              <button className="p-2 text-text-muted hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {!isLoading && filteredRules.length === 0 && (
          <div className="bento-card p-8 text-center text-text-muted">
            No rules found matching your search.
          </div>
        )}
      </div>

      <div className="mt-8 bento-card p-6 bg-danger-dim border-danger/20">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-danger/20 rounded-lg text-danger">
            <Power className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-danger">Emergency Lockdown</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Instantly drop all non-essential traffic. This will severely impact legitimate users and should only be used as a last resort when automated mitigation fails.
            </p>
            <button className="mt-4 px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
              Engage Lockdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
