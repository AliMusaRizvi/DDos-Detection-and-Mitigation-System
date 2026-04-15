import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, AlertTriangle, ArrowUpRight, CheckCircle2, Clock3 } from 'lucide-react';
import { dbApi } from '../../lib/api';

type EventItem = {
  id: string;
  time: string;
  source: string;
  attackType: string;
  action: string;
  priority: string;
};

type DashboardSummary = {
  activeAlerts: number;
  recentLogs: number;
  blockedAlerts: number;
  uniqueSources: number;
  protectionScore: number;
  mitigationRate: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  lastDetectionText: string;
};

const defaultSummary: DashboardSummary = {
  activeAlerts: 0,
  recentLogs: 0,
  blockedAlerts: 0,
  uniqueSources: 0,
  protectionScore: 100,
  mitigationRate: 100,
  riskLevel: 'Low',
  lastDetectionText: 'No recent threats detected',
};

const toPriorityLabel = (priority: string) => {
  const normalized = String(priority ?? '').toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  return 'Low';
};

const toRiskLevel = (alertCount: number, mitigationRate: number): DashboardSummary['riskLevel'] => {
  if (alertCount === 0) return 'Low';
  if (mitigationRate >= 80) return 'Moderate';
  return 'High';
};

export default function UserDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [alerts, logs] = await Promise.all([
          dbApi.getAlerts(),
          dbApi.getLogs(),
        ]);

        const safeAlerts = Array.isArray(alerts) ? alerts : [];
        const safeLogs = Array.isArray(logs) ? logs : [];

        const blockedAlerts = safeAlerts.filter((item: any) => String(item.action_taken ?? '').toLowerCase() === 'blocked').length;
        const activeAlerts = safeAlerts.length;
        const mitigationRate = activeAlerts > 0 ? Math.round((blockedAlerts / activeAlerts) * 100) : 100;
        const uniqueSources = new Set(
          safeAlerts
            .map((item: any) => String(item.source_ip ?? '').trim())
            .filter(Boolean)
        ).size;

        const protectionScore = activeAlerts > 0
          ? Math.max(60, Math.min(100, mitigationRate))
          : 100;

        const latestThreatTimestamp = safeAlerts[0]?.created_at;
        const lastDetectionText = latestThreatTimestamp
          ? new Date(latestThreatTimestamp).toLocaleString()
          : 'No recent threats detected';

        const recentEvents = safeAlerts.slice(0, 5).map((item: any) => ({
          id: String(item.id),
          time: new Date(item.created_at).toLocaleTimeString(),
          source: String(item.source_ip ?? 'Unknown'),
          attackType: String(item.attack_type ?? 'Unknown'),
          action: String(item.action_taken ?? 'logged'),
          priority: toPriorityLabel(String(item.priority ?? 'low')),
        }));

        setSummary({
          activeAlerts,
          recentLogs: safeLogs.length,
          blockedAlerts,
          uniqueSources,
          protectionScore,
          mitigationRate,
          riskLevel: toRiskLevel(activeAlerts, mitigationRate),
          lastDetectionText,
        });
        setEvents(recentEvents);
      } catch (error) {
        console.error('Failed to load user stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, []);

  const riskColorClass = useMemo(() => {
    if (summary.riskLevel === 'High') return 'text-danger';
    if (summary.riskLevel === 'Moderate') return 'text-warning';
    return 'text-brand';
  }, [summary.riskLevel]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">My Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Your personal protection snapshot and actionable security signal summary.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Protection Score</span>
            <ShieldCheck className="w-5 h-5 text-brand" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">{summary.protectionScore}/100</span>
            <span className="text-xs font-mono text-brand bg-brand-dim px-2 py-1 rounded-md">User Safe</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Threat Signals</span>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">{summary.activeAlerts}</span>
            <div className="flex items-center gap-1 text-xs font-mono text-warning">
              <ArrowUpRight className="w-3 h-3" />
              Risk {summary.riskLevel}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Auto Mitigation</span>
            <CheckCircle2 className="w-5 h-5 text-brand" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">{summary.mitigationRate}%</span>
            <span className="text-xs font-mono text-text-secondary">{summary.blockedAlerts} blocked</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Recent Activity</span>
            <Activity className="w-5 h-5 text-info" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">{summary.recentLogs}</span>
            <span className="text-xs font-mono text-text-secondary">{summary.uniqueSources} sources</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bento-card overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">Recent Security Events (User View)</h3>
            <span className={`text-xs font-mono ${riskColorClass}`}>Current Risk: {summary.riskLevel}</span>
          </div>

          <div className="divide-y divide-border-subtle">
            {isLoading ? (
              <div className="p-6 text-text-muted text-sm">Loading user events...</div>
            ) : events.length === 0 ? (
              <div className="p-6 text-text-muted text-sm">No threat events in your current window.</div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="p-4 flex items-center justify-between hover:bg-bg-panel transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      event.priority === 'High' ? 'bg-danger' : event.priority === 'Medium' ? 'bg-warning' : 'bg-info'
                    }`}></div>
                    <div className="font-mono text-sm text-text-primary">{event.source}</div>
                    <div className="text-xs text-text-secondary">{event.attackType}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-text-secondary">{event.action}</div>
                    <div className="text-xs font-mono text-text-muted">{event.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">How You Benefit</h3>
          <div className="space-y-3 text-sm text-text-secondary">
            <p>
              1. Early warning visibility: you can see threat trends before they impact your browsing or app experience.
            </p>
            <p>
              2. Transparent mitigation confidence: blocked-threat ratio shows how effectively the platform is neutralizing attacks.
            </p>
            <p>
              3. Faster incident communication: source and attack type details help you report concrete evidence to admins.
            </p>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <h4 className="text-xs uppercase tracking-wider text-text-muted mb-2">Last Detection</h4>
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <Clock3 className="w-4 h-4 text-info" />
              <span>{summary.lastDetectionText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}