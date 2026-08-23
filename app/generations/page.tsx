'use client';

import React, { useEffect, useState } from 'react';
import { Film, Play, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Generation {
  id: string;
  created_at: string;
  prompt: string;
  video_url: string;
}

export default function GenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchGenerations(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchGenerations(session.user.id);
      } else {
        setGenerations([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchGenerations(userId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGenerations(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#000000]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#000000] p-6 text-center">
        <Film className="text-zinc-700 mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view your generations</h2>
        <p className="text-zinc-400 max-w-sm mb-6">Create an account or login to access your complete video generation history.</p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 sm:p-6 bg-[#000000] overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="text-indigo-400" />
            My Generations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Your video generation history and creative archive.</p>
        </div>

        {generations.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <Film className="text-zinc-600 mb-4" size={32} />
            <h3 className="text-lg font-semibold text-zinc-200">No generations yet</h3>
            <p className="text-zinc-500 text-sm mt-1 mb-6">Head over to the workspace to create your first video.</p>
            <Link href="/" className="bg-white text-black font-medium text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors">
              Go to Workspace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-all flex flex-col">
                <div className="relative aspect-video bg-black flex-shrink-0">
                  <video 
                    src={gen.video_url} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    controls
                    preload="metadata"
                  />
                  <a href={gen.video_url} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-black/80">
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">
                    {gen.prompt || "No prompt provided"}
                  </p>
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-zinc-600 font-medium">
                    <span>{new Date(gen.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
