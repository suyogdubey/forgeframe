import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Enhance the following ${type} prompt with rich cinematic keywords, camera dynamics, lighting details, and stylistic depth. Keep it under 50 words. Only output the enhanced prompt text, without any introductory or conversational text, and without markdown quotes. Original prompt: ${prompt}`,
    });
    
    return NextResponse.json({ enhancedPrompt: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
