import React, { useEffect, useState } from 'react';
import { dbApi } from '../../lib/api';
import { Fingerprint, Target, Activity, ShieldAlert, Cpu } from 'lucide-react';

export default function Patterns() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const data = await dbApi.getPatterns();
        setPatterns(data);
      } catch (err) {
        console.error('Failed to load patterns:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPatterns();
  }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Attack Patterns</h1>
          <p className="text-text-secondary mt-1">Machine learning signature extraction and classification</p>
        </div>
        <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
          <Fingerprint className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : patterns.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-text-secondary glass-panel rounded-2xl">
            <Fingerprint className="w-12 h-12 mb-4 opacity-50" />
            <p>No ML attack patterns recorded.</p>
          </div>
        ) : (
          patterns.map((p) => (
            <div key={p.id} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${p.is_active ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'}`}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-text-primary">{p.pattern_name}</h3>
                    <div className="flex items-center text-sm text-text-secondary">
                      <span className="capitalize">{p.attack_type}</span>
                      <span className="mx-2">•</span>
                      <span className={p.is_active ? 'text-red-400' : ''}>{p.is_active ? 'Active Threat' : 'Dormant'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-background-light p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-text-secondary mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> Detections</p>
                  <p className="text-lg font-bold text-text-primary">{p.detection_count.toLocaleString()}</p>
                </div>
                <div className="bg-background-light p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-text-secondary mb-1 flex items-center"><Cpu className="w-3 h-3 mr-1"/> ML Confidence</p>
                  <p className="text-lg font-bold text-primary">{(p.avg_confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-background-light p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-text-secondary mb-1 flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/> Attack Prob.</p>
                  <p className="text-lg font-bold text-orange-500">{(p.avg_attack_probability * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary border-b border-white/5 pb-2">Signature Characteristics</p>
                <div className="bg-black/50 p-4 rounded-xl overflow-x-auto border border-white/5">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(p.signature, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
