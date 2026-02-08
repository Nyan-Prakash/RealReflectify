"use client";

import { useState } from "react";
import { useCreateThread } from "@/hooks/useThreads";

type CreateThreadDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateThreadDialog({ open, onClose }: CreateThreadDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createThread = useCreateThread();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      await createThread.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create thread:", error);
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
      <div className="relative bg-bg-secondary rounded-xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-text-primary">
            create new thread
          </h2>
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

        <p className="text-sm text-text-tertiary mb-6">
          group related journal entries into a story arc or theme.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-4">
            <label
              htmlFor="thread-title"
              className="block text-xs font-mono text-text-tertiary mb-1.5"
            >
              title <span className="text-error">*</span>
            </label>
            <input
              id="thread-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g., "job search journey", "learning guitar"'
              className="w-full px-3 py-2 bg-bg-tertiary text-text-primary border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm placeholder:text-text-tertiary"
              disabled={createThread.isPending}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label
              htmlFor="thread-description"
              className="block text-xs font-mono text-text-tertiary mb-1.5"
            >
              description{" "}
              <span className="text-text-tertiary">(optional)</span>
            </label>
            <textarea
              id="thread-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="what is this thread about?"
              rows={3}
              className="w-full px-3 py-2 bg-bg-tertiary text-text-primary border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none placeholder:text-text-tertiary"
              disabled={createThread.isPending}
            />
          </div>

          {/* Error */}
          {createThread.isError && (
            <div className="mb-4 text-sm text-error bg-error/10 p-3 rounded-lg">
              {createThread.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
              disabled={createThread.isPending}
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={createThread.isPending || !title.trim()}
              className="px-4 py-2 text-sm text-bg-primary bg-accent rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createThread.isPending ? "creating..." : "create thread"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
