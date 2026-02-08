import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  decimal,
  boolean,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    settings: jsonb("settings").$type<{
      privacyMode?: boolean;
      autoParseEnabled?: boolean;
      confidenceThreshold?: number;
    }>().default({}),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

// ============================================================================
// ENTRIES (Raw journal entries - source of truth)
// ============================================================================

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    // Parse status tracking
    parseStatus: text("parse_status", {
      enum: ["pending", "processing", "completed", "failed"],
    }).default("pending").notNull(),
    lastParsedAt: timestamp("last_parsed_at"),

    // Full-text search (generated column handled in migration)
    // contentTsv: Generated tsvector column

    // Vector embedding for semantic search (handled in migration)
    // embedding: vector(1536) column

    metadata: jsonb("metadata").$type<{
      mood?: "positive" | "neutral" | "negative";
      energy?: number;
      location?: string;
      tags?: string[];
    }>().default({}),
  },
  (table) => ({
    userIdIdx: index("entries_user_id_idx").on(table.userId),
    occurredAtIdx: index("entries_occurred_at_idx").on(table.occurredAt),
    parseStatusIdx: index("entries_parse_status_idx").on(table.parseStatus),
    userOccurredIdx: index("entries_user_occurred_idx").on(table.userId, table.occurredAt),
  })
);

// ============================================================================
// PARSE RUNS (Audit trail of AI processing)
// ============================================================================

export const parseRuns = pgTable(
  "parse_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    status: text("status", {
      enum: ["started", "completed", "failed"],
    }).notNull(),

    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),

    model: text("model"), // e.g., "gpt-4o-2024-08-06"
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),

    errorMessage: text("error_message"),
    pipelineVersion: text("pipeline_version"), // e.g., "v1.0"
  },
  (table) => ({
    entryIdIdx: index("parse_runs_entry_id_idx").on(table.entryId),
  })
);

// ============================================================================
// EVENTS (Extracted happenings)
// ============================================================================

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    parseRunId: uuid("parse_run_id").references(() => parseRuns.id, {
      onDelete: "set null",
    }),

    eventType: text("event_type", {
      enum: ["meeting", "task", "deadline", "milestone", "appointment", "social", "work", "exercise", "meal", "travel", "other"],
    }).notNull(),

    title: text("title").notNull(),
    description: text("description"),

    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    isAllDay: boolean("is_all_day").default(false),

    // Provenance tracking
    extractedText: text("extracted_text"), // Original text span
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),

    isUserConfirmed: boolean("is_user_confirmed").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("events_user_id_idx").on(table.userId),
    entryIdIdx: index("events_entry_id_idx").on(table.entryId),
    startDateIdx: index("events_start_date_idx").on(table.startDate),
    userStartDateIdx: index("events_user_start_date_idx").on(table.userId, table.startDate),
  })
);

// ============================================================================
// ENTITIES (Canonical People, Places, Organizations, etc.)
// ============================================================================

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    entityType: text("entity_type", {
      enum: ["person", "place", "organization", "food", "activity", "thing"],
    }).notNull(),

    canonicalName: text("canonical_name").notNull(),
    aliases: text("aliases").array().default([]),

    // Flexible metadata for different entity types
    metadata: jsonb("metadata").$type<{
      // For people
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;

      // For places
      address?: string;
      coordinates?: { lat: number; lng: number };

      // For organizations
      industry?: string;
      website?: string;

      // General
      notes?: string;
      imageUrl?: string;
    }>().default({}),

    // Vector embedding (handled in migration)
    // embedding: vector(1536) column

    isArchived: boolean("is_archived").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userTypeIdx: index("entities_user_type_idx").on(table.userId, table.entityType),
    canonicalNameIdx: index("entities_canonical_name_idx").on(table.canonicalName),
    // Unique constraint on (user_id, entity_type, canonical_name)
    uniqueEntity: uniqueIndex("entities_unique_idx").on(
      table.userId,
      table.entityType,
      sql`LOWER(${table.canonicalName})`
    ),
  })
);

// ============================================================================
// MENTIONS (Links entities to text spans in entries)
// ============================================================================

export const mentions = pgTable(
  "mentions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    parseRunId: uuid("parse_run_id").references(() => parseRuns.id, {
      onDelete: "set null",
    }),

    mentionedAs: text("mentioned_as").notNull(), // How entity was referred to
    context: text("context"), // Surrounding text

    // Role in the event/entry
    role: text("role", {
      enum: ["subject", "participant", "object", "location", "food", "activity", "other"],
    }).default("participant"),

    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
    isUserConfirmed: boolean("is_user_confirmed").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("mentions_user_id_idx").on(table.userId),
    entryIdIdx: index("mentions_entry_id_idx").on(table.entryId),
    entityIdIdx: index("mentions_entity_id_idx").on(table.entityId),
    eventIdIdx: index("mentions_event_id_idx").on(table.eventId),
    // Unique constraint: one mention per entity per entry
    uniqueMention: uniqueIndex("mentions_unique_idx").on(table.entryId, table.entityId),
  })
);

// ============================================================================
// THREADS (Long-running story arcs)
// ============================================================================

export const threads = pgTable(
  "threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description"),

    status: text("status", {
      enum: ["active", "paused", "completed", "archived"],
    }).default("active").notNull(),

    // Vector embedding for similarity matching (handled in migration)
    // embedding: vector(1536) column

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("threads_user_id_idx").on(table.userId),
    statusIdx: index("threads_status_idx").on(table.status),
  })
);

