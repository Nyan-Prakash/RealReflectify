import { db } from "@/lib/db/client";
import { entries, parseRuns, mentions, entities, events, entryTopicLinks, topics } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Create a new journal entry
 */
export async function createEntry(data: {
  userId: string;
  content: string;
  occurredAt?: Date;
}) {
  const now = new Date();
  const [entry] = await db
    .insert(entries)
    .values({
      userId: data.userId,
      content: data.content,
      occurredAt: data.occurredAt || now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return entry;
}

/**
 * Get all entries for a user
 */
export async function getUserEntries(userId: string) {
  return await db
    .select()
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(desc(entries.createdAt));
}

/**
 * Get a single entry by ID
 */
export async function getEntryById(entryId: string, userId: string) {
  const [entry] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)));

  return entry;
}

/**
 * Update an entry
 */
export async function updateEntry(
  entryId: string,
  userId: string,
  data: {
    content?: string;
  }
) {
  const [entry] = await db
    .update(entries)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .returning();

  return entry;
}

/**
 * Delete an entry
 */
export async function deleteEntry(entryId: string, userId: string) {
  const [entry] = await db
    .delete(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .returning();

  return entry;
}

/**
 * Get entries with their parse status
 */
export async function getUserEntriesWithParseStatus(userId: string) {
  return await db
    .select()
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(desc(entries.createdAt));
}

/**
 * Get entry with all extracted data (entities, events, topics, sentiment)
 */
export async function getEntryWithExtractions(entryId: string, userId: string) {
  // Get the entry
  const entry = await getEntryById(entryId, userId);
  if (!entry) return null;

  // Get all mentions for this entry with their entity data
  const entryMentions = await db
    .select({
      mention: mentions,
      entity: entities,
    })
    .from(mentions)
    .innerJoin(entities, eq(mentions.entityId, entities.id))
    .where(and(eq(mentions.entryId, entryId), eq(mentions.userId, userId)));

  // Get all events for this entry
  const entryEvents = await db
    .select()
    .from(events)
    .where(and(eq(events.entryId, entryId), eq(events.userId, userId)));

  // Get event participants (mentions linked to events)
  const eventMentionsData = await db
    .select({
      mention: mentions,
      entity: entities,
    })
    .from(mentions)
    .innerJoin(entities, eq(mentions.entityId, entities.id))
    .where(
      and(
        eq(mentions.entryId, entryId),
        eq(mentions.userId, userId)
      )
    );

  // Get topics for this entry
  const entryTopics = await db
    .select({
      topic: topics,
      link: entryTopicLinks,
    })
    .from(entryTopicLinks)
    .innerJoin(topics, eq(entryTopicLinks.topicId, topics.id))
    .where(and(eq(entryTopicLinks.entryId, entryId), eq(entryTopicLinks.userId, userId)));

  // Get the latest parse run for metadata
  const [latestParseRun] = await db
    .select()
    .from(parseRuns)
    .where(and(eq(parseRuns.entryId, entryId), eq(parseRuns.userId, userId)))
    .orderBy(desc(parseRuns.startedAt))
    .limit(1);

  // Group mentions by entity type
  const groupedEntities = entryMentions.reduce((acc, { mention, entity }) => {
    if (!acc[entity.entityType]) {
      acc[entity.entityType] = [];
    }
    acc[entity.entityType].push({
      entity,
      mention,
    });
    return acc;
  }, {} as Record<string, Array<{ entity: typeof entities.$inferSelect; mention: typeof mentions.$inferSelect }>>);

  // Attach participants to events
  const eventsWithParticipants = entryEvents.map((event) => {
    const participants = eventMentionsData
      .filter(({ mention }) => mention.eventId === event.id)
      .map(({ mention, entity }) => ({
        entity,
        mention,
      }));
    return {
      ...event,
      participants,
    };
  });

  return {
    entry,
    mentions: entryMentions,
    entities: groupedEntities,
    events: eventsWithParticipants,
    topics: entryTopics.map(({ topic, link }) => ({
      ...topic,
      confidenceScore: link.confidenceScore,
    })),
    parseRun: latestParseRun,
    sentiment: entry.metadata as { mood?: string; energy?: number },
  };
}
