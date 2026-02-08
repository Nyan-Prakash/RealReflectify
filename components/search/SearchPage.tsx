"use client";

import { useState, useEffect } from "react";
import { useSearch, useSearchFilters, useGenerateEmbeddings } from "@/hooks/useSearch";
import { SearchBar } from "./SearchBar";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { toast } from "sonner";

export function SearchPage() {
  const { search, clearSearch, results, count, isLoading, isError } = useSearch();
  const { entities, isLoading: filtersLoading } = useSearchFilters();
  const generateEmbeddings = useGenerateEmbeddings();

  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"keyword" | "semantic" | "combined">("combined");
  const [filters, setFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    entityIds?: string[];
    sentiment?: "positive" | "neutral" | "negative";
  }>({});

  const handleSearch = (newQuery: string) => {
    if (!newQuery.trim()) {
      clearSearch();
      return;
    }

    setQuery(newQuery);
    search({
      query: newQuery,
      type: searchType,
      filters,
      limit: 20,
    });
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);

    // Re-run search if there's a query
    if (query.trim()) {
      search({
        query,
        type: searchType,
        filters: newFilters,
        limit: 20,
      });
    }
  };

  const handleSearchTypeChange = (type: typeof searchType) => {
    setSearchType(type);

    // Re-run search if there's a query
    if (query.trim()) {
      search({
        query,
        type,
        filters,
        limit: 20,
      });
    }
  };

  const handleGenerateEmbeddings = async () => {
    try {
      toast.loading("Generating embeddings...", { id: "embeddings" });
      const result = await generateEmbeddings.mutateAsync(50);

      if (result.processed > 0) {
        toast.success(`Generated embeddings for ${result.processed} entries`, {
          id: "embeddings",
          description: "Semantic search is now available for these entries.",
        });
      } else {
        toast.success("All entries already have embeddings", {
          id: "embeddings",
        });
      }
    } catch (error) {
      toast.error("Failed to generate embeddings", {
        id: "embeddings",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-text-primary">search</h1>
          <p className="mt-1 text-sm text-text-secondary">
            find entries using keywords or semantic search
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="search your entries..."
            defaultValue={query}
          />
        </div>

        {/* Search Type Toggle */}
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <div className="flex rounded-lg bg-bg-secondary p-0.5">
            {(["keyword", "combined", "semantic"] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleSearchTypeChange(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  searchType === type
                    ? "bg-accent text-bg-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateEmbeddings}
            disabled={generateEmbeddings.isPending}
            className="ml-auto px-3 py-1.5 text-xs text-text-secondary hover:text-accent hover:bg-accent-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateEmbeddings.isPending ? "generating..." : "generate embeddings"}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <SearchFilters
            entities={entities}
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={filtersLoading}
          />
        </div>

        {/* Results */}
        <SearchResults
          results={results}
          count={count}
          query={query}
          isLoading={isLoading}
          isError={isError}
          searchType={searchType}
        />
      </div>
    </>
  );
}
