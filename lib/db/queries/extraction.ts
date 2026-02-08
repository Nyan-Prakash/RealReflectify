import { db } from "@/lib/db/client";
import { entities, events, mentions, parseRuns } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ExtractionResult } from "@/lib/ai/extraction/schemas";

// Map extraction event types to database event types
function mapEventType(
  extractionType: string
): "meeting" | "task" | "deadline" | "milestone" | "appointment" | "social" | "work" | "exercise" | "meal" | "travel" | "other" {
  const mapping: Record<string, "meeting" | "task" | "deadline" | "milestone" | "appointment" | "social" | "work" | "exercise" | "meal" | "travel" | "other"> = {
    meeting: "meeting",
    meal: "meal",
    activity: "exercise",
    conversation: "social",
    task: "task",
    accomplishment: "milestone",
    reflection: "other",
    other: "other",
  };
  return mapping[extractionType] || "other";
}

/**
 * Create a parse run record to track AI processing
 */
export async function createParseRun(data: {
  entryId: string;
  userId: string;
  status: "started" | "completed" | "failed";
  model?: string;
  error?: string;
}) {
  const [parseRun] = await db
    .insert(parseRuns)
    .values({
      entryId: data.entryId,
      userId: data.userId,
      status: data.status,
      model: data.model || "gpt-4o-2024-08-06",
      startedAt: new Date(),
      completedAt: data.status === "completed" || data.status === "failed" ? new Date() : null,
      errorMessage: data.error,
    })
    .returning();

  return parseRun;
}

/**
 * Update a parse run status
 */
export async function updateParseRun(
  parseRunId: string,
  data: {
    status: "started" | "completed" | "failed";
    error?: string;
  }
) {
  const [parseRun] = await db
    .update(parseRuns)
    .set({
      status: data.status,
      completedAt: new Date(),
      errorMessage: data.error,
    })
    .where(eq(parseRuns.id, parseRunId))
    .returning();

  return parseRun;
}

/**
 * Get active (in-progress) parse run for an entry
 * Returns the parse run if there's one with status "started"
 */
export async function getActiveParseRun(entryId: string, userId: string) {
  const [activeRun] = await db
    .select()
    .from(parseRuns)
    .where(
      and(
        eq(parseRuns.entryId, entryId),
        eq(parseRuns.userId, userId),
        eq(parseRuns.status, "started")
      )
    )
    .limit(1);

  return activeRun;
}

/**
 * Get all parse runs for an entry (history)
 */
export async function getParseRunHistory(entryId: string, userId: string) {
  return await db
    .select()
    .from(parseRuns)
    .where(
      and(
        eq(parseRuns.entryId, entryId),
        eq(parseRuns.userId, userId)
      )
    )
    .orderBy(desc(parseRuns.startedAt));
}

/**
 * Get or create an entity by name and type
 * This is a simple version - we'll add deduplication logic later
 */
export async function getOrCreateEntity(data: {
  userId: string;
  type: "person" | "place" | "organization" | "food" | "activity";
  canonicalName: string;
}) {
  // First, try to find existing entity with exact name and type match
  const [existingEntity] = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.userId, data.userId),
        eq(entities.entityType, data.type),
        eq(entities.canonicalName, data.canonicalName)
      )
    )
    .limit(1);

  if (existingEntity) {
    return existingEntity;
  }

  // Create new entity
  const [newEntity] = await db
    .insert(entities)
    .values({
      userId: data.userId,
      entityType: data.type,
      canonicalName: data.canonicalName,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newEntity;
}

/**
 * Persist extraction results to the database
 */
export async function persistExtractionResults(
  entryId: string,
  userId: string,
  extraction: ExtractionResult,
  content: string,
  parseRunId: string
) {
  try {
    // 1. Process entities and create mentions
    for (const entityMention of extraction.entities) {
      const entity = await getOrCreateEntity({
        userId,
        type: entityMention.type,
        canonicalName: entityMention.name,
      });

      // Create mention linking entity to entry
      await db.insert(mentions).values({
        userId,
        entryId,
        entityId: entity.id,
        mentionedAs: entityMention.mentionText,
        context: entityMention.context,
        confidenceScore: entityMention.confidence.toString(),
        createdAt: new Date(),
      });
    }

    // 2. Create events
    for (const eventData of extraction.events) {
      // Extract text span from entry content
      const extractedText = content
        ? content.slice(eventData.startOffset, eventData.endOffset)
        : null;

      await db.insert(events).values({
        userId,
        entryId,
        title: eventData.title,
        description: eventData.description,
        eventType: mapEventType(eventData.eventType),
        startDate: eventData.occurredAt ? new Date(eventData.occurredAt) : null,
        endDate: null,
        isAllDay: false,
        extractedText,
        confidenceScore: eventData.confidence.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Update parse run with results
    await updateParseRun(parseRunId, {
      status: "completed",
    });

    return true;
  } catch (error) {
    console.error("Error persisting extraction results:", error);
    await updateParseRun(parseRunId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
