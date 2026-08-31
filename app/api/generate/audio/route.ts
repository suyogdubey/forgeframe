import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

function addWavHeader(pcmBuffer: Buffer, sampleRate: number, numChannels: number, bitsPerSample: number): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

export async function POST(req: NextRequest) {
  try {
    const { user, prompt, voice = 'Aoede' } = await req.json();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oaqtglfngpvekyxhwyzx.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_95EPkKJt9ieo1p1GGfnxxw_ZatypR-a';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits (1 required)' }, { status: 402 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: prompt,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const b64 = part?.inlineData?.data;
    if (!b64) throw new Error('No audio returned from Gemini');

    const pcmBuffer = Buffer.from(b64, 'base64');
    const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);
    let audioUrl = '';

    try {
      const fileName = `${user.id}/audio_${Date.now()}.wav`;
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('videos') // reusing videos bucket to bypass setup constraints
        .upload(fileName, wavBuffer, { contentType: 'audio/wav' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName);
      audioUrl = publicUrlData.publicUrl;

      await supabaseAdmin.from('generations').insert({
        user_id: user.id,
        prompt: `[Audio - ${voice}] ${prompt.substring(0, 50)}...`,
        video_url: audioUrl
      });

      await supabaseAdmin.from('user_profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
    } catch (dbError) {
      console.error("Supabase pipeline error for audio:", dbError);
      const wavBase64 = wavBuffer.toString('base64');
      audioUrl = `data:audio/wav;base64,${wavBase64}`;
    }

    return NextResponse.json({ url: audioUrl });
  } catch (error: any) {
    console.error('Audio generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
