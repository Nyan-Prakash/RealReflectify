"use client";

import { useState } from "react";
import { useThreads } from "@/hooks/useThreads";
import { ThreadCard } from "@/components/threads/ThreadCard";
import { CreateThreadDialog } from "@/components/threads/CreateThreadDialog";

export function ThreadsList() {
  const { data: threads, isLoading, error } = useThreads();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredThreads = threads?.filter(
    (t) => filterStatus === "all" || t.status === filterStatus
  );

  return (
    <>
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          {["all", "active", "paused", "completed", "archived"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  filterStatus === status
                    ? "bg-accent text-bg-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-1.5 text-xs font-medium text-bg-primary bg-accent hover:bg-accent-hover rounded-lg transition-colors flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          new thread
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-bg-secondary rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 bg-bg-tertiary rounded w-1/3 mb-3" />
              <div className="h-3 bg-bg-tertiary rounded w-2/3 mb-2" />
              <div className="h-3 bg-bg-tertiary rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12 bg-error/10 rounded-xl">
          <p className="text-sm text-error">
            failed to load threads. please try again.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredThreads && filteredThreads.length === 0 && (
        <div className="text-center py-16 bg-bg-secondary rounded-xl">
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
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-3 text-sm text-text-secondary">
            {filterStatus === "all"
              ? "no threads yet"
              : `no ${filterStatus} threads`}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {filterStatus === "all"
              ? "create a thread to group related journal entries."
              : "try changing the filter."}
          </p>
          {filterStatus === "all" && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-1.5 text-xs font-medium text-bg-primary bg-accent hover:bg-accent-hover rounded-lg transition-colors"
            >
              create your first thread
            </button>
          )}
        </div>
      )}

      {/* Threads list */}
      {filteredThreads && filteredThreads.length > 0 && (
        <div className="space-y-2">
          {filteredThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateThreadDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}
