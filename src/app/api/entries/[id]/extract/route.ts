import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { processEntry } from "@/lib/ai/process-entry";
import { getEntryById } from "@/lib/db/queries/entries";
import { getActiveParseRun } from "@/lib/db/queries/extraction";

/**
 * POST /api/entries/[id]/extract
 * Manually trigger AI extraction for an entry
 * Supports both retry (for failed entries) and re-extract (for completed entries)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { id } = await params;

    // Verify entry belongs to user
    const entry = await getEntryById(id, user.id);

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    // Check for active/in-progress extraction to prevent duplicates
    const activeParseRun = await getActiveParseRun(id, user.id);

    if (activeParseRun) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction already in progress",
          message: "Please wait for the current extraction to complete before retrying.",
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Determine if this is a retry or re-extract
    const isRetry = entry.parseStatus === "failed";
    const isReExtract = entry.parseStatus === "completed";

    console.log(`[Extract] Starting ${isRetry ? 'retry' : isReExtract ? 're-extraction' : 'extraction'} for entry ${id}`);

    // Trigger extraction
    const result = await processEntry(id, user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        extraction: result.extraction,
        message: isRetry
          ? "Entry successfully re-processed"
          : isReExtract
          ? "Entry re-extracted successfully"
          : "Extraction completed",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction failed",
          message: "The AI extraction process encountered an error. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[Extract] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
