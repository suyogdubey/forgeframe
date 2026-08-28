'use client';

import React, { useState } from 'react';
import { ImageIcon, Sparkles, Settings2, Loader2, RefreshCw } from 'lucide-react';
import { AppContext } from '@/components/AppLayout';

export default function ImageGenerationPage() {
  const { credits, refreshCredits, session } = React.useContext(AppContext);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('imagen');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [jobStatus, setJobStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'image' })
      });
      const data = await res.json();
      if (data.enhancedPrompt) setPrompt(data.enhancedPrompt);
    } catch (err) {}
    setIsEnhancing(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !session?.user) return;
    setJobStatus('generating');
    setError(null);
    setImageUrl(null);
    
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: session.user, prompt, aspectRatio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      
      setImageUrl(data.url);
      setJobStatus('done');
      refreshCredits();
    } catch (err: any) {
      setError(err.message);
      setJobStatus('idle');
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col md:flex-row bg-[#000000]">
      {/* Settings Panel */}
      <div className="w-full md:w-80 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Settings2 size={18} className="text-zinc-400" />
            Image Generation
          </h2>
        </div>
        
        <div className="p-4 space-y-6 shrink-0">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">AI Model</label>
            <div className="relative">
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 rounded-lg pl-3 pr-10 py-2.5 appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="imagen">ForgeFrame Vision Engine</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Aspect Ratio</label>
             <div className="grid grid-cols-3 gap-2">
                {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                  <button 
                    key={ratio} 
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 text-xs font-medium rounded border transition-colors ${aspectRatio === ratio ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                  >
                    {ratio}
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-zinc-800 shrink-0">
          <button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || jobStatus === 'generating'}
            className={`
              w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm transition-all
              ${prompt.trim() && jobStatus !== 'generating' ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}
            `}
          >
            {jobStatus === 'generating' ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Generate Image <span className="opacity-40 font-normal ml-1">2 Credits</span></>
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-y-auto">
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full h-full">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">×</button>
            </div>
          )}

          <div className="flex-1 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/30 flex items-center justify-center relative overflow-hidden mb-6 max-h-[65vh]">
            {jobStatus === 'generating' ? (
              <div className="flex flex-col items-center justify-center text-indigo-400 space-y-4">
                <Loader2 size={40} className="animate-spin" />
                <p className="font-medium animate-pulse">Synthesizing image...</p>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Generated" className="object-contain max-h-full max-w-full" />
            ) : (
              <div className="text-center text-zinc-500 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900/80 flex items-center justify-center mb-4 border border-zinc-800/50">
                  <ImageIcon size={32} className="text-zinc-600" />
                </div>
                <p className="font-medium text-zinc-400">Ready to create</p>
                <p className="text-sm mt-1">Describe what you want to see below</p>
              </div>
            )}
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 focus-within:border-indigo-500/50 focus-within:bg-zinc-900 transition-all shadow-lg relative shrink-0">
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button 
                onClick={enhancePrompt} 
                disabled={isEnhancing || !prompt.trim()}
                className="text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Enhance
              </button>
              
            </div>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate (e.g. A cyberpunk city at night with neon lights...)" 
              className="w-full bg-transparent text-zinc-200 placeholder-zinc-500 text-sm resize-none focus:outline-none p-3 min-h-[80px]"
            />
            
          </div>
        </div>
      </div>
    </div>
  );
}
