import { db } from "@/lib/db/client";
import { entries, entities, mentions, events } from "@/lib/db/schema";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";

export type SearchResult = {
  id: string;
  content: string;
  occurredAt: Date;
  createdAt: Date;
  parseStatus: string | null;
  metadata: any;
  relevanceScore: number;
  searchType: "keyword" | "semantic" | "combined";
  highlights?: string[];
};

export type SearchFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  entityIds?: string[];
  sentiment?: "positive" | "neutral" | "negative";
};

/**
 * Keyword search using PostgreSQL full-text search
 */
export async function searchEntriesKeyword(
  userId: string,
  query: string,
  filters?: SearchFilters,
  limit: number = 20
): Promise<SearchResult[]> {
  // Build the WHERE conditions
  const conditions = [eq(entries.userId, userId)];

  // Add date filters
  if (filters?.dateFrom) {
    conditions.push(gte(entries.occurredAt, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(lte(entries.occurredAt, filters.dateTo));
  }

  // Add sentiment filter
  if (filters?.sentiment) {
    conditions.push(
      sql`${entries.metadata}->>'mood' = ${filters.sentiment}`
    );
  }

  // Perform full-text search with ranking
  const results = await db
    .select({
      id: entries.id,
      content: entries.content,
      occurredAt: entries.occurredAt,
      createdAt: entries.createdAt,
      parseStatus: entries.parseStatus,
      metadata: entries.metadata,
      // ts_rank gives us a relevance score
      rank: sql<number>`ts_rank(content_tsv, plainto_tsquery('english', ${query}))`,
    })
    .from(entries)
    .where(
      and(
        ...conditions,
        // Match against the tsvector column
        sql`content_tsv @@ plainto_tsquery('english', ${query})`
      )
    )
    .orderBy(desc(sql`ts_rank(content_tsv, plainto_tsquery('english', ${query}))`))
    .limit(limit);

  // Filter by entities if specified
  let filteredResults = results;
  if (filters?.entityIds && filters.entityIds.length > 0) {
    const entryIdsWithEntities = await db
      .selectDistinct({ entryId: mentions.entryId })
      .from(mentions)
      .where(
        and(
          eq(mentions.userId, userId),
          sql`${mentions.entityId} = ANY(${filters.entityIds})`
        )
      );

    const entryIdsSet = new Set(entryIdsWithEntities.map((e) => e.entryId));
    filteredResults = results.filter((r) => entryIdsSet.has(r.id));
  }

  return filteredResults.map((result) => ({
    id: result.id,
    content: result.content,
    occurredAt: result.occurredAt,
    createdAt: result.createdAt,
    parseStatus: result.parseStatus,
    metadata: result.metadata,
    relevanceScore: result.rank,
    searchType: "keyword" as const,
  }));
}

/**
 * Semantic search using pgvector similarity
 */
export async function searchEntriesSemantic(
  userId: string,
  queryEmbedding: number[],
  filters?: SearchFilters,
  limit: number = 20,
  similarityThreshold: number = 0.2
): Promise<SearchResult[]> {
  // Build the WHERE conditions
  const conditions = [
    eq(entries.userId, userId),
    sql`embedding IS NOT NULL`,
  ];

  // Add date filters
  if (filters?.dateFrom) {
    conditions.push(gte(entries.occurredAt, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(lte(entries.occurredAt, filters.dateTo));
  }

  // Add sentiment filter
  if (filters?.sentiment) {
    conditions.push(
      sql`${entries.metadata}->>'mood' = ${filters.sentiment}`
    );
  }

  // Convert embedding array to pgvector format
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Perform vector similarity search
  const results = await db
    .select({
      id: entries.id,
      content: entries.content,
      occurredAt: entries.occurredAt,
      createdAt: entries.createdAt,
      parseStatus: entries.parseStatus,
      metadata: entries.metadata,
      // Cosine similarity: 1 - cosine_distance
      similarity: sql<number>`1 - (embedding <=> ${embeddingStr}::vector)`,
    })
    .from(entries)
    .where(
      and(
        ...conditions,
        // Filter by similarity threshold
        sql`1 - (embedding <=> ${embeddingStr}::vector) > ${similarityThreshold}`
      )
    )
    .orderBy(sql`embedding <=> ${embeddingStr}::vector`)
    .limit(limit);

  // Filter by entities if specified
  let filteredResults = results;
  if (filters?.entityIds && filters.entityIds.length > 0) {
    const entryIdsWithEntities = await db
      .selectDistinct({ entryId: mentions.entryId })
      .from(mentions)
      .where(
        and(
          eq(mentions.userId, userId),
          sql`${mentions.entityId} = ANY(${filters.entityIds})`
        )
      );

    const entryIdsSet = new Set(entryIdsWithEntities.map((e) => e.entryId));
    filteredResults = results.filter((r) => entryIdsSet.has(r.id));
  }

  return filteredResults.map((result) => ({
    id: result.id,
    content: result.content,
    occurredAt: result.occurredAt,
    createdAt: result.createdAt,
    parseStatus: result.parseStatus,
    metadata: result.metadata,
    relevanceScore: result.similarity,
    searchType: "semantic" as const,
  }));
}

/**
 * Combined search: merge keyword and semantic results with weighted scoring
 */
export async function searchEntriesCombined(
  userId: string,
  query: string,
  queryEmbedding: number[],
  filters?: SearchFilters,
  limit: number = 20
): Promise<SearchResult[]> {
  // Get both keyword and semantic results
  const [keywordResults, semanticResults] = await Promise.all([
    searchEntriesKeyword(userId, query, filters, limit),
    searchEntriesSemantic(userId, queryEmbedding, filters, limit),
  ]);

  // Merge results using a Map to deduplicate
  const resultMap = new Map<string, SearchResult>();

  // Weight: 60% keyword, 40% semantic
  const keywordWeight = 0.6;
  const semanticWeight = 0.4;

  // Add keyword results
  for (const result of keywordResults) {
    resultMap.set(result.id, {
      ...result,
      relevanceScore: result.relevanceScore * keywordWeight,
      searchType: "combined" as const,
    });
  }

  // Add or merge semantic results
  for (const result of semanticResults) {
    const existing = resultMap.get(result.id);
    if (existing) {
      // Entry found by both methods - boost its score
      existing.relevanceScore += result.relevanceScore * semanticWeight;
    } else {
      resultMap.set(result.id, {
        ...result,
        relevanceScore: result.relevanceScore * semanticWeight,
        searchType: "combined" as const,
      });
    }
  }

  // Convert to array and sort by combined relevance score
  const combinedResults = Array.from(resultMap.values()).sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  return combinedResults.slice(0, limit);
}

/**
 * Get all entities for a user (for filter dropdown)
 */
export async function getUserEntitiesForFilter(userId: string) {
  return await db
    .select({
      id: entities.id,
      name: entities.canonicalName,
      type: entities.entityType,
    })
    .from(entities)
    .where(and(eq(entities.userId, userId), eq(entities.isArchived, false)))
    .orderBy(entities.canonicalName);
}

/**
 * Update entry embedding
 */
export async function updateEntryEmbedding(
  entryId: string,
  embedding: number[]
) {
  const embeddingStr = `[${embedding.join(",")}]`;

  // Use raw SQL since embedding column is not in the Drizzle schema
  await db.execute(
    sql`UPDATE entries SET embedding = ${embeddingStr}::vector, updated_at = NOW() WHERE id = ${entryId}`
  );
}

/**
 * Get entries without embeddings
 */
export async function getEntriesWithoutEmbeddings(userId: string, limit: number = 100) {
  return await db
    .select({
      id: entries.id,
      content: entries.content,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        sql`embedding IS NULL`
      )
    )
    .limit(limit);
}
