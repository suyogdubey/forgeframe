import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { user, videoUrl } = await req.json();

    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!videoUrl) return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oaqtglfngpvekyxhwyzx.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('credits').eq('id', user.id).single();
    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits (1 required)' }, { status: 402 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const vidRes = await fetch(videoUrl);
    if (!vidRes.ok) throw new Error('Failed to fetch media from URL');
    const arrayBuffer = await vidRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let mimeType = 'video/mp4';
    if (videoUrl.includes('.webm')) mimeType = 'video/webm';
    else if (videoUrl.includes('.mp3')) mimeType = 'audio/mp3';
    else if (videoUrl.includes('.wav')) mimeType = 'audio/wav';

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType
          }
        },
        "Transcribe the speech in this media. Provide the output in strictly valid SRT format, including sequence numbers, timestamps (HH:MM:SS,mmm --> HH:MM:SS,mmm), and the text. Output ONLY the SRT content without any markdown formatting or extra text."
      ]
    });

    const srt = response.text?.replace(/```srt\n?/gi, '').replace(/```\n?/g, '').trim() || '';

    await supabaseAdmin.from('user_profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);

    return NextResponse.json({ srt });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
