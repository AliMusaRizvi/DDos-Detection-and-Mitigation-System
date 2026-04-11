import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Key, ArrowRight, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Authentication successful");
        navigate(from, { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        toast.success("Registration successful! You can now log in.");
        setIsLogin(true);
      }
    } catch (error: any) {
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
              {isLogin ? 'Secure Authentication' : 'Request Access'}
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
              <label className="text-xs font-medium text-text-secondary">Access Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle focus:border-border-strong rounded-lg text-text-primary pl-10 pr-4 py-2.5 outline-none text-sm transition-colors"
                  placeholder="••••••••••••"
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
                  {isLogin ? 'Initialize Session' : 'Submit Request'}
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
              {isLogin ? 'Need access? Request credentials' : 'Have credentials? Authenticate here'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
