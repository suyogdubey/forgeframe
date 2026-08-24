const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: "A robot holding a red skateboard." }],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });
    console.log("Image OK");
  } catch (e) { console.error("Image Error:", e.message); }
}
test();
