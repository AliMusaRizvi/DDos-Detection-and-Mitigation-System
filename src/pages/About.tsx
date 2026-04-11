import React from 'react';
import { motion } from 'motion/react';
import { FileText, GraduationCap, Database, Cpu, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen py-20 px-6 relative bg-bg-base">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary mb-4">
            Project Methodology
          </h1>
          <p className="text-lg text-text-secondary font-normal leading-relaxed max-w-2xl mx-auto">
            Real-Time DDoS Detection and Mitigation System Using Machine Learning.
            A Final Year Project developed at the University of Greenwich.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bento-card p-8"
          >
            <GraduationCap className="w-6 h-6 text-text-primary mb-6" />
            <h2 className="text-lg font-medium text-text-primary mb-4">Academic Details</h2>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Author</span>
                <span className="text-text-primary font-medium">Tarik Kavak</span>
              </li>
              <li className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Student ID</span>
                <span className="font-mono">001321082</span>
              </li>
              <li className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Degree</span>
                <span>BSc (Hons) Cyber Security</span>
              </li>
              <li className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Supervisor</span>
                <span>Muhammad Waqas</span>
              </li>
              <li className="flex justify-between pb-2">
                <span className="text-text-muted">Institution</span>
                <span>University of Greenwich</span>
              </li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bento-card p-8"
          >
            <FileText className="w-6 h-6 text-text-primary mb-6" />
            <h2 className="text-lg font-medium text-text-primary mb-4">Research Rationale</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              DDoS attacks are a continuous threat to internet infrastructure. While machine learning methods like feed-forward neural networks achieve high accuracy, they are often resource-intensive and difficult to deploy in edge systems.
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              This project bridges the gap by providing a lightweight detection system designed for regular network infrastructure. It utilizes optimized feature extraction with ensemble classifiers (Random Forest, XGBoost) to offer end-to-end protection without specialized hardware.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-8"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Technical Approach</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bento-card p-6">
              <Database className="w-5 h-5 text-text-primary mb-4" />
              <h3 className="text-base font-medium text-text-primary mb-2">Dataset & Training</h3>
              <p className="text-text-secondary text-sm">
                Model training is based on the <strong>CICDDoS2019</strong> dataset, an extensive benchmark including modern volumetric floods, protocol attacks, and application-layer attacks.
              </p>
            </div>
            
            <div className="bento-card p-6">
              <Cpu className="w-5 h-5 text-text-primary mb-4" />
              <h3 className="text-base font-medium text-text-primary mb-2">Algorithms</h3>
              <p className="text-text-secondary text-sm">
                Ensemble methods utilizing <strong>Random Forest</strong> and <strong>Gradient Boosting (XGBoost)</strong>. These provide high detection rates while remaining computationally efficient for real-time edge deployment.
              </p>
            </div>
            
            <div className="bento-card p-6">
              <ShieldCheck className="w-5 h-5 text-text-primary mb-4" />
              <h3 className="text-base font-medium text-text-primary mb-2">Mitigation Strategy</h3>
              <p className="text-text-secondary text-sm">
                A graduated response mechanism involving rate limiting suspicious IPs, connection throttling, and temporary blocking of confirmed malicious sources.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
