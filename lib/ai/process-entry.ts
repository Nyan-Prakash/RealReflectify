import { extractFromEntry } from "./extraction/extractor";
import {
  createParseRun,
  persistExtractionResults,
  updateParseRun,
} from "@/lib/db/queries/extraction";
import { db } from "@/lib/db/client";
import { entries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";
import { updateEntryEmbedding } from "@/lib/db/queries/search";

/**
 * Process an entry: extract entities, events, and persist to database
 */
export async function processEntry(entryId: string, userId: string) {
  console.log(`[Process Entry] ===== STARTING ===== Entry: ${entryId}, User: ${userId}`);
  let parseRun;

  try {
    // 1. Create parse run record
    console.log(`[Process Entry] Step 1: Creating parse run...`);
    parseRun = await createParseRun({
      entryId,
      userId,
      status: "started",
      model: "gpt-4o-2024-08-06",
    });
    console.log(`[Process Entry] Step 1 DONE: Parse run created with ID: ${parseRun.id}`);

    // 2. Get entry content
    const [entry] = await db
      .select()
      .from(entries)
      .where(eq(entries.id, entryId));

    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    // 3. Update entry status to processing (entry status is different from parse_run status)
    await db
      .update(entries)
      .set({
        parseStatus: "processing",
        updatedAt: new Date(),
      })
      .where(eq(entries.id, entryId));

    // 4. Extract structured data with AI
    console.log(`[Process Entry] Extracting data for entry ${entryId}...`);
    const extraction = await extractFromEntry(entry.content, entry.occurredAt);
    console.log(`[Process Entry] Extraction complete. Found:`, {
      entities: extraction.entities.length,
      events: extraction.events.length,
      topics: extraction.topics.length,
    });

    // 5. Persist extraction results to database
    await persistExtractionResults(entryId, userId, extraction, entry.content, parseRun.id);

    // 6. Generate and save embedding for semantic search
    console.log(`[Process Entry] Generating embedding for entry ${entryId}...`);
    try {
      const embedding = await generateEmbedding(entry.content);
      await updateEntryEmbedding(entryId, embedding);
      console.log(`[Process Entry] Embedding generated and saved`);
    } catch (embeddingError) {
      // Log but don't fail the entire process if embedding generation fails
      console.error(`[Process Entry] Failed to generate embedding:`, embeddingError);
    }

    // 7. Update entry status to completed
    await db
      .update(entries)
      .set({
        parseStatus: "completed",
        lastParsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(entries.id, entryId));

    console.log(`[Process Entry] Successfully processed entry ${entryId}`);
    return { success: true, extraction };
  } catch (error) {
    console.error(`[Process Entry] Error processing entry ${entryId}:`, error);

    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error(`[Process Entry] Error name: ${error.name}`);
      console.error(`[Process Entry] Error message: ${error.message}`);
      console.error(`[Process Entry] Error stack:`, error.stack);
    }

    // Update parse run with error
    if (parseRun) {
      await updateParseRun(parseRun.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Update entry status to failed
    await db
      .update(entries)
      .set({
        parseStatus: "failed",
        lastParsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(entries.id, entryId));

    return { success: false, error };
  }
}
