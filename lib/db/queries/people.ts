import { db } from "@/lib/db/client";
import { entities, mentions, entries, entityMerges } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";

/**
 * Get all people entities for a user
 */
export async function getAllPeople(userId: string) {
  const people = await db
    .select({
      id: entities.id,
      canonicalName: entities.canonicalName,
      createdAt: entities.createdAt,
      metadata: entities.metadata,
      // Count mentions for this person
      mentionCount: sql<number>`count(distinct ${mentions.id})::int`,
      // Get first and last mention dates
      firstMention: sql<Date>`min(${entries.occurredAt})`,
      lastMention: sql<Date>`max(${entries.occurredAt})`,
    })
    .from(entities)
    .leftJoin(mentions, eq(mentions.entityId, entities.id))
    .leftJoin(entries, eq(entries.id, mentions.entryId))
    .where(
      and(
        eq(entities.userId, userId),
        eq(entities.entityType, "person"),
        eq(entities.isArchived, false) // Don't show archived (merged) entities
      )
    )
    .groupBy(entities.id)
    .orderBy(desc(sql`max(${entries.occurredAt})`));

  return people;
}

/**
 * Get detailed information about a specific person
 */
export async function getPersonDetails(personId: string, userId: string) {
  // Get the person entity
  const [person] = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.id, personId),
        eq(entities.userId, userId),
        eq(entities.entityType, "person")
      )
    );

  if (!person) {
    return null;
  }

  // Get all mentions of this person with their entries
  const personMentions = await db
    .select({
      mention: mentions,
      entry: entries,
    })
    .from(mentions)
    .innerJoin(entries, eq(mentions.entryId, entries.id))
    .where(
      and(
        eq(mentions.entityId, personId),
        eq(mentions.userId, userId)
      )
    )
    .orderBy(desc(entries.occurredAt));

  // Get statistics
  const stats = {
    totalMentions: personMentions.length,
    firstMention: personMentions[personMentions.length - 1]?.entry.occurredAt,
    lastMention: personMentions[0]?.entry.occurredAt,
    uniqueEntries: new Set(personMentions.map(m => m.entry.id)).size,
  };

  return {
    person,
    mentions: personMentions,
    stats,
  };
}

/**
 * Search people by name
 */
export async function searchPeople(userId: string, query: string) {
  const lowerQuery = `%${query.toLowerCase()}%`;

  const people = await db
    .select({
      id: entities.id,
      canonicalName: entities.canonicalName,
      createdAt: entities.createdAt,
      mentionCount: sql<number>`count(distinct ${mentions.id})::int`,
    })
    .from(entities)
    .leftJoin(mentions, eq(mentions.entityId, entities.id))
    .where(
      and(
        eq(entities.userId, userId),
        eq(entities.entityType, "person"),
        eq(entities.isArchived, false),
        sql`lower(${entities.canonicalName}) like ${lowerQuery}`
      )
    )
    .groupBy(entities.id)
    .orderBy(desc(sql`count(distinct ${mentions.id})`));

  return people;
}

/**
 * Merge two people entities
 * All mentions of the source person will be updated to point to the target person
 */
export async function mergePeople(
  sourceId: string,
  targetId: string,
  userId: string
) {
  // Verify both entities exist and belong to user
  const [source, target] = await Promise.all([
    db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, sourceId),
          eq(entities.userId, userId),
          eq(entities.entityType, "person")
        )
      )
      .then(rows => rows[0]),
    db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, targetId),
          eq(entities.userId, userId),
          eq(entities.entityType, "person")
        )
      )
      .then(rows => rows[0]),
  ]);

  if (!source || !target) {
    throw new Error("Source or target person not found");
  }

  // Update all mentions to point to target
  await db
    .update(mentions)
    .set({ entityId: targetId })
    .where(
      and(
        eq(mentions.entityId, sourceId),
        eq(mentions.userId, userId)
      )
    );

  // Archive the source entity (mark as merged)
  await db
    .update(entities)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(eq(entities.id, sourceId));

  // Record the merge in entity_merges table
  await db.insert(entityMerges).values({
    userId,
    sourceEntityId: sourceId,
    targetEntityId: targetId,
    mergedAt: new Date(),
    mergedBy: userId,
  });

  return {
    success: true,
    source: source.canonicalName,
    target: target.canonicalName,
  };
}

/**
 * Get potential duplicate people based on name similarity
 * Simple version: exact match ignoring case and basic fuzzy matching
 */
export async function getPotentialDuplicates(userId: string) {
  // Get all people
  const people = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.userId, userId),
        eq(entities.entityType, "person"),
        eq(entities.isArchived, false)
      )
    );

  const duplicates: Array<{
    person1: typeof entities.$inferSelect;
    person2: typeof entities.$inferSelect;
    similarity: number;
  }> = [];

  // Simple fuzzy matching - compare each person with every other person
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const name1 = people[i].canonicalName.toLowerCase();
      const name2 = people[j].canonicalName.toLowerCase();

      // Check if one name contains the other (e.g., "Sarah" and "Sarah Johnson")
      if (name1.includes(name2) || name2.includes(name1)) {
        duplicates.push({
          person1: people[i],
          person2: people[j],
          similarity: 0.9,
        });
      }
      // Check if names are very similar (simple Levenshtein-like check)
      else if (calculateSimilarity(name1, name2) > 0.8) {
        duplicates.push({
          person1: people[i],
          person2: people[j],
          similarity: calculateSimilarity(name1, name2),
        });
      }
    }
  }

  return duplicates;
}

/**
 * Simple string similarity calculation (Dice coefficient)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);

  const intersection = bigrams1.filter(b => bigrams2.includes(b)).length;
  const union = bigrams1.length + bigrams2.length;

  return union === 0 ? 0 : (2 * intersection) / union;
}

/**
 * Get bigrams (pairs of adjacent characters) from a string
 */
function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}
