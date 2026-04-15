export const EMERGENCY_SESSION_KEY = 'ddos_emergency_session';

export type EmergencySession = {
  email: string;
  role: 'admin' | 'user';
  full_name: string;
};

export const readEmergencySession = (): EmergencySession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EMERGENCY_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<EmergencySession>;
    if (!parsed.email || (parsed.role !== 'admin' && parsed.role !== 'user')) {
      return null;
    }

    return {
      email: parsed.email,
      role: parsed.role,
      full_name: parsed.full_name || 'System Admin',
    };
  } catch {
    return null;
  }
};

export const writeEmergencySession = (email: string, role: 'admin' | 'user', fullName = 'System Admin') => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: EmergencySession = {
    email,
    role,
    full_name: fullName,
  };

  window.localStorage.setItem(EMERGENCY_SESSION_KEY, JSON.stringify(payload));
};

export const clearEmergencySession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(EMERGENCY_SESSION_KEY);
};