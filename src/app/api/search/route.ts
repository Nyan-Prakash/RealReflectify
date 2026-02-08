import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import {
  searchEntriesKeyword,
  searchEntriesSemantic,
  searchEntriesCombined,
  getUserEntitiesForFilter,
  type SearchFilters,
} from "@/lib/db/queries/search";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.enum(["keyword", "semantic", "combined"]).default("combined"),
  filters: z
    .object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      entityIds: z.array(z.string()).optional(),
      sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    })
    .optional(),
  limit: z.number().min(1).max(100).default(20),
});

/**
 * POST /api/search
 * Search entries using keyword, semantic, or combined search
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    // Parse date filters
    const filters: SearchFilters = {};
    if (validatedData.filters?.dateFrom) {
      filters.dateFrom = new Date(validatedData.filters.dateFrom);
    }
    if (validatedData.filters?.dateTo) {
      filters.dateTo = new Date(validatedData.filters.dateTo);
    }
    if (validatedData.filters?.entityIds) {
      filters.entityIds = validatedData.filters.entityIds;
    }
    if (validatedData.filters?.sentiment) {
      filters.sentiment = validatedData.filters.sentiment;
    }

    let results;

    switch (validatedData.type) {
      case "keyword":
        results = await searchEntriesKeyword(
          user.id,
          validatedData.query,
          filters,
          validatedData.limit
        );
        break;

      case "semantic":
        // Generate embedding for the search query
        const embedding = await generateEmbedding(validatedData.query);
        results = await searchEntriesSemantic(
          user.id,
          embedding,
          filters,
          validatedData.limit
        );
        break;

      case "combined":
        // Generate embedding for combined search
        const queryEmbedding = await generateEmbedding(validatedData.query);
        results = await searchEntriesCombined(
          user.id,
          validatedData.query,
          queryEmbedding,
          filters,
          validatedData.limit
        );
        break;
    }

    return NextResponse.json({
      results,
      count: results.length,
      query: validatedData.query,
      type: validatedData.type,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[POST /api/search] Error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/filters
 * Get filter options (entities) for search
 */
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entities = await getUserEntitiesForFilter(user.id);

    return NextResponse.json({ entities });
  } catch (error) {
    console.error("[GET /api/search/filters] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
