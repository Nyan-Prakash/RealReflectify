"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateEntryData = {
  content: string;
  title?: string;
};

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEntryData) => {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create entry");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch entries list
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}
