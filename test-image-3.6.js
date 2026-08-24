const { GoogleGenAI, Modality } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [{ text: "A robot holding a red skateboard." }],
      },
      config: {
        responseModalities: [Modality.IMAGE]
      }
    });
    console.log("Image 3.6 OK", response.candidates?.[0]?.content?.parts?.[0]?.inlineData ? "Has Image" : "No Image");
  } catch (e) { console.error("Image 3.6 Error:", e.message); }
}
test();
