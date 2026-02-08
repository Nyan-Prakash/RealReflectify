import { db } from "@/lib/db/client";
import { threads, threadLinks, entries } from "@/lib/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type ThreadWithStats = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  entryCount: number;
  latestEntryDate: Date | null;
  earliestEntryDate: Date | null;
};

export type ThreadDetail = {
  thread: typeof threads.$inferSelect;
  entries: Array<{
    entry: typeof entries.$inferSelect;
    link: typeof threadLinks.$inferSelect;
  }>;
  stats: {
    totalEntries: number;
    dateRange: { from: Date | null; to: Date | null };
  };
};

// ============================================================================
// Thread CRUD
// ============================================================================

/**
 * Create a new thread
 */
export async function createThread(data: {
  userId: string;
  title: string;
  description?: string;
}) {
  const now = new Date();
  const [thread] = await db
    .insert(threads)
    .values({
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return thread;
}

/**
 * Get all threads for a user with stats
 */
export async function getUserThreads(userId: string): Promise<ThreadWithStats[]> {
  const result = await db
    .select({
      id: threads.id,
      title: threads.title,
      description: threads.description,
      status: threads.status,
      createdAt: threads.createdAt,
      updatedAt: threads.updatedAt,
      entryCount: sql<number>`count(distinct ${threadLinks.entryId})::int`,
      latestEntryDate: sql<Date | null>`max(${entries.occurredAt})`,
      earliestEntryDate: sql<Date | null>`min(${entries.occurredAt})`,
    })
    .from(threads)
    .leftJoin(threadLinks, eq(threadLinks.threadId, threads.id))
    .leftJoin(entries, eq(entries.id, threadLinks.entryId))
    .where(eq(threads.userId, userId))
    .groupBy(threads.id)
    .orderBy(desc(threads.updatedAt));

  return result;
}

/**
 * Get a single thread by ID with all linked entries
 */
export async function getThreadById(
  threadId: string,
  userId: string
): Promise<ThreadDetail | null> {
  // Get the thread
  const [thread] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)));

  if (!thread) return null;

  // Get all linked entries ordered by occurred_at
  const linkedEntries = await db
    .select({
      entry: entries,
      link: threadLinks,
    })
    .from(threadLinks)
    .innerJoin(entries, eq(entries.id, threadLinks.entryId))
    .where(
      and(
        eq(threadLinks.threadId, threadId),
        eq(threadLinks.userId, userId)
      )
    )
    .orderBy(desc(entries.occurredAt));

  const dates = linkedEntries.map((le) => le.entry.occurredAt);

  return {
    thread,
    entries: linkedEntries,
    stats: {
      totalEntries: linkedEntries.length,
      dateRange: {
        from: dates.length > 0 ? dates[dates.length - 1] : null,
        to: dates.length > 0 ? dates[0] : null,
      },
    },
  };
}

/**
 * Update a thread
 */
export async function updateThread(
  threadId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    status?: "active" | "paused" | "completed" | "archived";
  }
) {
  const [thread] = await db
    .update(threads)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
    .returning();

  return thread;
}

/**
 * Delete a thread (cascades to thread_links)
 */
export async function deleteThread(threadId: string, userId: string) {
  const [thread] = await db
    .delete(threads)
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
    .returning();

  return thread;
}

// ============================================================================
// Thread Links
// ============================================================================

/**
 * Link an entry to a thread
 */
export async function linkEntryToThread(data: {
  userId: string;
  threadId: string;
  entryId: string;
  linkType?: "manual" | "suggested" | "auto";
  linkReason?: {
    keywords?: string[];
    similarityScore?: number;
    sharedEntities?: string[];
  };
  confidenceScore?: string;
}) {
  const [link] = await db
    .insert(threadLinks)
    .values({
      userId: data.userId,
      threadId: data.threadId,
      entryId: data.entryId,
      linkType: data.linkType || "manual",
      linkReason: data.linkReason || null,
      confidenceScore: data.confidenceScore || null,
      createdAt: new Date(),
    })
    .onConflictDoNothing() // Don't error if link already exists
    .returning();

  // Update the thread's updatedAt timestamp
  if (link) {
    await db
      .update(threads)
      .set({ updatedAt: new Date() })
      .where(eq(threads.id, data.threadId));
  }

  return link;
}

/**
 * Unlink an entry from a thread
 */
