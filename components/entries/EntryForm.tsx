"use client";

import { useState, useRef, useEffect } from "react";
import { useCreateEntry } from "@/hooks/useCreateEntry";
import { useSpeechToText } from "@/hooks/useSpeechToText";

export function EntryForm() {
  const [content, setContent] = useState("");
  const createEntry = useCreateEntry();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const speech = useSpeechToText({
    onTranscript: (text) => {
      setContent((prev) => {
        const separator =
          prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n")
            ? " "
            : "";
        return prev + separator + text;
      });
    },
  });

  // Auto-scroll textarea to bottom when content is added via voice
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    // Stop listening if active
    if (speech.isListening) {
      speech.stopListening();
    }

    try {
      await createEntry.mutateAsync({ content });
      setContent("");
    } catch (error) {
      console.error("Failed to create entry:", error);
    }
  };

  const toggleVoice = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  };

  return (
    <div
      className={`bg-bg-secondary rounded-xl p-5 transition-all ${
        speech.isListening ? "ring-2 ring-accent/30" : ""
      }`}
    >
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={createEntry.isPending}
            className="w-full h-36 bg-transparent text-text-primary placeholder-text-tertiary text-sm leading-relaxed resize-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            placeholder={
              speech.isListening
                ? "recording... speak now"
                : "what's on your mind? write freely about your day, thoughts, or anything you want to remember..."
            }
          />

          {/* Listening / transcribing indicator */}
          {(speech.isListening || speech.isTranscribing) && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {speech.isListening && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs font-mono text-error/80">rec</span>
                </>
              )}
              {speech.isTranscribing && !speech.isListening && (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-xs font-mono text-accent/80">
                    transcribing
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-between items-center border-t border-border pt-3">
          <div className="flex items-center gap-3">
            {/* Voice button */}
            {speech.isSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={createEntry.isPending || speech.isTranscribing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  speech.isListening
                    ? "bg-error/15 text-error hover:bg-error/25"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                }`}
                title={speech.isListening ? "Stop recording" : "Start voice input"}
              >
                {speech.isListening ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                    stop
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 10v2a7 7 0 01-14 0v-2"
                      />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    voice
                  </>
                )}
              </button>
            )}

            <p className="text-xs text-text-tertiary">
              {createEntry.isPending
                ? "saving..."
                : speech.isTranscribing
                ? "transcribing your recording..."
                : speech.isListening
                ? "recording — click stop when done"
                : speech.error
                ? speech.error
                : "AI will extract events, people, and insights"}
            </p>
          </div>

          <button
            type="submit"
            disabled={createEntry.isPending || !content.trim()}
            className="px-5 py-1.5 text-sm font-medium text-bg-primary bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-accent"
          >
            {createEntry.isPending ? "saving..." : "save"}
          </button>
        </div>
        {createEntry.isError && (
          <p className="mt-2 text-xs text-error">
            failed to save entry. please try again.
          </p>
        )}
      </form>
    </div>
  );
}
