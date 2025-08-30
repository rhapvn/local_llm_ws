import { GoogleGenAI } from "@google/genai";

// Google Generative AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEN_MODEL_DEFAULT = "gemini-1.5-flash";
const EMBED_MODEL = "gemini-embedding-001";

export interface GeminiClient {
  generateContent: (prompt: string, model?: string) => Promise<string>;
  embedContent: (text: string) => Promise<number[]>;
  embedMultiple: (texts: string[]) => Promise<number[][]>;
  clearMemory: () => void;
}

export const createGeminiClient = (): GeminiClient => {
  let client: GoogleGenAI | null = null;

  const initGemini = async (): Promise<GoogleGenAI> => {
    if (client) return client;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    try {
      client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      console.log("✅ Gemini initialized successfully with new SDK");
      return client;
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
      throw error;
    }
  };

  const generateContent = async (prompt: string, model: string = GEN_MODEL_DEFAULT): Promise<string> => {
    try {
      const genAIInstance = await initGemini();
      const result = await genAIInstance.models.generateContent({
        model,
        contents: prompt,
      });
      return result.text || "";
    } catch (error) {
      console.error("Content generation failed:", error);
      throw error;
    }
  };

  const embedContent = async (text: string): Promise<number[]> => {
    try {
      const genAIInstance = await initGemini();
      const result = await genAIInstance.models.embedContent({
        model: EMBED_MODEL,
        contents: text,
      });
      return result.embeddings?.[0]?.values || [];
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw error;
    }
  };

  const embedMultiple = async (texts: string[]): Promise<number[][]> => {
    const embeddings: number[][] = [];

    console.log(`🔍 Generating embeddings for ${texts.length} texts...`);

    // Add timeout protection
    const startTime = Date.now();
    const maxTime = 30000; // 30 seconds max for embedding generation

    for (let i = 0; i < texts.length; i++) {
      try {
        // Check timeout
        if (Date.now() - startTime > maxTime) {
          console.warn(`⚠️ Embedding generation timeout reached after ${maxTime / 1000} seconds`);
          break;
        }

        const text = texts[i];
        console.log(`📝 Embedding text ${i + 1}/${texts.length} (${text.length} chars)`);

        const embedding = await embedContent(text);
        embeddings.push(embedding);

        // Add small delay to avoid rate limiting
        if (i < texts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to embed text ${i + 1}:`, error);
        // Fallback to random embedding
        const fallbackEmbedding = Array.from({ length: 768 }, () => Math.random());
        embeddings.push(fallbackEmbedding);
      }
    }

    console.log(`✅ Generated ${embeddings.length} embeddings`);
    return embeddings;
  };

  const clearMemory = (): void => {
    client = null;
    console.log("Gemini client memory cleared");
  };

  return {
    generateContent,
    embedContent,
    embedMultiple,
    clearMemory,
  };
};