export async function unlinkEntryFromThread(
  threadId: string,
  entryId: string,
  userId: string
) {
  const [link] = await db
    .delete(threadLinks)
    .where(
      and(
        eq(threadLinks.threadId, threadId),
        eq(threadLinks.entryId, entryId),
        eq(threadLinks.userId, userId)
      )
    )
    .returning();

  return link;
}

// ============================================================================
// AI-Powered Suggestions
// ============================================================================

/**
 * Find entries similar to those already in a thread using embedding similarity.
 * Returns entries not yet linked to the thread, ordered by similarity.
 */
export async function suggestEntriesForThread(
  threadId: string,
  userId: string,
  limit: number = 10,
  similarityThreshold: number = 0.4
) {
  // Get entry IDs already linked to this thread
  const linkedEntryIds = await db
    .select({ entryId: threadLinks.entryId })
    .from(threadLinks)
    .where(
      and(
        eq(threadLinks.threadId, threadId),
        eq(threadLinks.userId, userId)
      )
    );

  const linkedIds = linkedEntryIds
    .map((le) => le.entryId)
    .filter((id): id is string => id !== null);

  if (linkedIds.length === 0) {
    // No entries in thread yet, return recent entries as suggestions
    return db
      .select({
        id: entries.id,
        content: entries.content,
        occurredAt: entries.occurredAt,
        createdAt: entries.createdAt,
        parseStatus: entries.parseStatus,
        metadata: entries.metadata,
        similarityScore: sql<number>`0`,
      })
      .from(entries)
      .where(
        and(
          eq(entries.userId, userId),
          sql`embedding IS NOT NULL`
        )
      )
      .orderBy(desc(entries.occurredAt))
      .limit(limit);
  }

  // Calculate the average embedding of linked entries to find similar ones
  // This uses pgvector's AVG to compute a centroid embedding
  const results = await db.execute(sql`
    WITH thread_entries AS (
      SELECT e.embedding
      FROM entries e
      INNER JOIN thread_links tl ON tl.entry_id = e.id
      WHERE tl.thread_id = ${threadId}
        AND tl.user_id = ${userId}
        AND e.embedding IS NOT NULL
    ),
    centroid AS (
      SELECT AVG(embedding) as avg_embedding
      FROM thread_entries
    )
    SELECT
      e.id,
      e.content,
      e.occurred_at as "occurredAt",
      e.created_at as "createdAt",
      e.parse_status as "parseStatus",
      e.metadata,
      1 - (e.embedding <=> c.avg_embedding) as "similarityScore"
    FROM entries e, centroid c
    WHERE e.user_id = ${userId}
      AND e.embedding IS NOT NULL
      AND e.id != ALL(${linkedIds})
      AND 1 - (e.embedding <=> c.avg_embedding) > ${similarityThreshold}
    ORDER BY e.embedding <=> c.avg_embedding
    LIMIT ${limit}
  `);

  return (results as unknown as Array<{
    id: string;
    content: string;
    occurredAt: Date;
    createdAt: Date;
    parseStatus: string;
    metadata: Record<string, unknown>;
    similarityScore: number;
  }>);
}

/**
 * Get all user entries not linked to a specific thread (for manual linking)
 */
export async function getUnlinkedEntries(
  threadId: string,
  userId: string,
  searchQuery?: string,
  limit: number = 20
) {
  // Get linked entry IDs
  const linkedEntryIds = await db
    .select({ entryId: threadLinks.entryId })
    .from(threadLinks)
    .where(
      and(
        eq(threadLinks.threadId, threadId),
        eq(threadLinks.userId, userId)
      )
    );

  const linkedIds = linkedEntryIds
    .map((le) => le.entryId)
    .filter((id): id is string => id !== null);

  // Build conditions
  const conditions = [eq(entries.userId, userId)];

  if (linkedIds.length > 0) {
    conditions.push(sql`${entries.id} != ALL(${linkedIds})`);
  }

  if (searchQuery) {
    conditions.push(
      sql`${entries.content} ILIKE ${"%" + searchQuery + "%"}`
    );
  }

  return db
    .select({
      id: entries.id,
      content: entries.content,
      occurredAt: entries.occurredAt,
      createdAt: entries.createdAt,
      parseStatus: entries.parseStatus,
    })
    .from(entries)
    .where(and(...conditions))
    .orderBy(desc(entries.occurredAt))
    .limit(limit);
}
