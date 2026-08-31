'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Video, Upload, TerminalSquare, Play, Download, Maximize, Loader2, Settings2 } from 'lucide-react';
import { AppContext } from '@/components/AppLayout';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock'
);

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 1024;
        if (width > max || height > max) {
          if (width > height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function WorkspacePage() {
  const { user, credits, fetchCredits } = React.useContext(AppContext);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [engine, setEngine] = useState('wan');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [fps, setFps] = useState(16);
  const [steps, setSteps] = useState(25);
  const [cfg, setCfg] = useState(7.0);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quality, setQuality] = useState('720p');
  const [seed, setSeed] = useState(-1);

  const [jobStatus, setJobStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
  };

  const startTimer = () => {
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'video' })
      });
      const data = await res.json();
      if (data.enhancedPrompt) setPrompt(data.enhancedPrompt);
    } catch (err) {}
    setIsEnhancing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      try {
        const resizedBase64 = await resizeImage(file);
        setImageBase64(resizedBase64);
        addLog(`Image loaded: ${file.name}`);
      } catch (err) {
        console.error("Failed to resize image", err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      alert("Please login first.");
      return;
    }
    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }
    
    setJobStatus('generating');
    setIsSubmitting(true);
    setVideoUrl(null);
    setLogs([]);
    addLog('Initiating video generation...');
    startTimer();

    const getDimensions = (ar: string, q: string) => {
      const qMap: Record<string, number> = { '480p': 480, '720p': 720, '1080p': 1080 };
      const base = qMap[q] || 720;
      switch (ar) {
        case '16:9': return { width: Math.round((base * 16 / 9) / 16) * 16, height: base };
        case '9:16': return { width: base, height: Math.round((base * 16 / 9) / 16) * 16 };
        case '1:1': return { width: base, height: base };
        case '4:3': return { width: Math.round((base * 4 / 3) / 16) * 16, height: base };
        case '3:4': return { width: base, height: Math.round((base * 4 / 3) / 16) * 16 };
        case '21:9': return { width: Math.round((base * 21 / 9) / 16) * 16, height: base };
        default: return { width: 1280, height: 720 };
      }
    };
    const { width, height } = getDimensions(aspectRatio, quality);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ 
          engine,
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

      setIsSubmitting(false);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 429) {
           throw new Error(data?.error || 'AI generation limits are currently exhausted due to high traffic. Please try again later.');
        }
        throw new Error(data?.error || 'Failed to generate video');
      }

      const data = await res.json();
      
      if (data.status === 'queued') {
        const timestamp = data.timestamp;
        addLog(`Job submitted and queued successfully! You can submit another video while this generates.`);
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max wait
        
        const checkStatus = async () => {
          if (attempts >= maxAttempts) {
             addLog("Generation is taking longer than expected. Please check your 'My Generations' tab later.");
             setJobStatus('idle');
             stopTimer();
             return;
          }
          attempts++;
          
          const { data: gens } = await supabase
            .from('generations')
            .select('video_url, created_at')
            .eq('user_id', session?.user?.id)
            .gte('created_at', timestamp)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (gens && gens.length > 0 && gens[0].video_url && gens[0].video_url !== 'pending') {
            setVideoUrl(gens[0].video_url);
            setJobStatus('done');
            addLog(`Generation completed successfully!`);
            stopTimer();
            fetchCredits(user.id);
          } else {
            setTimeout(checkStatus, 5000);
          }
        };
        setTimeout(checkStatus, 5000);
      } else {
        setVideoUrl(data.video_url);
        setJobStatus('done');
        stopTimer();
        addLog('Generation completed successfully!');
        fetchCredits(user.id);
      }
    } catch (err: any) {
      console.error(err);
      setIsSubmitting(false);
      addLog(`Error: ${err.message}`);
      setJobStatus('error');
      stopTimer();
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto custom-scrollbar">
      {/* Left Column: Controls */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 size={18} className="text-zinc-400" />
            <h2 className="font-semibold text-lg">Generation Settings</h2>
          </div>

          <div className="space-y-4 bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl">
            
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ImageIcon size={14} /> Base Image (Optional)
              </label>
              <div 
                className="relative h-32 w-full border-2 border-dashed border-zinc-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors bg-zinc-950 flex flex-col items-center justify-center group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    setUploadedImage(URL.createObjectURL(file));
                    resizeImage(file).then(setImageBase64).catch(err => console.error(err));
                    addLog(`Image loaded: ${file.name}`);
                  }
                }}
              >
                {uploadedImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                ) : (
                  <div className="text-zinc-500 flex flex-col items-center gap-2">
                    <Upload size={24} />
                    <span className="text-xs font-medium">Drag & Drop or Click</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Text Prompts */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Engine Selector</label>
                <div className="flex gap-2">
                  <select 
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 rounded-lg pl-3 pr-8 py-2.5 appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="wan">Wan 2.2 (5B Fast)</option>
                    <option value="ltx">LTX Video (Cinematic Action)</option>
                  </select>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 min-w-[80px] justify-center">
                    <span className="text-xs font-semibold text-indigo-400">
                      {engine === 'ltx' ? '10 Credits' : '5 Credits'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium text-zinc-300 flex justify-between">
                    <span>Prompt</span>
                    <span className="text-xs text-zinc-500 font-normal ml-2">Required</span>
                  </label>
                  <button 
                    onClick={enhancePrompt} 
                    disabled={isEnhancing || !prompt.trim()}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                    title="Enhance prompt with Gemini"
                  >
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Enhance
                  </button>
                </div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate in detail..."
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none custom-scrollbar"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Negative Prompt</label>
                <input 
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="blur, low quality, artifacts..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Dimensions and Quality */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '16:9', desc: 'Landscape', icon: <div className="w-5 h-3 border-2 border-current rounded-sm" /> },
                    { label: '9:16', desc: 'Portrait', icon: <div className="w-3 h-5 border-2 border-current rounded-sm" /> },
                    { label: '1:1', desc: 'Square', icon: <div className="w-4 h-4 border-2 border-current rounded-sm" /> },
                    { label: '4:3', desc: 'Classic', icon: <div className="w-[18px] h-[14px] border-2 border-current rounded-sm" /> },
                    { label: '3:4', desc: 'Vertical', icon: <div className="w-[14px] h-[18px] border-2 border-current rounded-sm" /> },
                    { label: '21:9', desc: 'Cinematic', icon: <div className="w-6 h-[10px] border-2 border-current rounded-sm" /> }
                  ].map((ar) => (
                    <button
                      key={ar.label}
                      onClick={() => setAspectRatio(ar.label)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${aspectRatio === ar.label ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
                    >
                      <div className="h-6 flex items-center justify-center">{ar.icon}</div>
                      <div className="text-xs font-semibold">{ar.label}</div>
                      <div className="text-[10px] opacity-70">{ar.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Quality</label>
                <div className="flex gap-2">
                  {['480p', '720p', '1080p'].map(q => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${quality === q ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Advanced Parameters</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Duration</label>
                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                      {[5, 8, 10].map(s => (
                        <button
                          key={s}
                          onClick={() => setDurationSeconds(s)}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${durationSeconds === s ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-zinc-400">
                      <label>Steps</label>
                      <span>{steps}</span>
                    </div>
                    <input 
                      type="range" min="10" max="50" step="1" 
                      value={steps} onChange={(e) => setSteps(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-zinc-400">
                    <label>CFG Scale</label>
                    <span>{cfg.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min="1.0" max="9.0" step="0.5" 
                    value={cfg} onChange={(e) => setCfg(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
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
            </div>

          </div>

          {/* Generate Button */}
          <button 
            onClick={handleGenerate}
            disabled={isSubmitting}
            className={`
              w-full py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm mt-1 transition-all
              ${isSubmitting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'}
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Video <span className="opacity-50 font-normal ml-1">({engine === 'ltx' ? 10 : 5} Credits)</span>
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
              {engine === 'ltx' ? 'ForgeFrame LTX Engine' : 'ForgeFrame Wan Engine'}
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
