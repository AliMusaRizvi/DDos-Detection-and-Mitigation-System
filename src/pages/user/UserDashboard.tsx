import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { dbApi } from '../../lib/api';

export default function UserDashboard() {
  const [stats, setStats] = useState({
    activeAlerts: '0',
    recentLogs: '0',
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [alerts, logs] = await Promise.all([
          dbApi.getAlerts(),
          dbApi.getLogs()
        ]);
        setStats({
          activeAlerts: alerts.length.toString(),
          recentLogs: logs.length.toString(),
        });
      } catch (e) {
        console.error('Failed to load user stats', e);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">My Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Personal network health overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Network Status</span>
            <ShieldCheck className="w-5 h-5 text-brand" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">Protected</span>
            <span className="text-xs font-mono text-brand bg-brand-dim px-2 py-1 rounded-md">Online</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Global Threat Level</span>
            <Activity className="w-5 h-5 text-warning" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">Elevated</span>
            <div className="flex items-center gap-1 text-xs font-mono text-warning">
              <ArrowUpRight className="w-3 h-3" />
              Monitoring
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bento-card p-6 mt-8">
        <h3 className="text-sm font-medium text-text-primary mb-4">Account Information</h3>
        <p className="text-text-secondary text-sm">
          You are currently logged into the SafeBrowse user portal. Your access is restricted to personal monitoring and public status alerts. If you require mitigation controls or administrator privileges to modify active firewall rules, please contact your network administrator.
        </p>
      </div>
    </div>
  );
}
