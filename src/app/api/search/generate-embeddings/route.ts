import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import {
  getEntriesWithoutEmbeddings,
  updateEntryEmbedding,
} from "@/lib/db/queries/search";
import { generateEmbeddings } from "@/lib/ai/embeddings";

/**
 * POST /api/search/generate-embeddings
 * Generate embeddings for all entries that don't have them yet
 * Processes in batches to avoid rate limits and memory issues
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchSize = 50 } = await request.json().catch(() => ({}));

    // Get entries without embeddings
    const entriesWithoutEmbeddings = await getEntriesWithoutEmbeddings(
      user.id,
      batchSize
    );

    if (entriesWithoutEmbeddings.length === 0) {
      return NextResponse.json({
        message: "All entries already have embeddings",
        processed: 0,
      });
    }

    console.log(
      `[Generate Embeddings] Processing ${entriesWithoutEmbeddings.length} entries for user ${user.id}`
    );

    // Generate embeddings in batches (OpenAI allows multiple texts in one request)
    const texts = entriesWithoutEmbeddings.map((entry) => entry.content);
    const embeddings = await generateEmbeddings(texts);

    // Update each entry with its embedding
    const updatePromises = entriesWithoutEmbeddings.map((entry, index) =>
      updateEntryEmbedding(entry.id, embeddings[index])
    );

    await Promise.all(updatePromises);

    console.log(
      `[Generate Embeddings] Successfully processed ${entriesWithoutEmbeddings.length} entries`
    );

    return NextResponse.json({
      message: `Successfully generated embeddings for ${entriesWithoutEmbeddings.length} entries`,
      processed: entriesWithoutEmbeddings.length,
    });
  } catch (error) {
    console.error("[POST /api/search/generate-embeddings] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate embeddings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
