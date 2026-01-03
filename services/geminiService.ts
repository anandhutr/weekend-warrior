
import { GoogleGenAI } from "@google/genai";
import { Player, Team } from "../types";

export class GeminiService {
  async getScoutingReport(player: Player): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return "AI Scouting disabled: API Key missing.";

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Provide a short, professional cricket scouting report for ${player.name} (${player.role}). 
    Stats: ${JSON.stringify(player.stats)}. 
    Focus on T20 viability, key strengths, and potential weaknesses. Keep it under 100 words.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      return response.text() || "No scouting report available at this time.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Scouting report unavailable.";
    }
  }
}

export const geminiService = new GeminiService();
