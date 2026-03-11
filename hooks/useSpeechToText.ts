"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type UseSpeechToTextOptions = {
  /** Called when a transcription result comes back */
  onTranscript?: (text: string) => void;
};

type SpeechToTextState = {
  isListening: boolean;
  isSupported: boolean;
  isTranscribing: boolean;
  error: string | null;
};

/**
 * Voice-to-text hook using MediaRecorder + OpenAI Whisper API.
 * Records audio from the microphone in chunks, sends each chunk
 * to /api/transcribe for server-side Whisper transcription.
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { onTranscript } = options;

  const [state, setState] = useState<SpeechToTextState>({
    isListening: false,
    isSupported: false,
    isTranscribing: false,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback ref current
  onTranscriptRef.current = onTranscript;

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";

    setState((prev) => ({ ...prev, isSupported: supported }));
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) return; // Skip tiny/empty recordings

    setState((prev) => ({ ...prev, isTranscribing: true }));

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Transcription failed");
      }

      const data = await response.json();
      const text = (data.text || "").trim();

      if (text) {
        onTranscriptRef.current?.(text);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Transcription failed",
      }));
    } finally {
      setState((prev) => ({ ...prev, isTranscribing: false }));
    }
  }, []);

  const startListening = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Determine a supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        chunksRef.current = [];
        transcribeAudio(audioBlob);
      };

      recorder.start();
      setState((prev) => ({ ...prev, isListening: true }));
    } catch (err) {
      let errorMessage = "Could not access microphone.";
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            errorMessage = "Microphone access denied. Please allow microphone permissions.";
            break;
          case "NotFoundError":
            errorMessage = "No microphone found. Please connect a microphone.";
            break;
          case "NotReadableError":
            errorMessage = "Microphone is in use by another app.";
            break;
        }
      }
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [transcribeAudio]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setState((prev) => ({ ...prev, isListening: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
  };
}
