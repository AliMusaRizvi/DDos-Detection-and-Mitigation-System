import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, RadioReceiver, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'My Dashboard', path: '/user' },
    { icon: RadioReceiver, label: 'Signal Status', path: '/user/status' },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-surface border-r border-border-subtle flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border-subtle">
          <Shield className="w-5 h-5 text-brand mr-2" />
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            DDoS<span className="text-text-secondary">DEFEND</span>
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/user'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-bg-panel text-text-primary border border-border-strong' 
                    : 'text-text-secondary hover:bg-bg-base hover:text-text-primary'
                }`
              }
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-dim flex items-center justify-center border border-brand/20">
                <span className="text-brand font-medium text-xs">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-text-primary truncate max-w-[100px]">
                  {profile?.full_name || 'Standard User'}
                </span>
                <span className="text-[10px] text-text-muted capitalize">
                  {profile?.role || 'User'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger-dim rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-bg-base">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
