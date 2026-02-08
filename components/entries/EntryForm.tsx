"use client";

import { useState } from "react";
import { useCreateEntry } from "@/hooks/useCreateEntry";

export function EntryForm() {
  const [content, setContent] = useState("");
  const createEntry = useCreateEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      await createEntry.mutateAsync({ content });
      setContent("");
    } catch (error) {
      console.error("Failed to create entry:", error);
    }
  };

  return (
    <div className="bg-bg-secondary rounded-xl p-5">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={createEntry.isPending}
          className="w-full h-36 bg-transparent text-text-primary placeholder-text-tertiary text-sm leading-relaxed resize-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          placeholder="what's on your mind? write freely about your day, thoughts, or anything you want to remember..."
        />
        <div className="mt-3 flex justify-between items-center border-t border-border pt-3">
          <p className="text-xs text-text-tertiary">
            {createEntry.isPending
              ? "saving..."
              : "AI will extract events, people, and insights"}
          </p>
          <button
            type="submit"
            disabled={createEntry.isPending || !content.trim()}
            className="px-5 py-1.5 text-sm font-medium text-bg-primary bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-accent"
          >
            {createEntry.isPending ? "saving..." : "save"}
          </button>
        </div>
        {createEntry.isError && (
          <p className="mt-2 text-xs text-error">
            failed to save entry. please try again.
          </p>
        )}
      </form>
    </div>
  );
}
