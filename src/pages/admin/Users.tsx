import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Shield, Loader, Activity } from 'lucide-react';
import { dbApi } from '../../lib/api';
import toast from 'react-hot-toast';

const toUiError = (error: any, fallbackMessage: string) => {
  const message = String(error?.message ?? fallbackMessage);
  if (/row-level security policy/i.test(message)) {
    return 'Permission denied by Supabase RLS. Sign in with an authenticated admin account to update roles.';
  }

  return message;
};

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await dbApi.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const originalUsers = [...users];
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, role: newRole } : user));

    try {
      await dbApi.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
    } catch (error: any) {
      setUsers(originalUsers);
      toast.error(toUiError(error, 'Failed to update role'));
    }
  };

  const filteredUsers = users.filter(u => 
    String(u.full_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    || String(u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    || String(u.id ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">User Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage system administrators, analysts, and standard users.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-border-strong bg-bg-panel/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-medium text-text-primary">Registered Accounts (DDoS Platform)</h2>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border-subtle bg-bg-surface">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Status / Last Active</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="data-row hover:bg-bg-panel/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-medium">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {user.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-text-secondary font-mono mt-0.5">
                            {user.email || `ID: ${String(user.id ?? '').substring(0, 8)}...`}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono mt-0.5" title={user.id}>
                            Source: {user.source === 'local-auth' ? 'Local Fallback Auth' : 'Supabase Profile'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'superadmin' ? 'bg-brand/10 text-brand border-brand/20' :
                        user.role === 'analyst' ? 'bg-info/10 text-info border-info/20' :
                        'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
                      }`}>
                        {user.role === 'superadmin' && <Shield className="w-3 h-3" />}
                        {user.role === 'analyst' && <Activity className="w-3 h-3" />}
                        {user.role === 'viewer' && <UsersIcon className="w-3 h-3" />}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`status-dot ${user.is_active === false ? 'inactive' : 'active'}`}></div>
                        <span className="text-sm text-text-secondary font-mono">
                          {user.is_active === false ? 'Inactive' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-bg-base border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand cursor-pointer"
                      >
                        <option value="superadmin">Promote to Superadmin</option>
                        <option value="analyst">Assign Analyst Role</option>
                        <option value="viewer">Demote to Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-text-secondary text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
