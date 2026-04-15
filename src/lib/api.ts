import { supabase } from './supabase';

type RuleStatus = 'ACTIVE' | 'INACTIVE';

type MitigationRuleInput = {
  name: string;
  tier: number;
  condition: string;
  action: string;
  status?: RuleStatus;
};

type GenerateReportInput = {
  reportType?: string;
  dateFrom?: string;
  dateTo?: string;
  generatedBy?: string;
};

const inferSettingDataType = (value: string): 'number' | 'boolean' | 'string' => {
  if (value === 'true' || value === 'false') {
    return 'boolean';
  }

  const parsedNumber = Number(value);
  if (Number.isFinite(parsedNumber) && value.trim() !== '') {
    return 'number';
  }

  return 'string';
};

export const dbApi = {
  // Alerts
  async getAlerts() {
    const { data, error } = await supabase
      .from('ddos_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  // Attack Logs
  async getLogs() {
    const { data, error } = await supabase
      .from('ddos_attack_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  },

  // Target Settings
  async getSettings() {
    const { data, error } = await supabase.from('ddos_system_settings').select('*');
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
      .from('ddos_system_settings')
      .upsert({
        key,
        value,
        data_type: inferSettingDataType(value),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select();
    if (error) throw error;
    return data;
  },

  // Rules
  async getRules() {
    const { data, error } = await supabase
      .from('ddos_mitigation_rules')
      .select('*')
      .order('tier', { ascending: true });
    if (error) throw error;
    return data;
  },

  async toggleRule(id: string, currentStatus: string) {
    const newStatus = String(currentStatus).toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const { data, error } = await supabase
      .from('ddos_mitigation_rules')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },

  async createRule(input: MitigationRuleInput) {
    const payload = {
      name: input.name,
      tier: input.tier,
      condition: input.condition,
      action: input.action,
      status: input.status ?? 'ACTIVE',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ddos_mitigation_rules')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRule(id: string) {
    const { error } = await supabase
      .from('ddos_mitigation_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
  
  // Auth Profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('ddos_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Cases
  async getCases() {
    const { data, error } = await supabase
      .from('ddos_attack_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Patterns
  async getPatterns() {
    const { data, error } = await supabase
      .from('ddos_attack_patterns')
      .select('*')
      .order('detection_count', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Reports
  async getReports() {
    const { data, error } = await supabase
      .from('ddos_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async generateReport(input: GenerateReportInput = {}) {
    const nowIso = new Date().toISOString();
    const dateTo = input.dateTo ?? nowIso;
    const dateFrom = input.dateFrom ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const reportType = input.reportType ?? 'daily';

    const [alertsRes, blockedAlertsRes, logsRes, openCasesRes, activeRulesRes] = await Promise.all([
      supabase
        .from('ddos_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),
      supabase
        .from('ddos_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('action_taken', 'blocked')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),
      supabase
        .from('ddos_attack_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),
      supabase
        .from('ddos_attack_cases')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      supabase
        .from('ddos_mitigation_rules')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE'),
    ]);

    const queryErrors = [
      alertsRes.error,
      blockedAlertsRes.error,
      logsRes.error,
      openCasesRes.error,
      activeRulesRes.error,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      throw queryErrors[0];
    }

    const alertsCount = alertsRes.count ?? 0;
    const blockedCount = blockedAlertsRes.count ?? 0;
    const logsCount = logsRes.count ?? 0;
    const openCasesCount = openCasesRes.count ?? 0;
    const activeRulesCount = activeRulesRes.count ?? 0;

    const blockedRatio = alertsCount > 0
      ? `${Math.round((blockedCount / alertsCount) * 100)}%`
      : '0%';

    const summary = [
      `Window ${new Date(dateFrom).toLocaleString()} to ${new Date(dateTo).toLocaleString()}.`,
      `${logsCount.toLocaleString()} packets were logged.`,
      `${alertsCount.toLocaleString()} alerts detected, ${blockedCount.toLocaleString()} blocked (${blockedRatio}).`,
      `${openCasesCount.toLocaleString()} cases remain open with ${activeRulesCount.toLocaleString()} active mitigation rules.`,
    ].join(' ');

    const insertPayload: Record<string, string> = {
      title: `${reportType[0].toUpperCase()}${reportType.slice(1)} Threat Analysis - ${new Date().toLocaleDateString()}`,
      report_type: reportType,
      status: 'ready',
      summary,
      date_from: dateFrom,
      date_to: dateTo,
    };

    if (input.generatedBy) {
      insertPayload.generated_by = input.generatedBy;
    }

    const { data, error } = await supabase
      .from('ddos_reports')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // User Management
  async getUsers() {
    const { data, error } = await supabase
      .from('ddos_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    let localAuthRows: any[] = [];
    const localAuthRes = await supabase
      .from('ddos_local_auth_accounts')
      .select('id, email, full_name, role, created_at, updated_at, is_active')
      .order('created_at', { ascending: false });

    if (!localAuthRes.error && Array.isArray(localAuthRes.data)) {
      localAuthRows = localAuthRes.data.map((row: any) => ({
        ...row,
        source: 'local-auth',
      }));
    }

    const profileRows = Array.isArray(data)
      ? data.map((row: any) => ({
          ...row,
          source: 'profile',
          email: row.email ?? null,
          is_active: true,
        }))
      : [];

    return [...profileRows, ...localAuthRows];
  },

  async updateUserRole(id: string, newRole: string) {
    const now = new Date().toISOString();
    const profileUpdate = await supabase
      .from('ddos_profiles')
      .update({ role: newRole, updated_at: now })
      .eq('id', id)
      .select();

    const profileError = profileUpdate.error;
    const canFallbackToLocal = Boolean(profileError && /row-level security policy/i.test(profileError.message));

    if (profileError && !canFallbackToLocal) {
      throw profileError;
    }

    if (Array.isArray(profileUpdate.data) && profileUpdate.data.length > 0) {
      return profileUpdate.data;
    }

    const localUpdate = await supabase
      .from('ddos_local_auth_accounts')
      .update({ role: newRole, updated_at: now })
      .eq('id', id)
      .select();

    if (localUpdate.error) {
      throw localUpdate.error;
    }

    if (Array.isArray(localUpdate.data) && localUpdate.data.length > 0) {
      return localUpdate.data;
    }

    if (profileError) {
      throw profileError;
    }

    throw new Error('No user record was updated. Verify permissions and role policies.');
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
