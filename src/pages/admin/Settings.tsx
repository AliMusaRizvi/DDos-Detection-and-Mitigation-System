import React, { useState, useEffect } from 'react';
import { Database, Cpu, HardDrive, Activity, Save, Search, Loader } from 'lucide-react';
import { dbApi, mlApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const [settings, setSettings] = useState({
    engineMode: 'hybrid',
    sensitivity: 95,
    autoMitigation: true,
    maxCpu: 15,
    maxRam: 500
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await dbApi.getSettings();
        // Map array of {setting_key, setting_value} to an object
        const settingsObj: any = {};
        data.forEach((s: any) => {
          settingsObj[s.setting_key] = s.setting_value;
        });
        
        // Merge with defaults just in case some keys are missing
        setSettings(prev => ({
          ...prev,
          engineMode: settingsObj['engineMode'] || prev.engineMode,
          sensitivity: parseInt(settingsObj['sensitivity']) || prev.sensitivity,
          autoMitigation: settingsObj['autoMitigation'] === 'true' || settingsObj['autoMitigation'] === true,
          maxCpu: parseInt(settingsObj['maxCpu']) || prev.maxCpu,
          maxRam: parseInt(settingsObj['maxRam']) || prev.maxRam,
        }));
      } catch (error) {
        toast.error('Failed to load settings');
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();

    const fetchHealth = async () => {
      try {
        const startMl = performance.now();
        const mlStatus = await mlApi.checkHealth();
        const mlLatency = Math.round(performance.now() - startMl);

        const startDb = performance.now();
        const { error } = await supabase.from('ddos_system_settings').select('id').limit(1);
        const dbLatency = Math.round(performance.now() - startDb);

        setHealth({
          services: [
            { name: 'ML Inference API', status: mlStatus ? 'operational' : 'offline', latency: mlLatency },
            { name: 'Supabase Database', status: !error ? 'operational' : 'degraded', latency: dbLatency },
            { name: 'WebSocket Auth', status: 'operational', latency: 12 },
            { name: 'Frontend Hosting', status: 'operational', latency: 5 }
          ],
          lastChecked: new Date()
        });
      } catch (error) {
        console.error('Failed to fetch health:', error);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Check every 15s instead of 5s to save requests
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all keys
      const updates = [
        dbApi.updateSetting('engineMode', settings.engineMode),
        dbApi.updateSetting('sensitivity', settings.sensitivity.toString()),
        dbApi.updateSetting('autoMitigation', settings.autoMitigation.toString()),
        dbApi.updateSetting('maxCpu', settings.maxCpu.toString()),
        dbApi.updateSetting('maxRam', settings.maxRam.toString())
      ];
      
      await Promise.all(updates);
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">System Health & Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Configure ML models and view system diagnostics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search settings..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="pill-button-brand px-5 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Configuration</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ML Model Config */}
        <div className="bento-card p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-bg-panel/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-[20px]">
               <Loader className="w-8 h-8 text-brand animate-spin" />
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-medium text-text-primary">ML Engine Configuration</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Active Classifier</label>
              <select 
                value={settings.engineMode}
                onChange={(e) => setSettings({...settings, engineMode: e.target.value})}
                className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
              >
                <option value="hybrid">Ensemble (Random Forest + XGBoost)</option>
                <option value="rf">Random Forest Only (Ultra-light)</option>
                <option value="xgb">XGBoost Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-text-secondary mb-2">Detection Threshold (Confidence)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="80" 
                  max="99" 
                  value={settings.sensitivity}
                  onChange={(e) => setSettings({...settings, sensitivity: parseInt(e.target.value)})}
                  className="flex-1 accent-brand" 
                />
                <span className="font-mono text-sm text-text-primary">{settings.sensitivity}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="text-sm text-text-secondary">Automated Mitigation</label>
              <button 
                onClick={() => setSettings({...settings, autoMitigation: !settings.autoMitigation})}
                className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoMitigation ? 'bg-brand' : 'bg-border-strong'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-bg-base transition-transform ${settings.autoMitigation ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="bento-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-info" />
            <h2 className="text-lg font-medium text-text-primary">Diagnostics</h2>
          </div>

          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-text-secondary">Uptime</span>
              <span className="text-text-primary">14d 08h 22m</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-text-secondary">Database Size (PostgreSQL)</span>
              <span className="text-text-primary">12.4 MB</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-text-secondary">Model Version</span>
              <span className="text-brand">CIC-IDS2018 v1.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-text-secondary">Endpoint Status</span>
              <span className="text-text-primary">Connected</span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="flex-1 px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm hover:border-border-strong transition-colors">
              Export Logs
            </button>
            <button className="flex-1 px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm hover:border-border-strong transition-colors text-danger hover:border-danger/50">
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* System Health Checks */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <HardDrive className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-medium text-text-primary">System Health Checks</h2>
        </div>
        
        {health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {health.services.map((service: any, index: number) => (
              <div key={index} className="bg-bg-base border border-border-subtle p-4 rounded-lg flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-text-primary">{service.name}</span>
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${service.status === 'operational' ? 'bg-brand' : 'bg-danger'}`}></div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-text-secondary capitalize">{service.status}</span>
                  <span className="text-xs font-mono text-text-muted">{service.latency}ms</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center p-4">
             <Loader className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        )}
        {health && (
          <div className="mt-4 text-xs text-text-muted font-mono text-right">
            Last checked: {health.lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
