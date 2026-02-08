"use client";

import { format, formatDistanceToNow } from "date-fns";
import { useUnlinkEntry, type ThreadEntry } from "@/hooks/useThreads";

type ThreadTimelineProps = {
  threadId: string;
  entries: ThreadEntry[];
};

export function ThreadTimeline({ threadId, entries }: ThreadTimelineProps) {
  const unlinkEntry = useUnlinkEntry();

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-bg-secondary rounded-xl">
        <p className="text-sm text-text-secondary">no entries yet</p>
        <p className="mt-1 text-xs text-text-tertiary">
          link entries to this thread to build your story arc.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4">
        {entries.map((item, index) => (
          <div key={item.entry.id} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-bg-primary rounded-full border-2 border-accent/40 shrink-0">
              <span className="text-xs font-mono text-accent">
                {entries.length - index}
              </span>
            </div>

            {/* Entry card */}
            <div className="flex-1 bg-bg-secondary rounded-xl p-4 hover:bg-bg-tertiary transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <time className="text-xs font-mono text-text-secondary">
                    {format(new Date(item.entry.occurredAt), "EEEE, MMMM d, yyyy")}
                  </time>
                  <span className="text-xs text-text-tertiary">
                    {formatDistanceToNow(new Date(item.entry.occurredAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Link type badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      item.link.linkType === "manual"
                        ? "bg-bg-tertiary text-text-tertiary"
                        : item.link.linkType === "suggested"
                        ? "bg-accent/10 text-accent"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {item.link.linkType}
                  </span>

                  {/* Unlink button */}
                  <button
                    onClick={() =>
                      unlinkEntry.mutate({
                        threadId,
                        entryId: item.entry.id,
                      })
                    }
                    disabled={unlinkEntry.isPending}
                    className="text-text-tertiary hover:text-error transition-colors p-1"
                    title="Remove from thread"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content preview */}
              <p className="text-sm text-text-primary whitespace-pre-wrap line-clamp-4 leading-relaxed">
                {item.entry.content}
              </p>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 font-mono">
                  {item.entry.metadata &&
                    (item.entry.metadata as { mood?: string }).mood && (
                      <span className="text-xs text-text-tertiary">
                        mood:{" "}
                        {(item.entry.metadata as { mood: string }).mood}
                      </span>
                    )}
                  {item.link.confidenceScore && (
                    <span className="text-xs text-text-tertiary">
                      {(parseFloat(item.link.confidenceScore) * 100).toFixed(0)}%
                      match
                    </span>
                  )}
                </div>
                <a
                  href={`/entries/${item.entry.id}`}
                  className="text-xs text-accent hover:text-accent-hover"
                >
                  view full entry →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
