"use client";

import { format } from "date-fns";
import {
  useThreadSuggestions,
  useLinkEntry,
  type SuggestedEntry,
} from "@/hooks/useThreads";

type SuggestedEntriesProps = {
  threadId: string;
};

function SuggestionCard({
  entry,
  threadId,
}: {
  entry: SuggestedEntry;
  threadId: string;
}) {
  const linkEntry = useLinkEntry();

  const handleAdd = () => {
    linkEntry.mutate({
      threadId,
      entryId: entry.id,
      linkType: "suggested",
    });
  };

  return (
    <div className="bg-bg-secondary rounded-xl p-4 hover:bg-bg-tertiary transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <time className="text-xs font-mono text-text-tertiary">
              {format(new Date(entry.occurredAt), "MMM d, yyyy")}
            </time>
            {entry.similarityScore > 0 && (
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-md font-mono">
                {(entry.similarityScore * 100).toFixed(0)}% match
              </span>
            )}
          </div>
          <p className="text-sm text-text-primary line-clamp-3 leading-relaxed">
            {entry.content}
          </p>
        </div>

        <button
          onClick={handleAdd}
          disabled={linkEntry.isPending}
          className="shrink-0 px-3 py-1.5 text-xs text-accent bg-accent/10 rounded-md hover:bg-accent/20 disabled:opacity-50 transition-colors"
        >
          {linkEntry.isPending ? "adding..." : "+ add"}
        </button>
      </div>
    </div>
  );
}

export function SuggestedEntries({ threadId }: SuggestedEntriesProps) {
  const { data: suggestions, isLoading, error } = useThreadSuggestions(threadId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-bg-secondary rounded-xl p-4 animate-pulse"
          >
            <div className="h-3 bg-bg-tertiary rounded w-1/4 mb-2" />
            <div className="h-3 bg-bg-tertiary rounded w-full mb-1" />
            <div className="h-3 bg-bg-tertiary rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-error bg-error/10 p-4 rounded-xl">
        failed to load suggestions. try again later.
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-8 bg-bg-secondary rounded-xl">
        <p className="text-sm text-text-secondary">no suggestions available yet</p>
        <p className="mt-1 text-xs text-text-tertiary">
          add more entries to the thread to improve ai suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((entry) => (
        <SuggestionCard key={entry.id} entry={entry} threadId={threadId} />
      ))}
    </div>
  );
}
