const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'hello'
    });
    console.log("Audio/Text OK");
  } catch (e) { console.error("Text Error:", e.message); }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances: [{ prompt: 'a cat' }] })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    console.log("Image OK");
  } catch (e) {
    console.error("Image Error:", e.message);
  }
}
test();
