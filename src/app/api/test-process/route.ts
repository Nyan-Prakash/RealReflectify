import { NextResponse } from "next/server";
import { processEntry } from "@/lib/ai/process-entry";
import { getUser } from "@/lib/auth/supabase-server";
import { createEntry } from "@/lib/db/queries/entries";

/**
 * POST /api/test-process
 * Test endpoint to diagnose extraction issues
 */
export async function POST() {
  try {
    console.log("[Test Process] Starting test...");

    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("[Test Process] User authenticated:", user.id);

    // Create a test entry
    const testContent = "Had lunch with Alice at the new Italian place downtown. The carbonara was excellent!";
    console.log("[Test Process] Creating test entry...");

    const entry = await createEntry({
      userId: user.id,
      content: testContent,
    });

    console.log("[Test Process] Entry created:", entry.id);

    // Process it
    console.log("[Test Process] Starting AI extraction...");
    const result = await processEntry(entry.id, user.id);

    console.log("[Test Process] Result:", result.success ? "SUCCESS" : "FAILED");

    return NextResponse.json({
      success: result.success,
      entryId: entry.id,
      extraction: result.success ? result.extraction : null,
      error: result.success ? null : (result.error instanceof Error ? result.error.message : String(result.error)),
    });
  } catch (error) {
    console.error("[Test Process] Caught error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
