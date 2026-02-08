"use client";

import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { HighlightedText } from "./HighlightedText";
import { EntityList } from "../entities/EntityList";
import { EventList } from "../events/EventList";
import { SentimentDisplay } from "../sentiment/SentimentDisplay";

type EntryDetailProps = {
  data: {
    entry: {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      parseStatus: string | null;
      metadata: any;
    };
    mentions: Array<{
      mention: any;
      entity: any;
    }>;
    entities: Record<string, Array<{ entity: any; mention: any }>>;
    events: Array<any>;
    topics: Array<any>;
    sentiment: { mood?: string; energy?: number };
    parseRun: any;
    parseHistory?: Array<{
      id: string;
      status: string;
      model: string | null;
      startedAt: Date;
      completedAt: Date | null;
      errorMessage: string | null;
      promptTokens: number | null;
      completionTokens: number | null;
    }>;
  };
};

export function EntryDetail({ data }: EntryDetailProps) {
  const { entry, mentions, entities, events, topics, sentiment, parseRun, parseHistory } = data;
  const [isExtracting, setIsExtracting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleExtraction = async (type: "retry" | "re-extract") => {
    setIsExtracting(true);
    const actionText = type === "retry" ? "Retrying" : "Re-extracting";

    try {
      toast.loading(`${actionText} entry...`, { id: "extraction" });

      const response = await fetch(`/api/entries/${entry.id}/extract`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || "Extraction completed!", {
          id: "extraction",
          description: "Refreshing page to show updated data...",
        });

        // Refresh the page to show updated extraction results
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (response.status === 409) {
        toast.error("Extraction already in progress", {
          id: "extraction",
          description: result.message,
        });
        setIsExtracting(false);
      } else {
        toast.error("Extraction failed", {
          id: "extraction",
          description: result.message || "Please try again.",
        });
        setIsExtracting(false);
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Network error", {
        id: "extraction",
        description: "Failed to communicate with the server. Please try again.",
      });
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-bg-secondary rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <time className="text-xs text-text-tertiary font-mono">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </time>
          </div>
          <div className="flex items-center gap-3">
            {entry.parseStatus && (
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                  entry.parseStatus === "completed"
                    ? "text-success bg-success/10"
                    : entry.parseStatus === "processing"
                    ? "text-warning bg-warning/10"
                    : entry.parseStatus === "failed"
                    ? "text-error bg-error/10"
                    : "text-info bg-info/10"
                }`}
              >
                {entry.parseStatus === "completed"
                  ? "extracted"
                  : entry.parseStatus === "processing"
                  ? "processing"
                  : entry.parseStatus === "failed"
                  ? "failed"
                  : "pending"}
              </span>
            )}
            {entry.parseStatus === "completed" && (
              <button
                onClick={() => handleExtraction("re-extract")}
                disabled={isExtracting}
                className="text-xs px-2.5 py-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Re-run AI extraction"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isExtracting ? "re-extracting..." : "re-extract"}
              </button>
            )}
          </div>
        </div>

        <div className="text-sm text-text-primary leading-relaxed">
          <HighlightedText content={entry.content} mentions={mentions} />
        </div>
      </div>

      {/* Only show extracted data if parsing is complete */}
      {entry.parseStatus === "completed" && (
        <>
          {/* Sentiment Analysis */}
          {sentiment && (sentiment.mood || sentiment.energy !== undefined) && (
            <SentimentDisplay sentiment={sentiment} />
          )}

          {/* Entities */}
          {Object.keys(entities).length > 0 && (
            <div className="bg-bg-secondary rounded-xl p-5">
              <h2 className="text-sm font-medium text-text-secondary mb-4">
                extracted entities
              </h2>
              <EntityList entities={entities} />
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div className="bg-bg-secondary rounded-xl p-5">
              <h2 className="text-sm font-medium text-text-secondary mb-4">
                extracted events
              </h2>
              <EventList events={events} />
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="bg-bg-secondary rounded-xl p-5">
              <h2 className="text-sm font-medium text-text-secondary mb-3">topics</h2>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span
                    key={topic.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-accent-muted text-accent"
                  >
                    {topic.label}
                    {topic.confidenceScore && (
                      <span className="ml-1.5 text-accent/60 font-mono">
                        {(Number(topic.confidenceScore) * 100).toFixed(0)}%
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Parse Metadata */}
          {parseRun && (
            <div className="bg-bg-secondary rounded-xl p-4 text-xs text-text-tertiary font-mono">
              <div className="flex items-center justify-between">
                <div>
                  {parseRun.model || "gpt-4o"} · {parseRun.promptTokens || 0} prompt · {parseRun.completionTokens || 0} completion
                </div>
                {parseRun.completedAt && (
                  <div>
                    {formatDistanceToNow(new Date(parseRun.completedAt), {
                      addSuffix: true,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Processing State */}
      {entry.parseStatus === "processing" && (
        <div className="bg-warning/10 rounded-xl p-6 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-warning border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-warning font-medium">analyzing your entry...</p>
          <p className="text-xs text-text-tertiary mt-1">
            this usually takes 5-10 seconds
          </p>
        </div>
      )}

      {/* Failed State */}
      {entry.parseStatus === "failed" && (
        <div className="bg-error/10 rounded-xl p-6 text-center">
          <p className="text-sm text-error font-medium">extraction failed</p>
          <p className="text-xs text-text-tertiary mt-1">
            there was an error processing this entry.
          </p>
          <button
            onClick={() => handleExtraction("retry")}
            disabled={isExtracting}
            className="mt-4 px-4 py-1.5 text-xs font-medium text-bg-primary bg-error hover:bg-error/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? "retrying..." : "retry extraction"}
          </button>
        </div>
      )}

      {/* Extraction History */}
      {parseHistory && parseHistory.length > 1 && (
        <div className="bg-bg-secondary rounded-xl p-5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-xs font-medium text-text-secondary">
              extraction history ({parseHistory.length} runs)
            </h2>
            <svg
              className={`w-4 h-4 text-text-tertiary transition-transform ${
                showHistory ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-2">
              {parseHistory.map((run, index) => (
                <div
                  key={run.id}
                  className={`p-3 rounded-lg text-xs font-mono ${
                    index === 0
                      ? "bg-accent-muted"
                      : "bg-bg-tertiary"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          run.status === "completed"
                            ? "text-success bg-success/10"
                            : run.status === "failed"
                            ? "text-error bg-error/10"
                            : "text-warning bg-warning/10"
                        }`}
                      >
                        {run.status}
                      </span>
                      {index === 0 && (
                        <span className="text-accent">
                          latest
                        </span>
                      )}
                    </div>
                    <span className="text-text-tertiary">
                      {formatDistanceToNow(new Date(run.startedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-text-tertiary">
                    <span>{run.model || "gpt-4o"}</span>
                    {run.promptTokens && run.completionTokens && (
                      <span>
                        {run.promptTokens + run.completionTokens} tokens
                      </span>
                    )}
                    {run.completedAt && (
                      <span>
                        {Math.round(
                          (new Date(run.completedAt).getTime() -
                            new Date(run.startedAt).getTime()) /
                            1000
                        )}s
                      </span>
                    )}
                  </div>

                  {run.errorMessage && (
                    <div className="mt-2 text-error bg-error/10 p-2 rounded">
                      {run.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
