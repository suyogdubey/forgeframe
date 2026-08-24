'use client';

import React, { useState, useRef, useContext, useEffect } from 'react';
import { Layers, Subtitles, Download, Info , UploadCloud, Sparkles, Loader2, Play, Pause, SplitSquareHorizontal, X, FolderOpen } from 'lucide-react';
import { AppContext } from '@/components/AppLayout';
import { createClient } from '@supabase/supabase-js';

export default function PostProcessPage() {
  const { credits, refreshCredits, session } = useContext(AppContext);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [upscale, setUpscale] = useState('2x');
  const [interpolate, setInterpolate] = useState('60fps');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [srtData, setSrtData] = useState<string | null>(null);
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generations, setGenerations] = useState<any[]>([]);
  const [loadingGens, setLoadingGens] = useState(false);

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const enhancedVideoRef = useRef<HTMLVideoElement>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const fetchGenerations = async () => {
    if (!session?.user?.id) return;
    setLoadingGens(true);
    const { data } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    // Filter to only videos (mp4) since generations also store images and audio now
    if (data) {
       setGenerations(data.filter(g => g.video_url?.endsWith('.mp4')));
    }
    setLoadingGens(false);
  };

  const openGenerationsModal = () => {
    setShowModal(true);
    fetchGenerations();
  };

  const selectGeneration = (url: string) => {
    setUploadFile(null);
    setSrtData(null);
    setVttUrl(null);
    setUploadedVideo(url);
    setIsEnhanced(false);
    setShowModal(false);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadedVideo(URL.createObjectURL(file));
      setIsEnhanced(false);
    }
  };

  
