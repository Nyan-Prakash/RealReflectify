import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { mergePeople } from "@/lib/db/queries/people";
import { z } from "zod";

const mergeSchema = z.object({
  targetId: z.string().min(1, "Target person ID is required"),
});

/**
 * POST /api/people/[id]/merge
 * Merge this person (source) into another person (target)
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

    const { id: sourceId } = await params;
    const body = await request.json();
    const { targetId } = mergeSchema.parse(body);

    // Prevent merging person into themselves
    if (sourceId === targetId) {
      return NextResponse.json(
        { error: "Cannot merge a person into themselves" },
        { status: 400 }
      );
    }

    const result = await mergePeople(sourceId, targetId, user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully merged "${result.source}" into "${result.target}"`,
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error merging people:", error);
    return NextResponse.json(
      {
        error: "Failed to merge people",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
