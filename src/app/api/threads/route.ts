import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { getUserThreads, createThread } from "@/lib/db/queries/threads";
import { z } from "zod";

const createThreadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
});

/**
 * GET /api/threads
 * Get all threads for the authenticated user
 */
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userThreads = await getUserThreads(user.id);

    return NextResponse.json({ threads: userThreads });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threads
 * Create a new thread
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createThreadSchema.parse(body);

    const thread = await createThread({
      userId: user.id,
      title: validatedData.title,
      description: validatedData.description,
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
