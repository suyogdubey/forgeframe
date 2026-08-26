const fs = require('fs');
let code = fs.readFileSync('app/api/generate/route.ts', 'utf-8');

// We rewrite the file because it's easier.
const newCode = `
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Create a user client to verify token and fetch user details
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: \`Bearer \${token}\` } }
    });
    // Create an admin client for bypassing RLS on storage & DB
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const prompt = body.prompt || '';
    
    const { data: profile, error: profileError } = await supabaseUser
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    if (profile.credits < 5) {
      return NextResponse.json({ error: 'Insufficient credits. Need 5.' }, { status: 402 });
    }

    // Deduct credits early
    await supabaseAdmin.from('user_profiles').update({ credits: profile.credits - 5 }).eq('id', user.id);

    const backendUrl = process.env.MODAL_BACKEND_URL;
    const requestStartTime = new Date().toISOString();

    // Background process
    const processGeneration = async () => {
      try {
        let videoBuffer: ArrayBuffer;
        let contentType = 'video/mp4';

        if (!backendUrl) {
          console.log("No MODAL_BACKEND_URL found. Simulating job delay...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          const mockVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
          const videoRes = await fetch(mockVideo);
          videoBuffer = await videoRes.arrayBuffer();
        } else {
          const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, user_id: user.id })
          });
          
          if (!response.ok) {
            console.error(\`Modal backend error: \${response.status}\`);
            // Refund credits if generation failed at Modal side
            await supabaseAdmin.from('user_profiles').update({ credits: profile.credits }).eq('id', user.id);
            return;
          }
          videoBuffer = await response.arrayBuffer();
          contentType = response.headers.get('Content-Type') || 'video/mp4';
        }
        
        let videoUrl = '';
        const fileName = \`\${user.id}/\${Date.now()}.mp4\`;
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
        
        await supabaseAdmin.from('generations').insert({
          user_id: user.id,
          prompt: prompt,
          video_url: videoUrl
        });

      } catch (err) {
        console.error("Background generation error:", err);
        // Attempt to refund on failure
        await supabaseAdmin.from('user_profiles').update({ credits: profile.credits }).eq('id', user.id);
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
`;

fs.writeFileSync('app/api/generate/route.ts', newCode);
