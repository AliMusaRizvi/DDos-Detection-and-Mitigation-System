import React, { useEffect, useState } from 'react';
import { Shield, Plus, Trash2, Power, Search, Loader, X } from 'lucide-react';
import { dbApi } from '../../lib/api';
import toast from 'react-hot-toast';

type RuleRow = {
  id: string;
  name: string;
  tier: number;
  condition: string;
  action: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
};

const toUiError = (error: any, fallbackMessage: string) => {
  const message = String(error?.message ?? fallbackMessage);
  if (/row-level security policy/i.test(message)) {
    return 'Permission denied by Supabase RLS. Sign in with an authenticated admin account to modify rules.';
  }

  return message;
};

export default function Rules() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLockdownLoading, setIsLockdownLoading] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    tier: 1,
    condition: '',
    action: 'rate_limit',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const fetchRules = async () => {
    try {
      const data = await dbApi.getRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(toUiError(error, 'Failed to load mitigation rules'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchRules();
  }, []);

  const toggleRule = async (id: string, currentStatus: string) => {
    const originalRules = [...rules];
    const isCurrentlyActive = String(currentStatus).toUpperCase() === 'ACTIVE';

    setRules(prev => prev.map(rule => (
      rule.id === id
        ? { ...rule, status: isCurrentlyActive ? 'INACTIVE' : 'ACTIVE' }
        : rule
    )));

    try {
      await dbApi.toggleRule(id, currentStatus);
      toast.success('Rule status updated');
    } catch (error: any) {
      setRules(originalRules);
      toast.error(toUiError(error, 'Failed to toggle rule'));
    }
  };

  const handleCreateRule = async () => {
    const name = newRule.name.trim();
    const condition = newRule.condition.trim();
    const action = newRule.action.trim();

    if (!name || !condition || !action) {
      toast.error('Name, condition, and action are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await dbApi.createRule({
        name,
        tier: newRule.tier,
        condition,
        action,
        status: newRule.status,
      });

      setRules(prev => [created as RuleRow, ...prev]);
      setIsCreating(false);
      setNewRule({
        name: '',
        tier: 1,
        condition: '',
        action: 'rate_limit',
        status: 'ACTIVE',
      });
      toast.success('Mitigation rule added');
    } catch (error: any) {
      toast.error(toUiError(error, 'Failed to add rule'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    const confirmed = window.confirm('Delete this mitigation rule? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    const originalRules = [...rules];
    setRules(prev => prev.filter(rule => rule.id !== id));

    try {
      await dbApi.deleteRule(id);
      toast.success('Rule deleted');
    } catch (error: any) {
      setRules(originalRules);
      toast.error(toUiError(error, 'Failed to delete rule'));
    }
  };

  const handleSeedDefaultRules = async () => {
    setIsSubmitting(true);
    try {
      const defaults = [
        {
          name: 'Tier 1 - Rate Limiting',
          tier: 1,
          condition: 'packet_rate > 1000',
          action: 'rate_limit',
          status: 'ACTIVE' as const,
        },
        {
          name: 'Tier 2 - Connection Drop',
          tier: 2,
          condition: 'packet_rate > 5000',
          action: 'drop_connections',
          status: 'ACTIVE' as const,
        },
        {
          name: 'Tier 3 - Temporary Block',
          tier: 3,
          condition: 'ml_confidence > 98',
          action: 'block_ip_300s',
          status: 'ACTIVE' as const,
        },
      ];

      for (const rule of defaults) {
        await dbApi.createRule(rule);
      }

      await fetchRules();
      toast.success('Default mitigation rules seeded');
    } catch (error: any) {
      toast.error(toUiError(error, 'Failed to seed default rules'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEngageLockdown = async () => {
    if (rules.length === 0) {
      toast.error('No rules available. Add or seed rules first.');
      return;
    }

    setIsLockdownLoading(true);
    try {
      const inactiveRules = rules.filter(rule => String(rule.status).toUpperCase() !== 'ACTIVE');

      for (const rule of inactiveRules) {
        await dbApi.toggleRule(rule.id, rule.status);
      }

      await fetchRules();
      toast.success('Emergency lockdown engaged. All rules are now active.');
    } catch (error: any) {
      toast.error(toUiError(error, 'Failed to engage lockdown'));
    } finally {
      setIsLockdownLoading(false);
    }
  };

  const filteredRules = rules.filter(rule => {
    const query = searchQuery.toLowerCase();
    return (
      String(rule.name ?? '').toLowerCase().includes(query)
      || String(rule.condition ?? '').toLowerCase().includes(query)
      || String(rule.action ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center py-4 justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Mitigation Rules</h1>
          <p className="text-sm text-text-secondary mt-1">Manage automated graduated response tiers from the ddos_mitigation_rules table.</p>
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
          <button
            onClick={() => setIsCreating(true)}
            className="pill-button-brand px-5 py-2 text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Custom Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-brand">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredRules.map((rule) => {
          const isActive = String(rule.status).toUpperCase() === 'ACTIVE';

          return (
            <div key={rule.id} className={`bento-card p-5 flex items-center justify-between transition-all ${isActive ? 'border-border-strong' : 'opacity-60'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-brand-dim text-brand' : 'bg-bg-base text-text-muted'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-text-primary flex items-center gap-2">
                    {rule.name}
                    <span className="text-xs bg-bg-panel px-2 py-0.5 rounded-full border border-border-subtle font-mono text-text-muted">Tier {rule.tier}</span>
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs font-mono text-text-secondary">
                    <span>IF <span className="text-text-primary">{rule.condition || '-'}</span></span>
                    <span>→</span>
                    <span>THEN <span className="text-text-primary">{rule.action || '-'}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleRule(rule.id, rule.status)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-brand' : 'bg-border-strong'}`}
                  title={isActive ? 'Disable rule' : 'Enable rule'}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-bg-base transition-transform ${isActive ? 'left-7' : 'left-1'}`}></div>
                </button>
                <button
                  className="p-2 text-text-muted hover:text-danger transition-colors"
                  onClick={() => handleDeleteRule(rule.id)}
                  title="Delete rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {!isLoading && filteredRules.length === 0 && (
          <div className="bento-card p-8 text-center text-text-muted">
            <p>No rules found matching your search.</p>
            <button
              onClick={handleSeedDefaultRules}
              disabled={isSubmitting}
              className="mt-4 px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Seeding...' : 'Seed Default Rules'}
            </button>
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
              Instantly enforce all configured mitigation rules. This may impact legitimate traffic and should be used only in severe attack scenarios.
            </p>
            <button
              onClick={handleEngageLockdown}
              disabled={isLockdownLoading}
              className="mt-4 px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLockdownLoading ? 'Engaging...' : 'Engage Lockdown'}
            </button>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-strong rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-panel">
              <h3 className="text-lg font-medium text-text-primary">Create Mitigation Rule</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                  placeholder="Tier 2 - SYN Flood Clamp"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Tier</label>
                  <select
                    value={newRule.tier}
                    onChange={(e) => setNewRule(prev => ({ ...prev, tier: Number(e.target.value) }))}
                    className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                  >
                    <option value={1}>Tier 1</option>
                    <option value={2}>Tier 2</option>
                    <option value={3}>Tier 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Status</label>
                  <select
                    value={newRule.status}
                    onChange={(e) => setNewRule(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
                    className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Condition</label>
                <input
                  type="text"
                  value={newRule.condition}
                  onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                  placeholder="packet_rate > 5000"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Action</label>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                >
                  <option value="rate_limit">rate_limit</option>
                  <option value="drop_connections">drop_connections</option>
                  <option value="block_ip_300s">block_ip_300s</option>
                  <option value="challenge">challenge</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-border-subtle bg-bg-panel flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary hover:border-border-strong transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={isSubmitting}
                className="px-4 py-2 bg-text-primary text-bg-base rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}