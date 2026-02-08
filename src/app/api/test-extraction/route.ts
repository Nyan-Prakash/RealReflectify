import { NextResponse } from "next/server";
import { extractFromEntry } from "@/lib/ai/extraction/extractor";

/**
 * POST /api/test-extraction
 * Test endpoint to verify AI extraction is working
 */
export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    console.log("[Test Extraction] Starting extraction...");
    const result = await extractFromEntry(content);
    console.log("[Test Extraction] Success!");

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[Test Extraction] Error:", error);
    return NextResponse.json(
      {
        error: "Extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