const handleTranscribe = async () => {
  if (!uploadedVideo || credits < 1) return;
  setIsTranscribing(true);
  try {
    let finalUrl = uploadedVideo;
    if (uploadFile) {
      const fileName = `${session?.user?.id || 'anon'}/temp_${Date.now()}_${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, uploadFile);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      finalUrl = publicUrlData.publicUrl;
    }

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: session.user, videoUrl: finalUrl })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setSrtData(data.srt);
    
    // Convert basic SRT to VTT for browser preview
    const vtt = 'WEBVTT\n\n' + data.srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    const blob = new Blob([vtt], { type: 'text/vtt' });
    setVttUrl(URL.createObjectURL(blob));
    refreshCredits();
  } catch (err: any) {
    alert("Transcription failed: " + err.message);
  }
  setIsTranscribing(false);
};

const downloadSrt = () => {
  if (!srtData) return;
  const blob = new Blob([srtData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'captions.srt';
  a.click();
};

  const handleEnhance = () => {
    if (!uploadedVideo || credits < 5) return;
    setIsEnhancing(true);
    
    // Simulate enhancement process
    setTimeout(() => {
      setIsEnhancing(false);
      setIsEnhanced(true);
      refreshCredits();
    }, 3000);
  };

  const syncPlay = () => {
    if (enhancedVideoRef.current && originalVideoRef.current) {
      enhancedVideoRef.current.play();
    }
  };

  const syncPause = () => {
    if (enhancedVideoRef.current && originalVideoRef.current) {
      enhancedVideoRef.current.pause();
    }
  };

  const syncSeek = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (enhancedVideoRef.current && originalVideoRef.current) {
      enhancedVideoRef.current.currentTime = originalVideoRef.current.currentTime;
    }
  };

  return (
    <div className="h-full p-4 sm:p-6 bg-[#000000] overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="text-indigo-400" />
            Post-Processing
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Upscale resolution and interpolate frame rates for buttery smooth videos.</p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 md:p-8 space-y-8 relative">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Source Video</label>
              <button 
                onClick={openGenerationsModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors"
              >
                <FolderOpen size={14} />
                Select from My Generations
              </button>
            </div>
            
            <div 
              className={`
                relative group border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center gap-4 transition-all overflow-hidden
                ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-600'}
                ${(uploadedVideo && !isEnhanced) ? 'p-4' : 'p-10'}
                ${isEnhanced ? 'p-4 border-indigo-500/30 bg-indigo-950/10' : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setUploadedVideo(URL.createObjectURL(file));
                  setIsEnhanced(false);
                }
              }}
            >
              {isEnhanced ? (
                <div className="w-full flex flex-col gap-2 relative z-20">
                  <div className="grid grid-cols-2 gap-4 h-48 md:h-64">
                    <div className="relative w-full h-full flex flex-col">
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10 font-medium">Original</span>
                      <video
                        ref={originalVideoRef}
                        src={uploadedVideo!}
                        controls
                        onPlay={syncPlay}
                        onPause={syncPause}
                        onSeeked={syncSeek}
                        className="w-full h-full object-cover bg-black rounded-lg border border-zinc-800"
                      />
                    </div>
                    <div className="relative w-full h-full flex flex-col">
                      <span className="absolute top-2 left-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10 font-medium flex items-center gap-1 shadow-lg">
                        <Sparkles size={12} />
                        Enhanced ({upscale}, {interpolate})
                      </span>
                      <video
                        ref={enhancedVideoRef}
                        src={uploadedVideo!}
                        muted
                        className="w-full h-full object-cover bg-black rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        style={{ filter: 'brightness(1.1) contrast(1.05) saturate(1.2)' }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); setUploadedVideo(null); setIsEnhanced(false); }}
                    className="absolute -top-2 -right-2 bg-zinc-800 hover:bg-zinc-700 text-white p-1.5 rounded-full transition-colors z-30 border border-zinc-700 shadow-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : uploadedVideo ? (
                <div className="w-full h-48 md:h-64 relative z-20">
                  <video src={uploadedVideo} controls crossOrigin="anonymous" className="w-full h-full object-contain bg-black rounded-lg border border-zinc-800">
                    {vttUrl && <track kind="subtitles" src={vttUrl} srcLang="en" label="English" default />}
                  </video>
                  <button 
                    onClick={(e) => { e.preventDefault(); setUploadedVideo(null); }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white text-xs px-2 py-1 rounded backdrop-blur-sm transition-colors border border-zinc-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <UploadCloud className="text-zinc-500" size={32} />
                  </div>
                  <div>
                    <p className="text-zinc-300 font-medium">Drag & drop a video file</p>
                    <p className="text-xs text-zinc-500 mt-1">MP4, WebM (Max 50MB)</p>
                  </div>
                  <button className="bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors pointer-events-none relative z-0">
                    Browse Files
                  </button>
                </>
              )}
              {(!uploadedVideo || isEnhanced) && (
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={!!uploadedVideo}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">AI Upscaling</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                {['None', '2x', '4x'].map(opt => (
                  <button 
                    key={opt}
                    onClick={() => setUpscale(opt)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${upscale === opt ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Frame Interpolation</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                {['Off', '30fps', '60fps'].map(opt => (
                  <button 
                    key={opt}
                    onClick={() => setInterpolate(opt)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${interpolate === opt ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          
        <div className="pt-4 border-t border-zinc-800 space-y-4">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5" title="Generate timed SRT subtitles using Gemini 2.0 Flash.">
            Auto-Captions & Transcription
            <Info size={12} className="text-zinc-500 cursor-help"  />
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleTranscribe}
              disabled={!uploadedVideo || isTranscribing}
              className={`flex-1 py-3 bg-zinc-900 border border-zinc-800 hover:border-indigo-500 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {isTranscribing ? <Loader2 size={16} className="animate-spin" /> : <Subtitles size={16} />}
              Generate Subtitles (1 Credit)
            </button>
            {srtData && (
              <button 
                onClick={downloadSrt}
                className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Download size={16} /> Download .SRT
              </button>
            )}
          </div>
        </div>

          <div className="pt-4 border-t border-zinc-800">
            <button 
              onClick={handleEnhance}
              disabled={!uploadedVideo || isEnhancing || isEnhanced}
              className={`
                w-full py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm transition-all
                ${(uploadedVideo && !isEnhancing && !isEnhanced) ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}
              `}
            >
              {isEnhancing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing AI Enhancements...
                </>
              ) : isEnhanced ? (
                <>
                  <SplitSquareHorizontal size={18} />
                  Enhancement Complete
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Enhance Video <span className="opacity-40 font-normal ml-1">5 Credits</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generations Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FolderOpen size={18} className="text-indigo-400" />
                My Generated Videos
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {loadingGens ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                  <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
                  <p>Loading your videos...</p>
                </div>
              ) : generations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                  <p>No generated videos found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {generations.map((gen) => (
                    <div 
                      key={gen.id} 
                      onClick={() => selectGeneration(gen.video_url)}
                      className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <video src={gen.video_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                          Select for Upscale
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
