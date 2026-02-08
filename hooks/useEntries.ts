"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

type Entry = {
  id: string;
  title: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parseStatus: string | null;
  lastParsedAt: Date | null;
};

export function useEntries() {
  const previousEntriesRef = useRef<Entry[]>([]);

  const query = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const response = await fetch("/api/entries");

      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      return data.entries as Entry[];
    },
    // Poll every 2 seconds if there are entries being processed
    refetchInterval: (query) => {
      const entries = query.state.data;
      if (!entries) return false;

      const hasProcessing = entries.some(
        (entry) => entry.parseStatus === "processing" || entry.parseStatus === "pending"
      );

      return hasProcessing ? 2000 : false;
    },
    // Keep previous data while refetching for smoother UX
    placeholderData: (previousData) => previousData,
  });

  // Track newly completed entries for toast notifications
  useEffect(() => {
    if (query.data && previousEntriesRef.current.length > 0) {
      const newlyCompleted = query.data.filter((entry) => {
        const previous = previousEntriesRef.current.find((e) => e.id === entry.id);
        return (
          previous &&
          (previous.parseStatus === "processing" || previous.parseStatus === "pending") &&
          entry.parseStatus === "completed"
        );
      });

      if (newlyCompleted.length > 0) {
        // Dispatch custom event for newly completed entries
        window.dispatchEvent(
          new CustomEvent("entries-completed", {
            detail: { entries: newlyCompleted },
          })
        );
      }

      const newlyFailed = query.data.filter((entry) => {
        const previous = previousEntriesRef.current.find((e) => e.id === entry.id);
        return (
          previous &&
          (previous.parseStatus === "processing" || previous.parseStatus === "pending") &&
          entry.parseStatus === "failed"
        );
      });

      if (newlyFailed.length > 0) {
        // Dispatch custom event for newly failed entries
        window.dispatchEvent(
          new CustomEvent("entries-failed", {
            detail: { entries: newlyFailed },
          })
        );
      }
    }

    if (query.data) {
      previousEntriesRef.current = query.data;
    }
  }, [query.data]);

  return query;
}
