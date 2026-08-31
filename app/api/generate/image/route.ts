import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { user, prompt, aspectRatio = '1:1' } = await req.json();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oaqtglfngpvekyxhwyzx.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check credits
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return NextResponse.json({ error: 'Insufficient credits (2 required)' }, { status: 402 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: { aspectRatio }
      }
    });

    let b64 = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        b64 = part.inlineData.data || '';
        break;
      }
    }

    if (!b64) throw new Error('No image returned from model');
    const imageBuffer = Buffer.from(b64, 'base64');
    let imageUrl = '';

    try {
      const fileName = `${user.id}/img_${Date.now()}.jpg`;
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('videos') // reusing videos bucket
        .upload(fileName, imageBuffer, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;

      await supabaseAdmin.from('generations').insert({
        user_id: user.id,
        prompt: `[Image] ${prompt}`,
        video_url: imageUrl
      });

      await supabaseAdmin.from('user_profiles').update({ credits: profile.credits - 2 }).eq('id', user.id);
    } catch (dbError) {
      console.error("Supabase pipeline error for image:", dbError);
      imageUrl = `data:image/jpeg;base64,${b64}`;
    }

    return NextResponse.json({ url: imageUrl });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
