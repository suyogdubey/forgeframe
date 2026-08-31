
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oaqtglfngpvekyxhwyzx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    
    // Create a user client to verify token and fetch user details
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    // Create an admin client for bypassing RLS on storage & DB
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const prompt = body.prompt || '';
    const engine = body.engine || 'wan';
    const creditsCost = engine === 'ltx' ? 10 : 5;
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    if (profile.credits < creditsCost) {
      return NextResponse.json({ error: `Insufficient credits. Need ${creditsCost}.` }, { status: 402 });
    }

    const targetBackendUrl = engine === 'ltx' 
      ? (process.env.MODAL_LTX_URL || 'https://suyogdubey10--ltx-video-backend-api-generate.modal.run')
      : process.env.MODAL_BACKEND_URL;
    const requestStartTime = new Date().toISOString();

    // Insert pending generation row to track it immediately
    let generationId = null;
    const { data: pendingGen } = await supabaseAdmin.from('generations').insert({
      user_id: user.id,
      prompt: prompt,
      video_url: 'pending'
    }).select('id').single();
    
    if (pendingGen) {
      generationId = pendingGen.id;
    }

    // Background process
    const processGeneration = async () => {
      try {
        let videoBuffer: ArrayBuffer;
        let contentType = 'video/mp4';

        if (!targetBackendUrl) {
          console.log(`No backend URL found for engine ${engine}. Simulating job delay...`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          const mockVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
          const videoRes = await fetch(mockVideo);
          videoBuffer = await videoRes.arrayBuffer();
        } else {
          const payload = engine === 'ltx'
            ? { 
                image_base64: body.image_base64, 
                prompt: body.prompt, 
                steps: body.steps || 20, 
                cfg: body.cfg || 3.5, 
                seed: body.seed ?? -1,
                user_id: user.id
              }
            : { 
                image_base64: body.image_base64, 
                prompt: body.prompt, 
                negative_prompt: body.negative_prompt, 
                steps: body.steps, 
                cfg: body.cfg, 
                duration_seconds: body.duration_seconds, 
                fps: body.fps, 
                width: body.width, 
                height: body.height, 
                seed: body.seed,
                user_id: user.id
              };

          const response = await fetch(targetBackendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            console.error(`Modal backend error: ${response.status}`);
            if (generationId) {
              await supabaseAdmin.from('generations').delete().eq('id', generationId);
            }
            return;
          }
          
          const responseContentType = response.headers.get('Content-Type') || '';
          if (responseContentType.includes('application/json')) {
            const data = await response.json();
            if (data.video_url || data.videoUrl) {
              const url = data.video_url || data.videoUrl;
              if (generationId) {
                await supabaseAdmin.from('generations').update({ video_url: url }).eq('id', generationId);
              }
              // Deduct credits
              await supabaseAdmin.from('user_profiles').update({ credits: profile.credits - creditsCost }).eq('id', user.id);
              return;
            }
          }
          
          videoBuffer = await response.arrayBuffer();
          contentType = responseContentType || 'video/mp4';
        }
        
        let videoUrl = '';
        const fileName = `${user.id}/${Date.now()}.mp4`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('videos')
          .upload(fileName, videoBuffer, {
            contentType,
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName);
        videoUrl = publicUrlData.publicUrl;
        
        if (generationId) {
          await supabaseAdmin.from('generations').update({ video_url: videoUrl }).eq('id', generationId);
        }
        
        // Deduct credits after successful generation and upload
        await supabaseAdmin.from('user_profiles').update({ credits: profile.credits - creditsCost }).eq('id', user.id);
      } catch (err) {
        console.error("Background generation error:", err);
        if (generationId) {
          await supabaseAdmin.from('generations').delete().eq('id', generationId);
        }
      }
    };

    // Start background process without awaiting
    processGeneration().catch(console.error);

    return NextResponse.json({ status: 'queued', timestamp: requestStartTime });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
