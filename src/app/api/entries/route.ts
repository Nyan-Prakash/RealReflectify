import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { createEntry, getUserEntriesWithParseStatus } from "@/lib/db/queries/entries";
import { processEntry } from "@/lib/ai/process-entry";
import { z } from "zod";

const createEntrySchema = z.object({
  content: z.string().min(1, "Content is required"),
});

/**
 * GET /api/entries
 * Get all entries for the authenticated user
 */
export async function GET() {
  try {
    console.log("[GET /api/entries] Starting request");
    const user = await getUser();
    console.log("[GET /api/entries] User:", user?.id);

    if (!user) {
      console.log("[GET /api/entries] No user found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[GET /api/entries] Fetching entries for user:", user.id);
    const userEntries = await getUserEntriesWithParseStatus(user.id);
    console.log("[GET /api/entries] Found entries:", userEntries?.length);

    return NextResponse.json({ entries: userEntries });
  } catch (error) {
    console.error("[GET /api/entries] Error:", error);
    console.error("[GET /api/entries] Stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entries
 * Create a new journal entry
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createEntrySchema.parse(body);

    console.log("[POST /api/entries] Creating entry for user:", user.id);
    const entry = await createEntry({
      userId: user.id,
      content: validatedData.content,
    });
    console.log("[POST /api/entries] Entry created:", entry.id);

    // Trigger AI extraction in the background (fire and forget)
    // In production, you'd use a job queue like Inngest or BullMQ
    console.log("[POST /api/entries] Triggering background AI extraction...");
    processEntry(entry.id, user.id).catch((error) => {
      console.error("[POST /api/entries] ❌ Background extraction failed:", error);
      if (error instanceof Error) {
        console.error("[POST /api/entries] Error message:", error.message);
        console.error("[POST /api/entries] Error stack:", error.stack);
      }
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}
