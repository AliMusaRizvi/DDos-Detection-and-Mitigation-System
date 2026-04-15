import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RadioReceiver, Activity, Server, ShieldCheck, Wifi, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';
import { mlApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';

type ServiceState = 'checking' | 'operational' | 'degraded' | 'offline';

type ServiceHealth = {
  websocket: ServiceState;
  database: ServiceState;
  ml: ServiceState;
};

const getServiceClass = (state: ServiceState) => {
  if (state === 'operational') return 'text-brand';
  if (state === 'checking') return 'text-info';
  if (state === 'degraded') return 'text-warning';
  return 'text-danger';
};

export default function SignalStatus() {
  const [status, setStatus] = useState<'Connected' | 'Disconnected' | 'Checking...'>('Checking...');
  const [latency, setLatency] = useState(0);
  const [packetStats, setPacketStats] = useState({ allow: 0, drop: 0 });
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    websocket: 'checking',
    database: 'checking',
    ml: 'checking',
  });

  useEffect(() => {
    const socketOrigin = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketOrigin, {
      transports: ['websocket', 'polling'],
    });
    const start = performance.now();

    const checkServices = async () => {
      const [mlHealthy, dbProbe] = await Promise.all([
        mlApi.checkHealth(),
        supabase.from('ddos_attack_logs').select('id').limit(1),
      ]);

      setServiceHealth((prev) => ({
        ...prev,
        database: dbProbe.error ? 'degraded' : 'operational',
        ml: mlHealthy ? 'operational' : 'offline',
      }));
    };

    socket.on('connect', () => {
      setStatus('Connected');
      setLatency(Math.round(performance.now() - start));
      setServiceHealth((prev) => ({ ...prev, websocket: 'operational' }));
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected');
      setServiceHealth((prev) => ({ ...prev, websocket: 'offline' }));
    });

    socket.on('new_packets', (newPackets: any[]) => {
      const safePackets = Array.isArray(newPackets) ? newPackets : [];
      const allowCount = safePackets.filter((pkt) => String(pkt?.status ?? '').toUpperCase() === 'ALLOW').length;
      const dropCount = safePackets.filter((pkt) => String(pkt?.status ?? '').toUpperCase() === 'DROP').length;

      setPacketStats((prev) => ({
        allow: prev.allow + allowCount,
        drop: prev.drop + dropCount,
      }));
    });

    void checkServices();
    const interval = setInterval(() => {
      void checkServices();
    }, 20000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Signal Status</h1>
          <p className="text-sm text-text-secondary mt-1">Live connectivity and mitigation decision stream for user-facing confidence.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">WebSocket Status</span>
            <RadioReceiver className={`w-5 h-5 ${status === 'Connected' ? 'text-brand' : 'text-danger'}`} />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-xl font-semibold text-text-primary">{status}</span>
            {status === 'Connected' && (
              <span className="flex h-3 w-3 relative ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Core Latency</span>
            <Activity className="w-5 h-5 text-info" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">{latency > 0 ? `${latency}ms` : '--'}</span>
            <span className="text-xs font-mono text-text-secondary">Round trip</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Traffic Decisions</span>
            <ShieldCheck className="w-5 h-5 text-brand" />
          </div>
          <div className="space-y-1 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-text-secondary">Allowed</span>
              <span className="text-brand">{packetStats.allow}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Dropped</span>
              <span className="text-danger">{packetStats.drop}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">User Benefit</span>
            <Wifi className="w-5 h-5 text-text-primary" />
          </div>
          <p className="text-sm text-text-secondary">
            You can confirm in real time whether protection is active and whether suspicious traffic is being dropped before service impact.
          </p>
        </motion.div>
      </div>

      <div className="bento-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Server className="w-5 h-5 text-info" />
          <h2 className="text-lg font-medium text-text-primary">Service Health Matrix</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-bg-base border border-border-subtle p-4 rounded-lg">
            <div className="text-sm text-text-secondary mb-1">WebSocket Stream</div>
            <div className={`font-mono text-sm uppercase ${getServiceClass(serviceHealth.websocket)}`}>
              {serviceHealth.websocket}
            </div>
          </div>
          <div className="bg-bg-base border border-border-subtle p-4 rounded-lg">
            <div className="text-sm text-text-secondary mb-1">Database Reachability</div>
            <div className={`font-mono text-sm uppercase ${getServiceClass(serviceHealth.database)}`}>
              {serviceHealth.database}
            </div>
          </div>
          <div className="bg-bg-base border border-border-subtle p-4 rounded-lg">
            <div className="text-sm text-text-secondary mb-1">ML Inference</div>
            <div className={`font-mono text-sm uppercase ${getServiceClass(serviceHealth.ml)}`}>
              {serviceHealth.ml}
            </div>
          </div>
        </div>
      </div>

      <div className="bento-card p-6 bg-brand-dim border-brand/20">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-brand mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-text-primary">What Users Should Do</h3>
            <p className="text-sm text-text-secondary mt-2">
              If dropped traffic rapidly increases or WebSocket/Database becomes degraded, report the timestamp and signal status immediately to admins for deeper mitigation adjustments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}