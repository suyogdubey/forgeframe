/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, createContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Video, 
  Type, 
  Mic, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Menu,
  Coins,
  Layers,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const AppContext = createContext<{credits: number, setCredits: (c: number) => void, refreshCredits: () => Promise<void>, session?: any}>({credits: 0, setCredits: () => {}, refreshCredits: async () => {}});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const pathname = usePathname();

  const refreshCredits = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    }
  };
  const fetchProfile = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/user/profile", { cache: "no-store", 
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.credits !== undefined) {
          setCredits(data.credits);
        }
      }
    } catch (err) {}
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setCredits(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMode('login');
        setAuthError('Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  const navItems = [
    { name: 'Workspace (Img2Vid)', href: '/', icon: Video, locked: false },
    { name: 'Post-Processing', href: '/post-process', icon: Layers, locked: false },
    { name: 'My Generations', href: '/generations', icon: Film, locked: false },
    { name: 'Image Generation', href: '/image', icon: ImageIcon, locked: false },
    { name: 'Audio / Voice', href: '/audio', icon: Mic, locked: false },
  ];

  return (
    <AppContext.Provider value={{credits, setCredits, refreshCredits, session: { user }}}>
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Mobile Header Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#09090b] border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <span className="font-semibold text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
             <div className="w-3 h-3 bg-black rounded-sm" />
          </div>
          ForgeFrame
        </span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400 hover:text-white">
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40
          transition-all duration-300 ease-in-out
          bg-[#09090b] border-r border-zinc-800 flex flex-col
          ${isSidebarOpen ? 'w-64' : 'w-20'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          pt-14 md:pt-0
        `}
      >
        <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 hidden md:flex">
          {isSidebarOpen ? (
            <span className="font-bold text-white text-lg tracking-tight flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <div className="w-8 h-8 shrink-0 rounded bg-white flex items-center justify-center">
                 <div className="w-4 h-4 bg-black rounded-sm" />
              </div>
              <span className="truncate">ForgeFrame</span>
            </span>
          ) : (
            <div className="w-8 h-8 rounded mx-auto bg-white flex items-center justify-center">
               <div className="w-4 h-4 bg-black rounded-sm" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          <div className="text-[10px] uppercase font-semibold text-zinc-500 px-3 mb-2 tracking-widest mt-2">Tools</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href && !item.locked;
            return (
              <Link
                key={item.name}
                href={item.locked ? '#' : item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm
                  ${isActive 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-500 hover:text-white'
                  }
                  ${item.locked ? 'opacity-40 cursor-not-allowed' : ''}
                `}
                title={!isSidebarOpen ? item.name : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={16} className={`shrink-0 ${isActive ? 'text-white' : ''}`} />
                {isSidebarOpen && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.locked && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Lock</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <Link
            href="/admin"
            className={`
              flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm
              ${pathname === '/admin' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}
            `}
            title={!isSidebarOpen ? "Admin Dashboard" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ShieldAlert size={16} className="shrink-0" />
            {isSidebarOpen && <span className="font-medium">Admin Control</span>}
          </Link>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex absolute -right-3.5 top-20 w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-full items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors z-50 shadow-lg"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0 h-full relative bg-[#000000]">
        {/* Header */}
        <header className="h-14 shrink-0 bg-[#09090b] border-b border-zinc-800 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-2 text-sm text-zinc-400 hidden sm:flex">
            <span>Workspace</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200">
              {pathname === '/' ? 'Image to Video' : 
               pathname === '/post-process' ? 'Post-Processing' : 
               pathname === '/generations' ? 'My Generations' :
               pathname.replace('/', '')}
            </span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-sm font-medium transition-all" key={credits}>
                  <Coins size={14} className="text-yellow-500" />
                  <span className="text-zinc-200">{credits} Credits</span>
                </div>
                <div className="text-sm text-zinc-400">{user.email}</div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#09090b] border border-zinc-800 p-6 rounded-xl w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-6">
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </h2>
            {authError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded mb-4">{authError}</div>}
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded transition-colors disabled:opacity-50"
              >
                {authLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-xs text-zinc-500 hover:text-white"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
    </AppContext.Provider>
  );
}
