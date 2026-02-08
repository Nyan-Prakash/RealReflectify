"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";

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

type SearchFilters = {
  dateFrom?: string;
  dateTo?: string;
  entityIds?: string[];
  sentiment?: "positive" | "neutral" | "negative";
};

type SearchParams = {
  query: string;
  type?: "keyword" | "semantic" | "combined";
  filters?: SearchFilters;
  limit?: number;
};

export function useSearch() {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const searchQuery = useQuery({
    queryKey: ["search", searchParams],
    queryFn: async () => {
      if (!searchParams || !searchParams.query) {
        return { results: [], count: 0, query: "", type: "combined" };
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error("Failed to search entries");
      }

      const data = await response.json();
      return {
        results: data.results as SearchResult[],
        count: data.count as number,
        query: data.query as string,
        type: data.type as string,
      };
    },
    enabled: !!searchParams?.query,
    // Don't refetch automatically
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const search = useCallback((params: SearchParams) => {
    setSearchParams(params);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchParams(null);
  }, []);

  return {
    search,
    clearSearch,
    results: searchQuery.data?.results || [],
    count: searchQuery.data?.count || 0,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
  };
}

export function useSearchFilters() {
  const filtersQuery = useQuery({
    queryKey: ["search-filters"],
    queryFn: async () => {
      const response = await fetch("/api/search");

      if (!response.ok) {
        throw new Error("Failed to fetch search filters");
      }

      const data = await response.json();
      return data.entities as Array<{
        id: string;
        name: string;
        type: string;
      }>;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    entities: filtersQuery.data || [],
    isLoading: filtersQuery.isLoading,
  };
}

export function useGenerateEmbeddings() {
  return useMutation({
    mutationFn: async (batchSize: number = 50) => {
      const response = await fetch("/api/search/generate-embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchSize }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate embeddings");
      }

      return await response.json();
    },
  });
}
