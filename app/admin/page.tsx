/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { AppContext } from "@/components/AppContext";
import { Users, Search, ShieldAlert, Edit2, Check, X, CreditCard, Activity, Loader2, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  credits: number;
  email: string;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { user, fetchCredits } = React.useContext(AppContext);
  const [search, setSearch] = useState('');
  const [editingCreditsId, setEditingCreditsId] = useState<string | null>(null);
  const [editCreditsValue, setEditCreditsValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{success: boolean, message: string} | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html") && res.url.includes("__cookie_check")) {
        window.location.reload();
        return;
      }
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {}
    setLoading(false);
  };
  useEffect(() => {
    fetchUsers();
  }, []);


  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (user: UserProfile) => {
    setEditingCreditsId(user.id);
    setEditCreditsValue(user.credits.toString());
  };

  const saveEdit = async (id: string) => {
    const val = parseInt(editCreditsValue, 10);
    if (!isNaN(val)) {
      setUpdating(true);
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, credits: val })
        });
        if (!res.ok) throw new Error('Failed to update');
        setUsers(users.map(u => u.id === id ? { ...u, credits: val } : u));
        if (user?.id === id) fetchCredits(id);
      } catch (err: any) {
        alert("Failed to update credits: " + err.message);
      }
      setUpdating(false);
    }
    setEditingCreditsId(null);
  };

  const cancelEdit = () => {
    setEditingCreditsId(null);
  };

  const runCleanup = async () => {
    if (!confirm('Are you sure you want to run storage cleanup? This will permanently delete videos older than 7 days.')) return;
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html") && res.url.includes("__cookie_check")) {
        window.location.reload();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cleanup failed');
      setCleanupResult({ success: true, message: `Successfully deleted ${data.deletedCount} files.` });
    } catch (err: any) {
      setCleanupResult({ success: false, message: err.message });
    }
    setCleaning(false);
  };

  return (
    <div className="h-full bg-[#000000] p-6 md:p-10 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="text-red-500" />
              Admin Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Manage users, billing, and system metrics.</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-4 min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Users className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Users</p>
                  <p className="text-xl font-bold text-white">{users.length}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={runCleanup}
              disabled={cleaning}
              className="mt-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {cleaning ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Run Storage Cleanup (7-Day)
            </button>
            
            {cleanupResult && (
              <p className={`text-xs mt-2 ${cleanupResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {cleanupResult.message}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Users Table Section */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-200">User Management</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search users by email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 text-xs uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Credits Balance</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={24} />
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 border border-zinc-700">
                          {user.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{user.email || 'Unknown User'}</p>
                          <p className="text-zinc-500 text-xs font-mono">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {editingCreditsId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={editCreditsValue}
                            onChange={(e) => setEditCreditsValue(e.target.value)}
                            className="w-24 bg-zinc-950 border border-indigo-500 rounded px-2 py-1 text-zinc-200 focus:outline-none"
                            autoFocus
                            disabled={updating}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(user.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <button onClick={() => saveEdit(user.id)} disabled={updating} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded disabled:opacity-50">
                            <Check size={16} />
                          </button>
                          <button onClick={cancelEdit} disabled={updating} className="p-1 text-red-400 hover:bg-red-400/10 rounded disabled:opacity-50">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 font-mono text-zinc-300 group">
                          <CreditCard size={14} className="text-amber-500/70" />
                          {user.credits.toLocaleString()}
                          <button 
                            onClick={() => startEdit(user)}
                            className="ml-2 p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded"
                            title="Edit credits"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No users found matching &quot;{search}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
