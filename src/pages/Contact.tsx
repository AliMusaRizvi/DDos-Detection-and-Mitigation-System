import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, Terminal, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message }]);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Secure message transmitted successfully.');
      
      // Reset form variables behind the scenes
      setName('');
      setEmail('');
      setMessage('');
      
      // Allow them to submit another after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error: any) {
      toast.error('Failed to transmit message: ' + error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-20 px-6 relative flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,102,0.05)_0,transparent_50%)]"></div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-neon-green/5 border border-neon-green/30 text-neon-green font-mono text-xs tracking-widest mb-6">
            <Terminal className="w-4 h-4" />
            SECURE_COMMUNICATION_CHANNEL
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 uppercase tracking-tight leading-none">
            Contact <br/>
            <span className="text-neon-green glow-text-green">The Researcher</span>
          </h1>
          
          <p className="text-slate-400 font-light text-lg mb-8 leading-relaxed">
            Have questions about the methodology, dataset usage, or want to discuss the implementation of the lightweight DDoS detection system? Send a secure message.
          </p>

          <div className="space-y-6 font-mono text-sm">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 bg-card-bg border border-card-border flex items-center justify-center">
                <Mail className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">EMAIL</div>
                <div>t.kavak@greenwich.ac.uk</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 bg-card-bg border border-card-border flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">DEPARTMENT</div>
                <div>School of Computing & Mathematical Sciences</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card-bg border border-card-border p-8 relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-neon-green"></div>
          
          {isSubmitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mb-4 border border-neon-green/30">
                <Send className="w-8 h-8 text-neon-green" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white uppercase mb-2">Message Transmitted</h3>
              <p className="text-slate-400 font-mono text-sm">Your inquiry has been logged securely.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-neon-green uppercase tracking-wider">Name / Organization</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-dark-bg border border-card-border focus:border-neon-green text-white px-4 py-3 outline-none font-mono text-sm transition-colors disabled:opacity-50"
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-mono text-neon-green uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-dark-bg border border-card-border focus:border-neon-green text-white px-4 py-3 outline-none font-mono text-sm transition-colors disabled:opacity-50"
                  placeholder="address@domain.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-neon-green uppercase tracking-wider">Message Payload</label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  className="w-full bg-dark-bg border border-card-border focus:border-neon-green text-white px-4 py-3 outline-none font-mono text-sm transition-colors resize-none disabled:opacity-50"
                  placeholder="Enter your message here..."
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-neon-green/10 text-neon-green border border-neon-green/50 font-display font-bold text-lg uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Transmit Data
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
