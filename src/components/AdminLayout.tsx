import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldBan, Settings, LogOut, Shield, AlertTriangle, FileText, Database, Layers, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  useEffect(() => {
    const socket = io();
    
    socket.on('new_alert', (alert) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-bg-panel border border-danger/30 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <ShieldBan className="h-10 w-10 text-danger" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  Critical Alert: {alert.type}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  IP: {alert.ip} | Action: {alert.action}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-border-subtle">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-brand hover:text-brand-dim focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000, position: 'top-right' });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/traffic', icon: Activity, label: 'Traffic Analysis' },
    { path: '/admin/alerts', icon: AlertTriangle, label: 'Security Alerts' },
    { path: '/admin/cases', icon: Layers, label: 'Incident Cases' },
    { path: '/admin/patterns', icon: Database, label: 'Attack Patterns' },
    { path: '/admin/rules', icon: ShieldBan, label: 'Mitigation Rules' },
    { path: '/admin/reports', icon: FileText, label: 'Analysis Reports' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/settings', icon: Settings, label: 'System Settings' },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex text-text-primary font-sans">
      <Toaster />
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-subtle bg-bg-surface flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border-subtle">
          <Link to="/" className="flex items-center gap-2 text-text-primary font-semibold tracking-tight">
            <Shield className="w-5 h-5 text-brand" />
            <span>DDoS<span className="text-text-secondary">DEFEND</span></span>
          </Link>
        </div>
        
        <div className="p-4">
          <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-4 px-2">Admin Panel</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? 'bg-border-subtle text-text-primary font-medium' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-border-subtle/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-border-strong flex items-center justify-center text-xs font-mono uppercase text-brand">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{profile?.full_name || user?.email || 'Admin'}</span>
              <span className="text-xs text-text-muted font-mono capitalize">{profile?.role || 'Administrator'}</span>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
            className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-danger-dim transition-colors"
          >
            <LogOut className="w-4 h-4" />
            End Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm font-mono text-text-secondary">
            <span>Admin</span>
            <span>/</span>
            <span className="text-text-primary capitalize">
              {location.pathname === '/admin' ? 'Overview' : location.pathname.split('/').pop()}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-subtle bg-bg-panel text-xs font-mono">
              <div className="status-dot active"></div>
              <span className="text-text-secondary">System:</span>
              <span className="text-brand">Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
