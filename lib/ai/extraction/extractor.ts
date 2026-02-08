import { getOpenAIClient } from "@/lib/ai/openai-client";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  ExtractionResultSchema,
  type ExtractionResult,
} from "./schemas";
import {
  EXTRACTION_SYSTEM_PROMPT,
  createExtractionPrompt,
} from "./prompts";

/**
 * Extract structured information from a journal entry using OpenAI
 */
export async function extractFromEntry(
  content: string,
  entryDate?: Date
): Promise<ExtractionResult> {
  const openai = getOpenAIClient();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06", // Model that supports structured outputs
      messages: [
        {
          role: "system",
          content: EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: createExtractionPrompt(content, entryDate),
        },
      ],
      response_format: zodResponseFormat(ExtractionResultSchema, "extraction"),
      temperature: 0.1, // Low temperature for consistent extractions
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      throw new Error("No message content from OpenAI");
    }

    // Parse the JSON response and validate with Zod schema
    const result = ExtractionResultSchema.parse(JSON.parse(messageContent));
    return result;
  } catch (error) {
    console.error("Error extracting from entry:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

/**
 * Extract structured information with error handling and fallback
 */
export async function safeExtractFromEntry(
  content: string,
  entryDate?: Date
): Promise<ExtractionResult | null> {
  try {
    return await extractFromEntry(content, entryDate);
  } catch (error) {
    console.error("Safe extraction failed:", error);
    return null;
  }
}
