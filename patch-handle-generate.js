const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf-8');

const searchStr = `      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': \`Bearer \${session.access_token}\` } : {})
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
      addLog('Generation completed successfully!');
      refreshCredits();`;

const replaceStr = `      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': \`Bearer \${session.access_token}\` } : {})
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
      if (data.status === 'queued') {
        const timestamp = data.timestamp;
        addLog(\`Job submitted! Generation in progress on Modal backend...\`);
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
            
          if (gens && gens.length > 0 && gens[0].video_url) {
            setVideoUrl(gens[0].video_url);
            setJobStatus('done');
            addLog(\`Generation completed successfully!\`);
            stopTimer();
            refreshCredits();
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
        refreshCredits();
      }`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync('app/page.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find searchStr");
}
