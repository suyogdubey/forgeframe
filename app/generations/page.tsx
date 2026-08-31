'use client';
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/components/AppLayout';
import { Play, Download, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function GenerationsPage() {
  const { session } = useContext(AppContext);
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGenerations = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/generations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGenerations(data.generations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (session?.access_token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchGenerations(session.access_token);
    } else if (session === null) {
      setTimeout(() => {
        if (active) setLoading(false);
      }, 0);
    }
    return () => {
      active = false;
    };
  }, [session]);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
        <h2 className="text-xl font-semibold text-zinc-300 mb-2">My Generations</h2>
        <p>Please log in to view your generation history.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">My Generations</h1>
        <p className="text-sm text-zinc-400 mt-1">Review and manage your video generation history.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">Loading generations...</div>
      ) : generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-sm bg-zinc-900/30 rounded-xl border border-zinc-800/50">
          <p>No generations found.</p>
          <p className="mt-1">Head over to the Image to Video tab to create something new.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {generations.map((gen) => (
            <div key={gen.id} className="group relative bg-[#18181b] rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col">
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {gen.video_url && gen.video_url !== 'pending' ? (
                  <video 
                    src={gen.video_url} 
                    className="w-full h-full object-cover" 
                    controls
                    preload="metadata"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                    <Loader2 size={24} className="animate-spin text-indigo-500/50" />
                    <span className="text-xs">Processing...</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-zinc-300 line-clamp-2 mb-2 flex-1">{gen.prompt || 'No prompt'}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">
                    {new Date(gen.created_at).toLocaleDateString()}
                  </span>
                  {gen.video_url && gen.video_url !== 'pending' && (
                    <a 
                      href={gen.video_url} 
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-colors"
                      title="Download Video"
                    >
                      <Download size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}