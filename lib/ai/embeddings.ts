import { getOpenAIClient } from "./openai-client";

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 * This is the same model used in the extraction pipeline
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch
 * More efficient for processing multiple entries at once
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
    encoding_format: "float",
  });

  return response.data.map((item) => item.embedding);
}
