import { z } from "zod";

/**
 * Schema for entity mentions (people, places, organizations, etc.)
 */
export const EntityMentionSchema = z.object({
  type: z.enum(["person", "place", "organization", "food", "activity"]),
  name: z.string().describe("The canonical name of this entity"),
  mentionText: z.string().describe("The exact text from the entry that mentions this entity"),
  startOffset: z.number().describe("Character offset where the mention starts"),
  endOffset: z.number().describe("Character offset where the mention ends"),
  confidence: z.number().min(0).max(1).describe("Confidence score (0-1) for this extraction"),
  context: z.string().nullable().describe("Additional context about this mention"),
});

export type EntityMention = z.infer<typeof EntityMentionSchema>;

/**
 * Schema for extracted events
 */
export const EventSchema = z.object({
  title: z.string().describe("Short title for this event (e.g., 'Lunch with Sarah')"),
  description: z.string().describe("Detailed description of what happened"),
  eventType: z.enum([
    "meeting",
    "meal",
    "activity",
    "conversation",
    "task",
    "accomplishment",
    "reflection",
    "other",
  ]).describe("Type of event"),
  startOffset: z.number().describe("Character offset where this event is mentioned"),
  endOffset: z.number().describe("Character offset where the event mention ends"),
  confidence: z.number().min(0).max(1).describe("Confidence score (0-1)"),
  occurredAt: z.string().nullable().describe("ISO 8601 timestamp if a specific time is mentioned"),
  participants: z.array(z.string()).nullable().describe("Names of people involved in this event"),
  location: z.string().nullable().describe("Location if mentioned"),
});

export type Event = z.infer<typeof EventSchema>;

/**
 * Schema for sentiment analysis
 */
export const SentimentSchema = z.object({
  overall: z.enum(["positive", "neutral", "negative"]).describe("Overall sentiment of the entry"),
  energy: z.number().min(0).max(10).describe("Energy level (0=low, 10=high)"),
  emotions: z.array(z.string()).nullable().describe("Detected emotions (joy, sadness, anxiety, etc.)"),
});

export type Sentiment = z.infer<typeof SentimentSchema>;

/**
 * Complete extraction result schema
 */
export const ExtractionResultSchema = z.object({
  entities: z.array(EntityMentionSchema).describe("All entity mentions found in the entry"),
  events: z.array(EventSchema).describe("All events described in the entry"),
  sentiment: SentimentSchema.describe("Sentiment analysis of the entry"),
  topics: z.array(z.string()).describe("Main topics/themes discussed"),
  summary: z.string().describe("One-sentence summary of the entry"),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
