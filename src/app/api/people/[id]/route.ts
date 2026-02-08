import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { getPersonDetails } from "@/lib/db/queries/people";

/**
 * GET /api/people/[id]
 * Get details for a specific person
 */
export async function GET(
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

    const { id } = await params;
    const personData = await getPersonDetails(id, user.id);

    if (!personData) {
      return NextResponse.json(
        { error: "Person not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(personData);
  } catch (error) {
    console.error("Error fetching person:", error);
    return NextResponse.json(
      { error: "Failed to fetch person" },
      { status: 500 }
    );
  }
}
