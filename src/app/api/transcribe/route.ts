import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/supabase-server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

/**
 * POST /api/transcribe
 * Transcribe audio using OpenAI Whisper
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB — Whisper limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large (max 25MB)" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    // Normalize the response to a plain string `text`.
    let text = "";
    if (typeof transcription === "string") {
      text = transcription;
    } else if (transcription && typeof (transcription as any).text === "string") {
      text = (transcription as any).text;
    } else if (transcription && typeof (transcription as any).data === "string") {
      text = (transcription as any).data;
    } else {
      // Fallback: try to stringify
      text = JSON.stringify(transcription || "");
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("[POST /api/transcribe] Error:", error);
    // Provide more diagnostic details in server logs but a safe message to the client
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
