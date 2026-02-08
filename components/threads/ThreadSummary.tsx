"use client";

import { useState } from "react";
import { useGenerateSummary } from "@/hooks/useThreads";

type ThreadSummaryProps = {
  threadId: string;
  entryCount: number;
};

export function ThreadSummary({ threadId, entryCount }: ThreadSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const generateSummary = useGenerateSummary();

  const handleGenerate = async () => {
    try {
      const result = await generateSummary.mutateAsync(threadId);
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    }
  };

  if (summary) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-text-primary font-mono">
            ai summary
          </h3>
          <button
            onClick={handleGenerate}
            disabled={generateSummary.isPending}
            className="text-xs text-accent hover:text-accent-hover"
          >
            {generateSummary.isPending ? "regenerating..." : "regenerate"}
          </button>
        </div>
        <div className="max-w-none">
          {summary.split("\n").map((paragraph, i) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h4 key={i} className="text-sm text-text-primary mt-4 mb-1">
                  {paragraph.replace("## ", "")}
                </h4>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h5 key={i} className="text-xs text-text-secondary mt-3 mb-1 font-mono">
                  {paragraph.replace("### ", "")}
                </h5>
              );
            }
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              return (
                <p key={i} className="text-sm text-text-primary mt-2">
                  {paragraph.replace(/\*\*/g, "")}
                </p>
              );
            }
            if (paragraph.startsWith("- ")) {
              return (
                <li key={i} className="ml-4 text-sm text-text-secondary">
                  {paragraph.replace("- ", "")}
                </li>
              );
            }
            if (paragraph.trim() === "") return null;
            return (
              <p key={i} className="text-sm text-text-secondary mt-1 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-xl p-6 text-center">
      <p className="text-sm text-text-secondary">
        generate ai summary
      </p>
      <p className="mt-1 text-xs text-text-tertiary">
        let ai analyze all {entryCount} {entryCount === 1 ? "entry" : "entries"}{" "}
        in this thread and generate a comprehensive summary.
      </p>
      <button
        onClick={handleGenerate}
        disabled={generateSummary.isPending || entryCount === 0}
        className="mt-4 px-4 py-2 text-sm text-bg-primary bg-accent rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {generateSummary.isPending ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
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
            generating summary...
          </span>
        ) : (
          "generate summary"
        )}
      </button>
      {generateSummary.isError && (
        <p className="mt-2 text-sm text-error">
          {generateSummary.error.message}
        </p>
      )}
    </div>
  );
}
