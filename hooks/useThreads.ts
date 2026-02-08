"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================================================
// Types
// ============================================================================

export type Thread = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  latestEntryDate: string | null;
  earliestEntryDate: string | null;
};

export type ThreadEntry = {
  entry: {
    id: string;
    content: string;
    occurredAt: string;
    createdAt: string;
    parseStatus: string;
    metadata: Record<string, unknown>;
  };
  link: {
    id: string;
    linkType: string;
    confidenceScore: string | null;
    createdAt: string;
  };
};

export type ThreadDetail = {
  thread: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  entries: ThreadEntry[];
  stats: {
    totalEntries: number;
    dateRange: { from: string | null; to: string | null };
  };
};

export type SuggestedEntry = {
  id: string;
  content: string;
  occurredAt: string;
  createdAt: string;
  parseStatus: string;
  metadata: Record<string, unknown>;
  similarityScore: number;
};

export type UnlinkedEntry = {
  id: string;
  content: string;
  occurredAt: string;
  createdAt: string;
  parseStatus: string;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all threads for the current user
 */
export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const response = await fetch("/api/threads");

      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }

      const data = await response.json();
      return data.threads as Thread[];
    },
  });
}

/**
 * Fetch a single thread with all linked entries
 */
export function useThread(threadId: string) {
  return useQuery({
    queryKey: ["threads", threadId],
    queryFn: async () => {
      const response = await fetch(`/api/threads/${threadId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch thread");
      }

      return (await response.json()) as ThreadDetail;
    },
    enabled: !!threadId,
  });
}

/**
 * Create a new thread
 */
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create thread");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

/**
 * Update a thread
 */
export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      ...data
    }: {
      threadId: string;
      title?: string;
      description?: string;
      status?: "active" | "paused" | "completed" | "archived";
    }) => {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update thread");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads", variables.threadId] });
    },
  });
}

/**
 * Delete a thread
 */
export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete thread");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

/**
 * Link an entry to a thread
 */
export function useLinkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      entryId,
      linkType = "manual",
    }: {
      threadId: string;
      entryId: string;
      linkType?: "manual" | "suggested" | "auto";
    }) => {
      const response = await fetch(`/api/threads/${threadId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, linkType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to link entry");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads", variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads", variables.threadId, "suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["threads", variables.threadId, "unlinked"] });
    },
  });
}

/**
 * Unlink an entry from a thread
 */
export function useUnlinkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      entryId,
    }: {
      threadId: string;
      entryId: string;
    }) => {
      const response = await fetch(`/api/threads/${threadId}/links`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unlink entry");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads", variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads", variables.threadId, "suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["threads", variables.threadId, "unlinked"] });
    },
  });
}

/**
 * Fetch AI-suggested entries for a thread
 */
export function useThreadSuggestions(threadId: string) {
  return useQuery({
    queryKey: ["threads", threadId, "suggestions"],
    queryFn: async () => {
      const response = await fetch(`/api/threads/${threadId}/suggest`);

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      return data.suggestions as SuggestedEntry[];
    },
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000, // Cache suggestions for 5 minutes
  });
}

/**
 * Fetch unlinked entries for manual linking
 */
export function useUnlinkedEntries(threadId: string, searchQuery?: string) {
  return useQuery({
    queryKey: ["threads", threadId, "unlinked", searchQuery],
    queryFn: async () => {
      const url = new URL(`/api/threads/${threadId}/links`, window.location.origin);
      if (searchQuery) {
        url.searchParams.set("q", searchQuery);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      return data.entries as UnlinkedEntry[];
    },
    enabled: !!threadId,
  });
}

/**
 * Generate AI summary for a thread
 */
export function useGenerateSummary() {
  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await fetch(`/api/threads/${threadId}/summary`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      return response.json() as Promise<{
        summary: string;
        entryCount: number;
        model: string;
      }>;
    },
  });
}
