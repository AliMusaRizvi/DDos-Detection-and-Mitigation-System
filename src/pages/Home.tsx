import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Shield, Activity, Target, Cpu, ShieldAlert, Terminal, Lock, Network, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LiveTrafficGraph = () => {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    setBars(Array.from({ length: 40 }).map(() => Math.random() * 100));
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 100));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full h-48 opacity-10 flex items-end gap-1 px-4 pointer-events-none z-0">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-brand"
          animate={{ height: `${height}%` }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 40;
    const y = (clientY / innerHeight - 0.5) * 40;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div onMouseMove={handleMouseMove} className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-grid-subtle">
        <motion.div 
          className="absolute inset-0 z-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 0, 0.15), transparent 60%)',
            x: smoothMouseX,
            y: smoothMouseY,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-base/50 to-bg-base"></div>
        <LiveTrafficGraph />
        
        <motion.div style={{ y: y1 }} className="relative z-10 max-w-5xl mx-auto px-6 text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-strong bg-bg-surface/50 text-text-secondary text-xs font-medium tracking-wide mb-8 backdrop-blur-sm">
              <span className="status-dot active"></span>
              ACTIVE MONITORING: ONLINE
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter mb-6 text-text-primary leading-[1.1]">
              Lightweight & <br/>
              Real-Time <br/>
              <span className="text-text-muted">Network Protection</span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12 font-normal leading-relaxed">
              An efficient defense system designed for resource-constrained environments. 
              Balancing high-accuracy volumetric DDoS detection with minimal computational overhead.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/admin" 
                className="relative group px-8 py-4 text-base font-medium w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand text-bg-base rounded-full overflow-hidden transition-all hover:scale-105"
              >
                <span className="absolute inset-0 w-full h-full bg-brand rounded-full animate-ping opacity-20"></span>
                <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:bg-transparent transition-colors"></span>
                <Activity className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Live Dashboard</span>
              </Link>
              
              <Link to="/about" className="pill-button px-8 py-4 text-base font-medium text-text-primary w-full sm:w-auto inline-flex items-center justify-center">
                View Architecture
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 relative z-10 bg-bg-surface border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary mb-4">Core Capabilities</h2>
            <p className="text-text-secondary">Engineered for performance and precision.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Cpu className="w-6 h-6 text-brand" />,
                title: "Lightweight ML Engine",
                desc: "Optimized Random Forest and XGBoost classifiers maintaining under 15% CPU utilization and 500MB RAM footprint."
              },
              {
                icon: <Activity className="w-6 h-6 text-info" />,
                title: "Real-Time Monitoring",
                desc: "Continuous network traffic capture and high-speed feature extraction powered by Scapy for instantaneous analysis."
              },
              {
                icon: <Target className="w-6 h-6 text-brand" />,
                title: "95% Accuracy Standard",
                desc: "High-precision detection of volumetric attacks with a false positive rate strictly maintained under 2%."
              },
              {
                icon: <ShieldAlert className="w-6 h-6 text-warning" />,
                title: "Automated Mitigation",
                desc: "Three-tier graduated response system: rate limiting, connection throttling, and temporary IP blocking."
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bento-card p-8 group hover:border-brand/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-bg-panel border border-border-subtle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-3 tracking-tight">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section id="pipeline" className="py-32 relative z-10 bg-bg-base border-t border-border-subtle overflow-hidden">
        <motion.div style={{ y: y2 }} className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary mb-4">Detection Pipeline</h2>
            <p className="text-text-muted font-mono text-sm uppercase tracking-widest">System Architecture v1.0</p>
          </motion.div>
          
          <div className="flex flex-col md:flex-row items-start justify-between relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-border-subtle">
              <div className="h-full bg-brand w-1/4 animate-[slide_4s_ease-in-out_infinite_alternate]"></div>
            </div>
            
            {[
              {
                num: "01",
                title: "Traffic Capture",
                desc: "Real-time monitoring using Scapy to intercept and parse packets at the network interface level.",
                icon: <Network className="w-6 h-6" />
              },
              {
                num: "02",
                title: "ML Classification",
                desc: "Statistical analysis via Random Forest & XGBoost to detect anomalous volumetric patterns.",
                icon: <Cpu className="w-6 h-6" />
              },
              {
                num: "03",
                title: "Active Mitigation",
                desc: "Automated response triggers execute throttling or blocking rules via iptables/firewall.",
                icon: <Shield className="w-6 h-6" />
              }
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative flex flex-col items-center text-center w-full md:w-1/3 px-4 mb-16 md:mb-0"
              >
                <div className="w-24 h-24 rounded-2xl bg-bg-surface border border-border-strong flex items-center justify-center mb-8 relative z-10 group transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,0,0.15)]">
                  <div className="text-text-primary">{s.icon}</div>
                  <div className="absolute -top-3 -right-3 bg-text-primary text-bg-base font-mono text-xs font-bold px-2 py-1 rounded-md">
                    {s.num}
                  </div>
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-3 tracking-tight">{s.title}</h3>
                <p className="text-text-secondary text-sm max-w-xs">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Technical Specs */}
      <section id="specs" className="py-24 relative z-10 bg-bg-surface border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary mb-8">Technical Stack</h2>
              <div className="bento-card overflow-hidden font-mono text-sm">
                <div className="flex border-b border-border-subtle bg-bg-panel p-4 text-text-muted uppercase tracking-wider text-xs">
                  <div className="w-1/3">Component</div>
                  <div className="w-2/3">Technology</div>
                </div>
                <div className="data-row p-4">
                  <div className="w-1/3 text-text-primary">Core Engine</div>
                  <div className="w-2/3 text-text-secondary">Python 3.10</div>
                </div>
                <div className="data-row p-4">
                  <div className="w-1/3 text-text-primary">Machine Learning</div>
                  <div className="w-2/3 text-text-secondary">Scikit-learn (Random Forest, XGBoost)</div>
                </div>
                <div className="data-row p-4">
                  <div className="w-1/3 text-text-primary">Packet Analysis</div>
                  <div className="w-2/3 text-text-secondary">Scapy</div>
                </div>
                <div className="data-row p-4 border-b-0">
                  <div className="w-1/3 text-text-primary">Data Storage</div>
                  <div className="w-2/3 text-text-secondary">Supabase (PostgreSQL) + Edge Functions</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center"
            >
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bento-card p-8 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-dim rounded-bl-full -z-10 transition-transform duration-700 group-hover:scale-150"></div>
                <Lock className="w-8 h-8 text-brand mb-6" />
                <h3 className="text-xl font-medium text-text-primary mb-3 tracking-tight">UK GDPR Compliant</h3>
                <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                  Designed with privacy by default. The system performs metadata-only analysis, ensuring no payload inspection or PII storage occurs during traffic monitoring.
                </p>
                <div className="inline-flex items-center gap-2 text-brand font-mono text-xs font-medium bg-brand-dim px-3 py-1.5 rounded-md">
                  <Shield className="w-4 h-4" />
                  Privacy Preserved
                </div>
              </motion.div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 bg-bg-base border-t border-border-subtle text-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-6 relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary mb-6">System Health Trigger</h2>
          <p className="text-lg text-text-secondary mb-12 max-w-2xl mx-auto">
            Access the live dashboard to monitor current network traffic, view ML classification confidence scores, and manage active mitigation rules.
          </p>
          <Link to="/admin" className="relative group pill-button-brand px-10 py-5 text-lg font-medium inline-flex items-center gap-3 overflow-hidden">
            <span className="absolute inset-0 w-full h-full bg-brand rounded-full animate-ping opacity-20"></span>
            <span className="relative z-10 flex items-center gap-3">
              <Terminal className="w-5 h-5" />
              Initialize Dashboard
              <ArrowRight className="w-5 h-5" />
            </span>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

