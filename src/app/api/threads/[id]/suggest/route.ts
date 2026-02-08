import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { suggestEntriesForThread } from "@/lib/db/queries/threads";

/**
 * GET /api/threads/[id]/suggest
 * Get AI-suggested entries for a thread based on embedding similarity
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const suggestions = await suggestEntriesForThread(id, user.id, limit);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error getting thread suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
