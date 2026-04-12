import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// Mock Data State
let trafficData = Array.from({ length: 40 }).map((_, i) => ({
  value: 10,
  timestamp: new Date(Date.now() - (39 - i) * 1000).toISOString()
}));
let cpuLoad = 12.4;
let ramUsage = 342;
let isMitigating = false;

let rules = [
  { id: '1', name: 'Tier 1: Rate Limiting', condition: '> 1000 pkt/s', action: 'Throttle to 500 pkt/s', status: 'ACTIVE', tier: 'Tier 1' },
  { id: '2', name: 'Tier 2: Connection Drop', condition: '> 5000 pkt/s', action: 'Drop new connections', status: 'ACTIVE', tier: 'Tier 3' },
  { id: '3', name: 'Tier 3: IP Block', condition: 'ML Confidence > 98%', action: 'Block IP (300s)', status: 'ACTIVE', tier: 'Tier 3' },
  { id: '4', name: 'Geo-Fence: High Risk', condition: 'Country == "XX"', action: 'Challenge (Captcha)', status: 'INACTIVE', tier: 'Tier 2' },
];

let alerts = [
  { id: '1', time: new Date(Date.now() - 10000).toLocaleTimeString(), ip: '45.22.19.10', type: 'SYN_FLOOD', action: 'blocked', tier: 'Tier 3', priority: 'High' },
  { id: '2', time: new Date(Date.now() - 45000).toLocaleTimeString(), ip: '192.168.1.104', type: 'UDP_FLOOD', action: 'rate_limit', tier: 'Tier 1', priority: 'Low' },
];

let settings = {
  engineMode: 'hybrid',
  sensitivity: 85,
  autoMitigation: true,
  maxCpu: 15,
  maxRam: 500
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Production CORS configuration
  const io = new Server(httpServer, {
    cors: { 
      origin: ALLOWED_ORIGIN,
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // Background simulation loop
  setInterval(() => {
    const isSpike = Math.random() > 0.93;
    const newTraffic = isSpike ? Math.floor(Math.random() * 80) + 30 : Math.floor(Math.random() * 15) + 8;
    
    trafficData.push({
      value: newTraffic,
      timestamp: new Date().toISOString()
    });
    if (trafficData.length > 40) trafficData.shift();

    cpuLoad = isSpike ? Math.min(cpuLoad + Math.random() * 8, 32) : Math.max(cpuLoad - Math.random() * 3, 11);
    ramUsage = isSpike ? Math.min(ramUsage + Math.random() * 60, 520) : Math.max(ramUsage - Math.random() * 12, 310);

    if (isSpike && settings.autoMitigation) {
      isMitigating = true;
      const types = ['SYN_FLOOD', 'UDP_FLOOD', 'DNS_AMP'];
      const actions = ['blocked', 'rate_limit', 'throttled'];
      const tiers = ['Tier 3', 'Tier 1', 'Tier 2'];
      const priorities = ['High', 'Low', 'Medium'];
      const idx = Math.floor(Math.random() * types.length);
      
      const newAlert = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        type: types[idx],
        action: actions[idx],
        tier: tiers[idx],
        priority: priorities[idx]
      };
      
      alerts.unshift(newAlert);
      if (alerts.length > 50) alerts.pop();
      
      // Broadcast alert via WebSocket
      io.emit('new_alert', newAlert);
      
      setTimeout(() => { isMitigating = false; }, 4000);
    }

    // Broadcast metrics via WebSocket
    io.emit('metrics', {
      traffic: trafficData,
      cpu: cpuLoad,
      ram: ramUsage,
      isMitigating
    });

    // Generate and broadcast packets + ML Detection Simulation
    const packets = Array.from({ length: 5 }).map((_, i) => {
      const isActuallyAttack = Math.random() > 0.88;
      const proto = isActuallyAttack ? 'UDP' : ['TCP', 'ICMP', 'TCP'][Math.floor(Math.random() * 3)];
      
      // Decision Layer: In a real system, this would be the ML inference result
      // We simulate the 'Think' phase here
      const decision = isActuallyAttack ? 'DROP' : 'ALLOW';
      
      return {
        id: `pkt_${Math.floor(Math.random() * 100000)}`,
        time: new Date().toISOString().split('T')[1].slice(0, 12),
        src: isActuallyAttack ? '45.22.19.10' : `192.168.1.${Math.floor(Math.random() * 255)}`,
        dst: '10.0.0.1',
        proto,
        size: isActuallyAttack ? '1024B' : `${Math.floor(Math.random() * 1400) + 64}B`,
        flag: proto === 'TCP' ? ['SYN', 'ACK', 'FIN'][Math.floor(Math.random() * 3)] : '-',
        status: decision
      };
    });
    io.emit('new_packets', packets);

    // If any packet was DROPPED, ensure mitigation UI is active
    if (packets.some(p => p.status === 'DROP')) {
      isMitigating = true;
      setTimeout(() => { isMitigating = false; }, 2000);
    }
  }, 2000);

  // API Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/metrics', (req, res) => {
    res.json({
      traffic: trafficData,
      cpu: cpuLoad,
      ram: ramUsage,
      isMitigating
    });
  });

  app.get('/api/alerts', (req, res) => {
    res.json(alerts);
  });

  // Serve static files in production if needed, or act as standalone
  if (process.env.SERVE_FRONTEND === 'true') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
    console.log(`CORS allowed for: ${ALLOWED_ORIGIN}`);
  });
}

startServer();
