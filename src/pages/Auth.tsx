import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Key, ArrowRight, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const adminRoles = new Set(['superadmin', 'admin', 'analyst']);
const AUTH_TIMEOUT_MS = 10000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const getRoleRoute = (role?: string | null) => {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return adminRoles.has(normalizedRole) ? '/admin' : '/user';
};

type LocalAuthSigninRow = {
  account_id: string;
  email: string;
  role: string;
  full_name: string;
};

type LocalSignupResult = 'created' | 'existing' | 'failed';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, isLoading: isAuthLoading, activateEmergencySession } = useAuth();
  const fromPath: string | undefined = location.state?.from?.pathname;

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    const fallbackRoute = role === 'admin' ? '/admin' : '/user';
    const redirectPath = fromPath && fromPath !== '/auth' ? fromPath : fallbackRoute;
    navigate(redirectPath, { replace: true });
  }, [isAuthLoading, user, role, fromPath, navigate]);

  const resolveLoginDestination = async (userId?: string) => {
    if (fromPath && fromPath !== '/auth') {
      return fromPath;
    }

    if (!userId) {
      return '/user';
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('ddos_profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle(),
        AUTH_TIMEOUT_MS,
        'Role lookup',
      );

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to resolve destination role:', error);
      }

      return getRoleRoute(data?.role);
    } catch (error) {
      console.error('Failed to resolve login destination:', error);
      return '/user';
    }
  };

  const tryLocalSigninFallback = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('ddos_local_auth_signin', {
          p_email: email,
          p_password: password,
        }),
        AUTH_TIMEOUT_MS,
        'Local fallback sign in',
      );

      if (error) {
        console.error('Local fallback sign-in failed:', error);
        return false;
      }

      const rows = Array.isArray(data) ? (data as LocalAuthSigninRow[]) : [];
      const localUser = rows[0];
      if (!localUser) {
        return false;
      }

      const destination = getRoleRoute(localUser.role);
      const appRole = destination === '/admin' ? 'admin' : 'user';
      activateEmergencySession({
        email: localUser.email,
        role: appRole,
        full_name: localUser.full_name || 'System User',
      });
      toast.success('Local Supabase fallback login successful');
      navigate(destination, { replace: true });
      return true;
    } catch (fallbackError) {
      console.error('Local fallback sign-in threw an error:', fallbackError);
      return false;
    }
  };

  const tryLocalSignupFallback = async (silent = false): Promise<LocalSignupResult> => {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('ddos_local_auth_signup', {
          p_email: email,
          p_password: password,
          p_full_name: fullName,
        }),
        AUTH_TIMEOUT_MS,
        'Local fallback sign up',
      );

      if (error) {
        const errorMessage = String(error.message ?? '');
        if (/already exists/i.test(errorMessage)) {
          setIsLogin(true);
          if (!silent) {
            toast.error('Account already exists. Please log in.');
          }
          return 'existing';
        }

        if (!silent) {
          toast.error(errorMessage || 'Failed to create account');
        }
        return 'failed';
      }

      const rows = Array.isArray(data) ? (data as LocalAuthSigninRow[]) : [];
      if (!rows[0]) {
        if (!silent) {
          toast.error('Sign up could not be completed. Please try again.');
        }
        return 'failed';
      }

      setIsLogin(true);
      setPassword('');
      if (!silent) {
        toast.success('Sign up successful! You can now log in.');
      }
      return 'created';
    } catch (fallbackError: any) {
      if (!silent) {
        toast.error(fallbackError?.message || 'Failed to create account');
      }
      return 'failed';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
          AUTH_TIMEOUT_MS,
          'Sign in',
        );
        if (error) throw error;

        const destination = await resolveLoginDestination(data.user?.id);
        toast.success("Authentication successful");
        navigate(destination, { replace: true });
      } else {
        const localSignupResult = await tryLocalSignupFallback(true);

        if (localSignupResult === 'created') {
          // Keep native auth in sync when available, but do not block the local path.
          try {
            await withTimeout(
              supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    full_name: fullName,
                  }
                }
              }),
              AUTH_TIMEOUT_MS,
              'Native sign up mirror',
            );
          } catch (mirrorError) {
            console.warn('Native sign up mirror failed:', mirrorError);
          }

          toast.success('Sign up successful! You can now log in.');
          return;
        }

        if (localSignupResult === 'existing') {
          toast.error('Account already exists. Please log in.');
          return;
        }

        const { error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              }
            }
          }),
          AUTH_TIMEOUT_MS,
          'Sign up',
        );

        if (error) {
          throw error;
        }

        toast.success('Sign up successful! You can now log in.');
        setIsLogin(true);
        setPassword('');
        return;
      }
    } catch (error: any) {
      const authEngineFailed = error?.code === 'unexpected_failure' || /Database error querying schema/i.test(String(error?.message ?? ''));

      if (isLogin) {
        const signedIn = await tryLocalSigninFallback();
        if (signedIn) {
          return;
        }

        if (!authEngineFailed) {
          toast.error(error.message || 'Authentication failed');
          return;
        }

        toast.error('Authentication service is unavailable. Please verify credentials or try again later.');
        return;
      }

      if (!isLogin && authEngineFailed) {
        const signedUp = await tryLocalSignupFallback();
        if (signedUp !== 'failed') {
          return;
        }

        return;
      }

      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-6 relative overflow-hidden bg-bg-base">
      <div className="absolute inset-0 bg-grid-subtle opacity-50"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bento-card p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-bg-panel border border-border-subtle rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              {isLogin ? 'Secure Authentication' : 'Create Account'}
            </h1>
            <p className="text-text-secondary text-sm mt-2">
              Secure Portal v1.0
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-bg-base border border-border-subtle focus:border-border-strong rounded-lg text-text-primary pl-10 pr-4 py-2.5 outline-none text-sm transition-colors"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">Identifier / Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle focus:border-border-strong rounded-lg text-text-primary pl-10 pr-4 py-2.5 outline-none text-sm transition-colors"
                  placeholder="user@ddosdefend.local"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">{isLogin ? 'Access Key' : 'Create Access Key'}</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="password" 
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle focus:border-border-strong rounded-lg text-text-primary pl-10 pr-4 py-2.5 outline-none text-sm transition-colors"
                  placeholder={isLogin ? '••••••••••••' : 'Use at least 8 characters'}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-text-primary text-bg-base rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Initialize Session' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors disabled:opacity-50"
            >
              {isLogin ? 'Need an account? Create one here' : 'Already registered? Authenticate here'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
