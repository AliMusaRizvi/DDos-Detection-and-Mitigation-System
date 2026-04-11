import { supabase } from './supabase';

export const dbApi = {
  // Alerts
  async getAlerts() {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  // Attack Logs
  async getLogs() {
    const { data, error } = await supabase
      .from('attack_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  },

  // Target Settings
  async getSettings() {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) throw error;
    
    // Convert array of key-value pairs to object map
    return data.reduce((acc, curr) => {
      acc[curr.key] = curr.data_type === 'number' ? Number(curr.value) 
        : curr.data_type === 'boolean' ? curr.value === 'true' 
        : curr.value;
      return acc;
    }, {} as Record<string, any>);
  },
  
  async updateSetting(key: string, value: string) {
    const { data, error } = await supabase
      .from('system_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select();
    if (error) throw error;
    return data;
  },

  // Rules
  async getRules() {
    const { data, error } = await supabase
      .from('mitigation_rules')
      .select('*')
      .order('tier', { ascending: true });
    if (error) throw error;
    return data;
  },

  async toggleRule(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const { data, error } = await supabase
      .from('mitigation_rules')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },
  
  // Auth Profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Cases
  async getCases() {
    const { data, error } = await supabase
      .from('attack_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Patterns
  async getPatterns() {
    const { data, error } = await supabase
      .from('attack_patterns')
      .select('*')
      .order('detection_count', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Reports
  async getReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

export const mlApi = {
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(`${import.meta.env.VITE_ML_API_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      return res.ok;
    } catch {
      return false;
    }
  }
};
