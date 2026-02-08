import OpenAI from "openai";
import { env } from "@/lib/config/env";

/**
 * Singleton OpenAI client instance
 */
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}
