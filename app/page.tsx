'use client';

import React, { useState, useRef, useEffect, useContext } from 'react';
import { UploadCloud, Play, Settings2, Loader2, Sparkles, TerminalSquare, RefreshCw, ChevronDown, ChevronUp, Download, Maximize, ShieldAlert, X } from 'lucide-react';
import { AppContext } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';

const CHINESE_NEG_PROMPT = "色调艳丽, 过曝, 静态, 细节模糊不清, 字幕, 风格, 作品, 画作, 画面, 静止, 整体发灰, 最差质量, 低质量, JPEG压缩残留, 丑陋的, 残缺的, 多余的手指, 画得不好的手指, 画得不好的脸部, 畸形的, 毁容的, 形态畸形的肢体, 手指融合, 静止不动的画面, 杂乱的背景, 三条腿, 背景人很多, 倒着走";

export default function WorkspacePage() {
  const { credits, setCredits } = useContext(AppContext);
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(CHINESE_NEG_PROMPT);
  const [duration, setDuration] = useState('3s');
  const [resolution, setResolution] = useState('832x480');
  const [motion, setMotion] = useState(6);
  
  const [steps, setSteps] = useState(12);
  const [cfg, setCfg] = useState(5.0);
  const [fps, setFps] = useState(16);
  const [seed, setSeed] = useState(-1);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      
      const reader = new FileReader();
      reader.onloadend = () => {
         setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const startTimer = () => {
    setElapsedTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const applyPreset = (tag: string) => {
    setPrompt(prev => {
      const sep = prev.length > 0 && !prev.endsWith(',') && !prev.endsWith(' ') ? ', ' : '';
      return prev + sep + tag;
    });
  };

  const handleGenerate = async () => {
    if (!imageBase64) {
      addLog('Error: Please upload an initial image.');
      return;
    }
    if (credits < 5) {
      addLog('Error: Insufficient credits.');
      return;
    }
    
    setJobStatus('generating');
    setVideoUrl(null);
    setLogs([]);
    startTimer();
    addLog('Initiating job request to backend...');
    
    const [widthStr, heightStr] = resolution.split('x');
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);
    const durationSeconds = parseInt(duration.replace('s', ''), 10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
           image_base64: imageBase64,
           prompt,
           negative_prompt: negativePrompt,
           duration_seconds: durationSeconds,
           fps,
           steps,
           cfg,
           width,
           height,
           seed
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 429) {
           throw new Error(data?.error || 'AI generation limits are currently exhausted due to high traffic. Please try again later.');
        }
        throw new Error(data?.error || 'Failed to generate video');
      }

      const data = await res.json();
      setVideoUrl(data.video_url);
      setJobStatus('done');
      addLog('Video generation completed successfully.');
      setCredits(credits - 5);
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      if (error.message.includes('exhausted') || error.message.includes('429')) {
        setToast(error.message);
        setTimeout(() => setToast(null), 5000);
      }
      setJobStatus('error');
    } finally {
      stopTimer();
    }
  };

  const formatTime = (sec: number) => {
     const m = Math.floor(sec / 60).toString().padStart(2, '0');
     const s = (sec % 60).toString().padStart(2, '0');
     return `${m}:${s}`;
  };

  const handleDownload = () => {
    if (videoUrl) {
       const a = document.createElement('a');
       a.href = videoUrl;
       a.download = `forgeframe-${Date.now()}.mp4`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
    }
  };

  const toggleFullscreen = () => {
     if (videoRef.current) {
        if (videoRef.current.requestFullscreen) {
           videoRef.current.requestFullscreen();
        }
     }
  };

  return (
    <>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur border border-red-500 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-sm">
          <ShieldAlert size={20} />
          <p className="text-sm font-medium">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-auto opacity-70 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

    <div className="h-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#000000] overflow-y-auto">
      
      {/* Left Column: Controls */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
          
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Source Image</label>
            <div 
              className={`
                relative group border-2 border-dashed rounded-lg h-36 flex flex-col items-center justify-center text-center transition-colors cursor-pointer overflow-hidden
                ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-600'}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setUploadedImage(URL.createObjectURL(file));
                  const r = new FileReader();
                  r.onloadend = () => setImageBase64(r.result as string);
                  r.readAsDataURL(file);
                }
              }}
            >
              {uploadedImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedImage} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <p className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-md backdrop-blur-sm">Change Image</p>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud className="text-zinc-600 mb-2" size={24} />
                  <span className="text-xs text-zinc-500">Drag & drop or <span className="text-indigo-400">browse</span></span>
                </>
              )}
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the movement, camera action, or atmosphere..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none min-h-[80px] resize-y transition-all text-zinc-200 custom-scrollbar"
            />
          </div>

          {/* Duration & Resolution */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Duration</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                {['3s', '5s', '8s'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${duration === d ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Resolution</label>
              <select 
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs outline-none text-zinc-200 h-[32px]"
              >
                <option value="832x480">16:9 (832x480) - Rec</option>
                <option value="480x832">9:16 (480x832)</option>
                <option value="1280x720">16:9 HD (1280x720)</option>
                <option value="720x1280">9:16 HD (720x1280)</option>
                <option value="640x640">1:1 (640x640)</option>
              </select>
            </div>
          </div>

          {/* Motion Intensity */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium text-zinc-400">
              <label className="uppercase tracking-wider">Motion Intensity</label>
              <span>{motion}</span>
            </div>
            <input 
              type="range" min="1" max="10" step="1" 
              value={motion} onChange={(e) => setMotion(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => applyPreset('subtle ambient movement, calm')} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">Subtle Ambient</button>
              <button onClick={() => applyPreset('balanced dynamic motion, clear')} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">Balanced Dynamic</button>
              <button onClick={() => applyPreset('high combat, fast action, dynamic camera')} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">High Combat</button>
              <button onClick={() => applyPreset('surging qi aura, magical energy flowing, intense')} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">Surging Qi Aura</button>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/30">
            <button 
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900/50"
            >
              <span className="flex items-center gap-2"><Settings2 size={14} /> Advanced Settings</span>
              {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {advancedOpen && (
              <div className="p-4 space-y-4 border-t border-zinc-800">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-400">Negative Prompt</label>
                    <button 
                      onClick={() => setNegativePrompt(CHINESE_NEG_PROMPT)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> Reset Default
                    </button>
                  </div>
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none h-16 resize-y transition-all text-zinc-400 custom-scrollbar leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <label>Sampling Steps</label>
                      <span>{steps}</span>
                    </div>
                    <input 
                      type="range" min="4" max="30" step="1" 
                      value={steps} onChange={(e) => setSteps(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <label>CFG Guidance</label>
                      <span>{cfg.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="1.0" max="9.0" step="0.5" 
                      value={cfg} onChange={(e) => setCfg(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Frame Rate</label>
                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                      {[12, 16, 24].map(f => (
                        <button
                          key={f}
                          onClick={() => setFps(f)}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${fps === f ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Seed (-1 Random)</label>
                    <input 
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs outline-none text-zinc-200 h-[28px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleGenerate}
            disabled={jobStatus === 'generating'}
            className={`
              w-full py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm mt-1 transition-all
              ${jobStatus === 'generating'
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'}
            `}
          >
            {jobStatus === 'generating' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Video <span className="opacity-50 font-normal ml-1">(5 Credits)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Output */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
        
        {/* Output Player Area */}
        <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
          
          <div className="absolute top-4 left-4 flex gap-2 z-20">
            <span className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-400 flex items-center gap-1 shadow-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${jobStatus === 'generating' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
              Wan 2.2 5B Engine
            </span>
          </div>
          
          {videoUrl && (
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button onClick={handleDownload} className="bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 p-2 rounded text-zinc-300 hover:text-white transition-colors backdrop-blur-md">
                <Download size={14} />
              </button>
              <button onClick={toggleFullscreen} className="bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 p-2 rounded text-zinc-300 hover:text-white transition-colors backdrop-blur-md">
                <Maximize size={14} />
              </button>
            </div>
          )}

          <div className="w-full h-full flex items-center justify-center relative p-4">
            {jobStatus === 'generating' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                <div className="w-32 h-32 relative flex items-center justify-center mb-6">
                   <div className="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
                   <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                   <span className="text-xl font-mono text-indigo-400">{formatTime(elapsedTime)}</span>
                </div>
                <p className="text-zinc-300 font-medium animate-pulse tracking-wide">Synthesizing Frames...</p>
              </div>
            )}

            {videoUrl ? (
              <video 
                ref={videoRef}
                src={videoUrl} 
                autoPlay 
                loop 
                controls 
                className="w-full h-full object-contain rounded-lg shadow-2xl bg-black"
              />
            ) : (
              <div className={`text-center space-y-3 transition-opacity ${jobStatus === 'generating' ? 'opacity-0' : 'opacity-30'}`}>
                <Play size={48} className="mx-auto text-zinc-300" />
                <p className="text-sm text-zinc-300 font-medium">Output Preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Terminal Logs */}
        <div className="h-40 shrink-0 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-hidden flex flex-col shadow-inner">
          <div className="flex items-center gap-2 mb-3 shrink-0 pb-2 border-b border-zinc-800/50">
            <TerminalSquare size={14} className="text-zinc-500" />
            <span className="text-zinc-400 uppercase font-semibold tracking-wider text-[10px]">Generation Log</span>
            
            <div className="ml-auto flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {jobStatus === 'generating' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${jobStatus === 'error' ? 'bg-red-500' : jobStatus === 'generating' ? 'bg-yellow-500' : 'bg-zinc-600'}`}></span>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar text-zinc-300 pr-2">
            {logs.length === 0 ? (
              <span className="text-zinc-600 opacity-50">System ready. Waiting for tasks...</span>
            ) : (
              logs.map((log, i) => {
                const time = log.split(' ')[0];
                const rest = log.substring(log.indexOf(' ') + 1);
                
                let tag = 'SYS';
                let tagColor = 'text-indigo-400';
                
                if (log.includes('Error')) {
                  tag = 'ERR';
                  tagColor = 'text-red-400';
                } else if (log.includes('successfully') || log.includes('Done')) {
                  tag = 'OK ';
                  tagColor = 'text-green-400';
                } else if (log.includes('Initiating')) {
                  tag = 'REQ';
                  tagColor = 'text-blue-400';
                }

                return (
                  <div key={i} className="mb-1 text-zinc-500">
                    {time} <span className={tagColor}>[{tag}]</span> <span className={log.includes('Error') ? 'text-red-400' : 'text-zinc-300'}>{rest}</span>
                  </div>
                );
              })
            )}
            {jobStatus === 'generating' && (
              <p className="animate-pulse text-indigo-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 inline-block"></span>
              </p>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
