import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { getAllPeople, searchPeople } from "@/lib/db/queries/people";

/**
 * GET /api/people
 * Get all people for the authenticated user
 * Supports optional search query parameter
 */
export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    let people;
    if (query) {
      people = await searchPeople(user.id, query);
    } else {
      people = await getAllPeople(user.id);
    }

    return NextResponse.json({ people });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}
