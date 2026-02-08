"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type SearchResult = {
  id: string;
  content: string;
  occurredAt: Date;
  createdAt: Date;
  parseStatus: string | null;
  metadata: any;
  relevanceScore: number;
  searchType: "keyword" | "semantic" | "combined";
  highlights?: string[];
};

type SearchResultsProps = {
  results: SearchResult[];
  count: number;
  query: string;
  isLoading: boolean;
  isError: boolean;
  searchType: string;
};

export function SearchResults({
  results,
  count,
  query,
  isLoading,
  isError,
  searchType,
}: SearchResultsProps) {
  // Highlight search terms in text
  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;

    const words = query.trim().split(/\s+/);
    let highlightedText = text;

    words.forEach((word) => {
      const regex = new RegExp(`(${word})`, "gi");
      highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
    });

    return highlightedText;
  };

  // Truncate content with highlights
  const getTruncatedContent = (content: string, maxLength: number = 300): string => {
    if (content.length <= maxLength) return content;

    // Try to break at a sentence or word boundary
    const truncated = content.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf(".");
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastPeriod > maxLength * 0.7) {
      return truncated.substring(0, lastPeriod + 1);
    } else if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
  };

  if (isLoading) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-bg-tertiary rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-bg-tertiary rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-error/10 rounded-xl p-6">
        <p className="text-sm text-error">failed to load search results</p>
      </div>
    );
  }

  if (!query) {
    return (
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
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <p className="mt-3 text-sm text-text-secondary">start searching</p>
        <p className="mt-1 text-xs text-text-tertiary">
          enter a query to find entries in your journal
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl p-12 text-center">
        <p className="text-sm text-text-secondary">no results found</p>
        <p className="mt-1 text-xs text-text-tertiary">
          try adjusting your search query or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-tertiary font-mono">
          <span className="text-text-secondary">{count}</span> result{count !== 1 ? "s" : ""} for{" "}
          <span className="text-accent">&quot;{query}&quot;</span>
        </p>
        <span className="text-xs text-text-tertiary font-mono">
          {searchType}
        </span>
      </div>

      {/* Results List */}
      <div className="space-y-2">
        {results.map((result) => {
          const truncatedContent = getTruncatedContent(result.content);
          const highlightedContent = highlightText(truncatedContent, query);

          return (
            <Link
              key={result.id}
              href={`/entries/${result.id}`}
              className="block bg-bg-secondary rounded-xl p-5 hover:bg-bg-tertiary transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary font-mono">
                    {formatDistanceToNow(new Date(result.occurredAt), { addSuffix: true })}
                  </span>
                  {result.metadata?.mood && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs ${
                        result.metadata.mood === "positive"
                          ? "text-success bg-success/10"
                          : result.metadata.mood === "negative"
                          ? "text-error bg-error/10"
                          : "text-text-secondary bg-bg-tertiary"
                      }`}
                    >
                      {result.metadata.mood}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-tertiary font-mono">
                  {(result.relevanceScore * 100).toFixed(0)}%
                </span>
              </div>

              <div
                className="text-sm text-text-primary leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />

              <div className="mt-3 text-xs text-text-tertiary font-mono">
                {new Date(result.occurredAt).toLocaleDateString()}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
