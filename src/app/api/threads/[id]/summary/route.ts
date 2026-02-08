import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { getThreadById } from "@/lib/db/queries/threads";
import { getOpenAIClient } from "@/lib/ai/openai-client";

/**
 * POST /api/threads/[id]/summary
 * Generate an AI summary for a thread from all linked entries
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
    const threadData = await getThreadById(id, user.id);

    if (!threadData) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (threadData.entries.length === 0) {
      return NextResponse.json(
        { error: "Thread has no entries to summarize" },
        { status: 400 }
      );
    }

    // Build the entries context for the AI
    const entriesContext = threadData.entries
      .map((le, i) => {
        const date = new Date(le.entry.occurredAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return `--- Entry ${i + 1} (${date}) ---\n${le.entry.content}`;
      })
      .join("\n\n");

    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a thoughtful journal analyst. The user has grouped several journal entries into a thread called "${threadData.thread.title}"${threadData.thread.description ? ` (described as: "${threadData.thread.description}")` : ""}. 

Your task is to generate a comprehensive summary that:
1. Identifies the overarching narrative or theme connecting these entries
2. Highlights key developments, turning points, and patterns
3. Notes important people, places, or events mentioned
4. Captures the emotional arc across entries
5. Provides a brief conclusion about where this story arc stands

Write in a warm, reflective tone. Keep the summary concise but insightful (200-400 words).
Format the summary with clear sections using markdown.`,
        },
        {
          role: "user",
          content: `Here are the ${threadData.entries.length} journal entries in this thread:\n\n${entriesContext}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const summary = response.choices[0]?.message?.content || "Unable to generate summary.";

    return NextResponse.json({
      summary,
      entryCount: threadData.entries.length,
      model: "gpt-4o",
    });
  } catch (error) {
    console.error("Error generating thread summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
