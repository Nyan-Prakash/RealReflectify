"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useUnlinkedEntries, useLinkEntry } from "@/hooks/useThreads";

type LinkEntryDialogProps = {
  threadId: string;
  open: boolean;
  onClose: () => void;
};

export function LinkEntryDialog({
  threadId,
  open,
  onClose,
}: LinkEntryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: entries, isLoading } = useUnlinkedEntries(
    threadId,
    searchQuery || undefined
  );
  const linkEntry = useLinkEntry();

  const handleLink = async (entryId: string) => {
    try {
      await linkEntry.mutateAsync({
        threadId,
        entryId,
        linkType: "manual",
      });
    } catch (error) {
      console.error("Failed to link entry:", error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-bg-secondary rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg text-text-primary">
              link entry to thread
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">
              search and select entries to add to this thread.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg
              className="w-5 h-5"
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

        {/* Search */}
        <div className="px-6 pt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search entries..."
            className="block w-full px-4 py-2.5 bg-bg-tertiary text-text-primary border-none rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-bg-tertiary rounded-xl p-4 animate-pulse"
                >
                  <div className="h-3 bg-bg-hover rounded w-1/4 mb-2" />
                  <div className="h-3 bg-bg-hover rounded w-full mb-1" />
                  <div className="h-3 bg-bg-hover rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : !entries || entries.length === 0 ? (
            <div className="text-center py-8 text-sm text-text-tertiary">
              {searchQuery
                ? "no matching entries found."
                : "all entries are already linked to this thread."}
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-bg-tertiary rounded-xl p-4 hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <time className="text-xs font-mono text-text-tertiary">
                      {format(new Date(entry.occurredAt), "EEEE, MMM d, yyyy")}
                    </time>
                    <p className="mt-1 text-sm text-text-primary line-clamp-3 leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLink(entry.id)}
                    disabled={linkEntry.isPending}
                    className="shrink-0 px-3 py-1.5 text-xs text-bg-primary bg-accent rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
                  >
                    {linkEntry.isPending ? "linking..." : "link"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
          >
            done
          </button>
        </div>
      </div>
    </div>
  );
}
