import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const PORT = 3000;

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
  { id: '1', time: new Date(Date.now() - 10000).toLocaleTimeString(), ip: '45.22.19.10', type: 'SYN_FLOOD', action: 'BLOCK_IP', tier: 'Tier 3', priority: 'High' },
  { id: '2', time: new Date(Date.now() - 45000).toLocaleTimeString(), ip: '192.168.1.104', type: 'UDP_FLOOD', action: 'RATE_LIMIT', tier: 'Tier 1', priority: 'Low' },
  { id: '3', time: new Date(Date.now() - 120000).toLocaleTimeString(), ip: '10.0.0.55', type: 'HTTP_GET', action: 'THROTTLE', tier: 'Tier 2', priority: 'Medium' },
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
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.use(express.json());

  // Background simulation loop
  setInterval(() => {
    const isSpike = Math.random() > 0.9;
    const newTraffic = isSpike ? Math.floor(Math.random() * 80) + 20 : Math.floor(Math.random() * 15) + 5;
    
    trafficData.push({
      value: newTraffic,
      timestamp: new Date().toISOString()
    });
    if (trafficData.length > 40) trafficData.shift();

    cpuLoad = isSpike ? Math.min(cpuLoad + Math.random() * 5, 25) : Math.max(cpuLoad - Math.random() * 2, 8);
    ramUsage = isSpike ? Math.min(ramUsage + Math.random() * 50, 480) : Math.max(ramUsage - Math.random() * 10, 280);

    if (isSpike && settings.autoMitigation) {
      isMitigating = true;
      const types = ['SYN_FLOOD', 'UDP_FLOOD', 'HTTP_GET'];
      const actions = ['BLOCK_IP', 'RATE_LIMIT', 'THROTTLE'];
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
      
      setTimeout(() => { isMitigating = false; }, 3000);
    }

    // Broadcast metrics via WebSocket
    io.emit('metrics', {
      traffic: trafficData,
      cpu: cpuLoad,
      ram: ramUsage,
      isMitigating
    });

    // Generate and broadcast packets
    const packets = Array.from({ length: 5 }).map((_, i) => {
      const isAttack = Math.random() > 0.8;
      const proto = isAttack ? 'UDP' : ['TCP', 'ICMP', 'TCP'][Math.floor(Math.random() * 3)];
      return {
        id: `pkt_${Math.floor(Math.random() * 100000)}`,
        time: new Date().toISOString().split('T')[1].slice(0, 12),
        src: isAttack ? '45.22.19.10' : `192.168.1.${Math.floor(Math.random() * 255)}`,
        dst: '10.0.0.1',
        proto,
        size: isAttack ? '1024B' : `${Math.floor(Math.random() * 1400) + 64}B`,
        flag: proto === 'TCP' ? ['SYN', 'ACK', 'FIN'][Math.floor(Math.random() * 3)] : '-',
        status: isAttack ? 'DROP' : 'ALLOW'
      };
    });
    io.emit('new_packets', packets);
  }, 1000);

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.4-live' });
  });

  app.get('/api/health/detailed', (req, res) => {
    res.json({
      status: 'ok',
      services: [
        { name: 'Backend API', status: 'operational', latency: Math.floor(Math.random() * 20) + 5 },
        { name: 'Database (SQLite)', status: 'operational', latency: Math.floor(Math.random() * 10) + 2 },
        { name: 'ML Engine', status: 'operational', latency: Math.floor(Math.random() * 50) + 10 },
        { name: 'Packet Capture', status: 'operational', latency: Math.floor(Math.random() * 5) + 1 }
      ],
      lastChecked: new Date().toISOString()
    });
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

  app.get('/api/packets', (req, res) => {
    const packets = Array.from({ length: 15 }).map((_, i) => {
      const isAttack = Math.random() > 0.8;
      const proto = isAttack ? 'UDP' : ['TCP', 'ICMP', 'TCP'][Math.floor(Math.random() * 3)];
      return {
        id: `pkt_${Math.floor(Math.random() * 10000)}`,
        time: new Date(Date.now() - i * 100).toISOString().split('T')[1].slice(0, 12),
        src: isAttack ? '45.22.19.10' : `192.168.1.${Math.floor(Math.random() * 255)}`,
        dst: '10.0.0.1',
        proto,
        size: isAttack ? '1024B' : `${Math.floor(Math.random() * 1400) + 64}B`,
        flag: proto === 'TCP' ? ['SYN', 'ACK', 'FIN'][Math.floor(Math.random() * 3)] : '-',
        status: isAttack ? 'DROP' : 'ALLOW'
      };
    });
    res.json(packets);
  });

  app.get('/api/rules', (req, res) => {
    res.json(rules);
  });

  app.post('/api/rules/:id/toggle', (req, res) => {
    const rule = rules.find(r => r.id === req.params.id);
    if (rule) {
      rule.status = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      res.json(rule);
    } else {
      res.status(404).json({ error: 'Rule not found' });
    }
  });

  app.get('/api/settings', (req, res) => {
    res.json(settings);
  });

  app.post('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
