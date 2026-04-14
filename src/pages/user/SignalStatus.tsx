import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RadioReceiver, Activity, CheckCircle, Wifi, Server } from 'lucide-react';
import { io } from 'socket.io-client';

export default function SignalStatus() {
  const [status, setStatus] = useState('Checking...');
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const socketOrigin = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketOrigin, {
      transports: ['websocket', 'polling']
    });
    const start = performance.now();

    socket.on('connect', () => {
      setStatus('Connected');
      setLatency(Math.round(performance.now() - start));
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Signal Status</h1>
          <p className="text-sm text-text-secondary mt-1">Live connection telemetry with the DDoS Mitigation core.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          transition={{ delay: 0.1 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Core Latency</span>
            <Activity className="w-5 h-5 text-info" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">{latency > 0 ? `${latency}ms` : '--'}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bento-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">System Nodes</span>
            <Server className="w-5 h-5 text-text-primary" />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Backend API</span>
              <span className="text-brand font-mono">Live</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">PostgreSQL DB</span>
              <span className="text-brand font-mono">Live</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">ML Inference</span>
              <span className="text-brand font-mono">Standby</span>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