// ============================================================================
// THREAD LINKS (Connects entries/events to threads)
// ============================================================================

export const threadLinks = pgTable(
  "thread_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    parseRunId: uuid("parse_run_id").references(() => parseRuns.id, {
      onDelete: "set null",
    }),

    linkType: text("link_type", {
      enum: ["manual", "suggested", "auto"],
    }).default("auto"),

    linkReason: jsonb("link_reason").$type<{
      keywords?: string[];
      similarityScore?: number;
      sharedEntities?: string[];
    }>(),

    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
    isUserConfirmed: boolean("is_user_confirmed").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    threadIdIdx: index("thread_links_thread_id_idx").on(table.threadId),
    entryIdIdx: index("thread_links_entry_id_idx").on(table.entryId),
    eventIdIdx: index("thread_links_event_id_idx").on(table.eventId),
    userThreadIdx: index("thread_links_user_thread_idx").on(table.userId, table.threadId),
    // Unique constraint: one link per thread-entry pair
    uniqueThreadEntry: uniqueIndex("thread_links_unique_entry_idx").on(
      table.threadId,
      table.entryId
    ),
  })
);

// ============================================================================
// RELATIONSHIP MOMENTS (Significant interactions between people)
// ============================================================================

export const relationshipMoments = pgTable(
  "relationship_moments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),

    // Primary person (usually the main subject)
    personEntityId: uuid("person_entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),

    // Other person involved (nullable for solo moments)
    otherPersonEntityId: uuid("other_person_entity_id").references(() => entities.id, {
      onDelete: "cascade",
    }),

    momentType: text("moment_type", {
      enum: ["conflict", "support", "celebration", "boundary", "milestone", "collaboration", "other"],
    }).notNull(),

    summary: text("summary").notNull(),
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
    isUserConfirmed: boolean("is_user_confirmed").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("relationship_moments_user_id_idx").on(table.userId),
    personEntityIdx: index("relationship_moments_person_entity_idx").on(table.personEntityId),
    otherPersonEntityIdx: index("relationship_moments_other_person_entity_idx").on(
      table.otherPersonEntityId
    ),
    entryIdIdx: index("relationship_moments_entry_id_idx").on(table.entryId),
  })
);

// ============================================================================
// TOPICS (Extracted themes)
// ============================================================================

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    label: text("label").notNull(),

    // Vector embedding (handled in migration)
    // embedding: vector(1536) column

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("topics_user_id_idx").on(table.userId),
    uniqueTopic: uniqueIndex("topics_unique_idx").on(table.userId, sql`LOWER(${table.label})`),
  })
);

// ============================================================================
// ENTRY TOPIC LINKS
// ============================================================================

export const entryTopicLinks = pgTable(
  "entry_topic_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    parseRunId: uuid("parse_run_id").references(() => parseRuns.id, {
      onDelete: "set null",
    }),

    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entryIdIdx: index("entry_topic_links_entry_id_idx").on(table.entryId),
    topicIdIdx: index("entry_topic_links_topic_id_idx").on(table.topicId),
    uniqueEntryTopic: uniqueIndex("entry_topic_links_unique_idx").on(
      table.entryId,
      table.topicId
    ),
  })
);

// ============================================================================
// ENTITY MERGES (User corrections when duplicates are merged)
// ============================================================================

export const entityMerges = pgTable(
  "entity_merges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    sourceEntityId: uuid("source_entity_id").notNull(), // Original (deleted)
    targetEntityId: uuid("target_entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),

    mergedAt: timestamp("merged_at").defaultNow().notNull(),
    mergedBy: uuid("merged_by").notNull().references(() => users.id), // user_id

    reason: text("reason"),
  },
  (table) => ({
    targetEntityIdx: index("entity_merges_target_idx").on(table.targetEntityId),
  })
);

// ============================================================================
// AUDIT LOGS (Track all significant user actions)
// ============================================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    action: text("action").notNull(), // e.g., "EXPORT_CREATED", "ENTITY_MERGED"
    entityType: text("entity_type").notNull(), // e.g., "entry", "entity", "thread"
    entityId: uuid("entity_id").notNull(),

    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),

    performedAt: timestamp("performed_at").defaultNow().notNull(),
    performedBy: uuid("performed_by").notNull().references(() => users.id), // user_id

    ipHash: text("ip_hash"), // For security auditing
    metadata: jsonb("metadata"),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    performedAtIdx: index("audit_logs_performed_at_idx").on(table.performedAt),
    entityTypeIdx: index("audit_logs_entity_type_idx").on(table.entityType, table.entityId),
  })
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

export type ParseRun = typeof parseRuns.$inferSelect;
export type NewParseRun = typeof parseRuns.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

export type Mention = typeof mentions.$inferSelect;
export type NewMention = typeof mentions.$inferInsert;

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;

export type ThreadLink = typeof threadLinks.$inferSelect;
export type NewThreadLink = typeof threadLinks.$inferInsert;

export type RelationshipMoment = typeof relationshipMoments.$inferSelect;
export type NewRelationshipMoment = typeof relationshipMoments.$inferInsert;

export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;

export type EntryTopicLink = typeof entryTopicLinks.$inferSelect;
export type NewEntryTopicLink = typeof entryTopicLinks.$inferInsert;

export type EntityMerge = typeof entityMerges.$inferSelect;
export type NewEntityMerge = typeof entityMerges.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
