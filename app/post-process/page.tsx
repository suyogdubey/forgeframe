'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Layers, Sparkles, Loader2, X, SplitSquareHorizontal } from 'lucide-react';

export default function PostProcessPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [upscale, setUpscale] = useState('2x');
  const [interpolate, setInterpolate] = useState('60fps');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const enhancedVideoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedVideo(URL.createObjectURL(file));
      setIsEnhanced(false);
    }
  };

  const handleEnhance = () => {
    if (!uploadedVideo) return;
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
      setIsEnhanced(true);
    }, 2000);
  };

  const syncPlay = () => enhancedVideoRef.current?.play();
  const syncPause = () => enhancedVideoRef.current?.pause();
  const syncSeek = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (enhancedVideoRef.current) {
      enhancedVideoRef.current.currentTime = (e.target as HTMLVideoElement).currentTime;
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

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 md:p-8 space-y-8">
          
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Source Video</label>
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
                  <video src={uploadedVideo} controls className="w-full h-full object-contain bg-black rounded-lg border border-zinc-800" />
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
                  <button className="bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
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
    </div>
  );
}
