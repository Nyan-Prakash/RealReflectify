"use client";

import { useEntries } from "@/hooks/useEntries";
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";

type StatusFilter = "all" | "completed" | "processing" | "pending" | "failed";
type SortOrder = "newest" | "oldest";

export function Timeline() {
  const { data: entries, isLoading, isError, refetch } = useEntries();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const handleRetry = async (entryId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setRetryingId(entryId);

    try {
      toast.loading("Retrying extraction...", { id: "retry" });

      const response = await fetch(`/api/entries/${entryId}/extract`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Extraction started!", {
          id: "retry",
          description: "The entry is being re-processed.",
        });
        refetch();
      } else if (response.status === 409) {
        toast.error("Already in progress", {
          id: "retry",
          description: result.message,
        });
      } else {
        toast.error("Failed to retry", {
          id: "retry",
          description: result.message || "Please try again.",
        });
      }
    } catch (error) {
      toast.error("Network error", { id: "retry" });
    } finally {
      setRetryingId(null);
    }
  };

  // Listen for extraction completion events
  useEffect(() => {
    const handleCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const completedEntries = customEvent.detail.entries;

      if (completedEntries.length === 1) {
        toast.success("AI extraction completed!", {
          description: "Your entry has been analyzed and entities extracted.",
        });
      } else {
        toast.success(`${completedEntries.length} entries completed!`, {
          description: "AI extraction finished for multiple entries.",
        });
      }
    };

    const handleFailed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const failedEntries = customEvent.detail.entries;

      if (failedEntries.length === 1) {
        toast.error("AI extraction failed", {
          description: "There was an error processing your entry. Please try again.",
        });
      } else {
        toast.error(`${failedEntries.length} entries failed`, {
          description: "Some entries couldn't be processed. Please try again.",
        });
      }
    };

    window.addEventListener("entries-completed", handleCompleted);
    window.addEventListener("entries-failed", handleFailed);

    return () => {
      window.removeEventListener("entries-completed", handleCompleted);
      window.removeEventListener("entries-failed", handleFailed);
    };
  }, []);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    if (!entries) return [];

    let result = [...entries];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((entry) =>
        entry.content.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((entry) => entry.parseStatus === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [entries, searchQuery, statusFilter, sortOrder]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: typeof filteredEntries }[] = [];
    const groupMap = new Map<string, typeof filteredEntries>();

    for (const entry of filteredEntries) {
      const date = new Date(entry.createdAt);
      let label: string;

      if (isToday(date)) {
        label = "today";
      } else if (isYesterday(date)) {
        label = "yesterday";
      } else if (isThisWeek(date)) {
        label = "this week";
      } else if (isThisMonth(date)) {
        label = "this month";
      } else {
        label = format(date, "MMMM yyyy").toLowerCase();
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, []);
      }
      groupMap.get(label)!.push(entry);
    }

    for (const [label, entries] of groupMap) {
      groups.push({ label, entries });
    }

    return groups;
  }, [filteredEntries]);

  // Stats
  const stats = useMemo(() => {
    if (!entries) return { total: 0, completed: 0, processing: 0, failed: 0 };
    return {
      total: entries.length,
      completed: entries.filter((e) => e.parseStatus === "completed").length,
      processing: entries.filter((e) => e.parseStatus === "processing" || e.parseStatus === "pending").length,
      failed: entries.filter((e) => e.parseStatus === "failed").length,
    };
  }, [entries]);

  const statusFilters: { key: StatusFilter; label: string; count?: number }[] = [
    { key: "all", label: "all", count: stats.total },
    { key: "completed", label: "extracted", count: stats.completed },
    { key: "processing", label: "in progress", count: stats.processing },
    { key: "failed", label: "failed", count: stats.failed },
  ];

  // Highlight matching text in content
  const highlightMatch = (content: string) => {
    if (!searchQuery.trim()) return content;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = content.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent/20 text-accent rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-5">
          <div className="h-10 bg-bg-secondary rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-secondary rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-bg-tertiary rounded w-24 mb-3" />
              <div className="h-3 bg-bg-tertiary rounded w-full mb-2" />
              <div className="h-3 bg-bg-tertiary rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-sm font-medium text-text-secondary mb-4">recent entries</h2>
        <div className="bg-bg-secondary rounded-xl p-8 text-center">
          <p className="text-sm text-error">failed to load entries. please try again.</p>
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium text-text-secondary mb-4">recent entries</h2>
        <div className="bg-bg-secondary rounded-xl p-12 text-center">
          <svg
            className="mx-auto h-8 w-8 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-3 text-sm text-text-secondary">no entries yet</p>
          <p className="mt-1 text-xs text-text-tertiary">
            start by writing your first journal entry above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-text-secondary">
          recent entries
          <span className="ml-2 text-text-tertiary font-mono text-xs">
            {filteredEntries.length}
            {filteredEntries.length !== entries.length && ` / ${entries.length}`}
          </span>
        </h2>
        <button
          onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors font-mono"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {sortOrder === "newest" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            )}
          </svg>
          {sortOrder === "newest" ? "newest first" : "oldest first"}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search entries..."
          className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary text-text-primary text-sm rounded-lg border-none placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 mb-5">
        {statusFilters
          .filter((f) => f.key === "all" || (f.count && f.count > 0))
          .map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1 text-xs rounded-md transition-colors font-mono ${
                statusFilter === filter.key
                  ? "bg-accent/15 text-accent"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {filter.label}
              {filter.count !== undefined && filter.count > 0 && (
                <span className={`ml-1.5 ${statusFilter === filter.key ? "text-accent/70" : "text-text-tertiary/60"}`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
      </div>

      {/* Results */}
      {filteredEntries.length === 0 ? (
        <div className="bg-bg-secondary rounded-xl p-10 text-center">
          <p className="text-sm text-text-secondary">no matching entries</p>
          <p className="mt-1 text-xs text-text-tertiary">
            {searchQuery
              ? `no entries match "${searchQuery}"`
              : "no entries with this status"}
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEntries.map((group) => (
            <div key={group.label}>
              {/* Date group label */}
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-xs font-mono text-text-tertiary">{group.label}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-mono text-text-tertiary/50">{group.entries.length}</span>
              </div>

              {/* Entries in this group */}
              <div className="space-y-1.5">
                {group.entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/entries/${entry.id}`}
                    className="block bg-bg-secondary rounded-xl p-4 hover:bg-bg-tertiary transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Time indicator */}
                      <div className="shrink-0 pt-0.5">
                        <time className="text-xs text-text-tertiary font-mono leading-none block">
                          {format(new Date(entry.createdAt), "h:mm a").toLowerCase()}
                        </time>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary line-clamp-2 leading-relaxed group-hover:text-text-primary/90">
                          {highlightMatch(entry.content)}
                        </p>

                        {/* Meta row */}
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-text-tertiary/70 font-mono">
                            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                          </span>
                          {entry.content.length > 200 && (
                            <span className="text-xs text-text-tertiary/50 font-mono">
                              {entry.content.split(/\s+/).length} words
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {entry.parseStatus && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5 ${
                              entry.parseStatus === "completed"
                                ? "text-success/80 bg-success/8"
                                : entry.parseStatus === "processing"
                                ? "text-warning bg-warning/10"
                                : entry.parseStatus === "failed"
                                ? "text-error/80 bg-error/8"
                                : "text-info/60 bg-info/8"
                            }`}
                          >
                            {entry.parseStatus === "processing" && (
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            )}
                            {entry.parseStatus === "completed"
                              ? "extracted"
                              : entry.parseStatus === "processing"
                              ? "extracting"
                              : entry.parseStatus === "failed"
                              ? "failed"
                              : "pending"}
                          </span>
                        )}
                        {entry.parseStatus === "failed" && (
                          <button
                            onClick={(e) => handleRetry(entry.id, e)}
                            disabled={retryingId === entry.id}
                            className="text-xs px-2 py-0.5 rounded-md text-error hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Retry extraction"
                          >
                            {retryingId === entry.id ? "..." : "retry"}
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
