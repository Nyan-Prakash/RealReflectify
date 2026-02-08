import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import {
  linkEntryToThread,
  unlinkEntryFromThread,
  getUnlinkedEntries,
} from "@/lib/db/queries/threads";
import { z } from "zod";

const linkEntrySchema = z.object({
  entryId: z.string().uuid("Invalid entry ID"),
  linkType: z.enum(["manual", "suggested", "auto"]).default("manual"),
});

const unlinkEntrySchema = z.object({
  entryId: z.string().uuid("Invalid entry ID"),
});

/**
 * GET /api/threads/[id]/links
 * Get unlinked entries for manual linking (with optional search)
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
    const query = searchParams.get("q") || undefined;

    const unlinkedEntries = await getUnlinkedEntries(id, user.id, query);

    return NextResponse.json({ entries: unlinkedEntries });
  } catch (error) {
    console.error("Error fetching unlinked entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threads/[id]/links
 * Link an entry to a thread
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = linkEntrySchema.parse(body);

    const link = await linkEntryToThread({
      userId: user.id,
      threadId: id,
      entryId: validatedData.entryId,
      linkType: validatedData.linkType,
    });

    if (!link) {
      return NextResponse.json(
        { error: "Entry is already linked to this thread" },
        { status: 409 }
      );
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error linking entry:", error);
    return NextResponse.json(
      { error: "Failed to link entry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/threads/[id]/links
 * Unlink an entry from a thread
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = unlinkEntrySchema.parse(body);

    const link = await unlinkEntryFromThread(id, validatedData.entryId, user.id);

    if (!link) {
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error unlinking entry:", error);
    return NextResponse.json(
      { error: "Failed to unlink entry" },
      { status: 500 }
    );
  }
}
