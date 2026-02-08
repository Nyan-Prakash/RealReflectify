"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useThread, useUpdateThread, useDeleteThread } from "@/hooks/useThreads";
import { ThreadTimeline } from "./ThreadTimeline";
import { SuggestedEntries } from "./SuggestedEntries";
import { LinkEntryDialog } from "./LinkEntryDialog";
import { ThreadSummary } from "./ThreadSummary";

const statusOptions = [
  { value: "active", label: "active", color: "bg-success" },
  { value: "paused", label: "paused", color: "bg-warning" },
  { value: "completed", label: "completed", color: "bg-info" },
  { value: "archived", label: "archived", color: "bg-text-tertiary" },
] as const;

type ThreadDetailViewProps = {
  threadId: string;
};

export function ThreadDetailView({ threadId }: ThreadDetailViewProps) {
  const router = useRouter();
  const { data: threadData, isLoading, error } = useThread(threadId);
  const updateThread = useUpdateThread();
  const deleteThread = useDeleteThread();

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "suggestions" | "summary">("timeline");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleStartEdit = () => {
    if (threadData) {
      setEditTitle(threadData.thread.title);
      setEditDescription(threadData.thread.description || "");
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateThread.mutateAsync({
        threadId,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update thread:", error);
    }
  };

  const handleStatusChange = async (status: "active" | "paused" | "completed" | "archived") => {
    try {
      await updateThread.mutateAsync({ threadId, status });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this thread? This cannot be undone.")) {
      return;
    }
    try {
      await deleteThread.mutateAsync(threadId);
      router.push("/threads");
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-bg-tertiary rounded w-1/3" />
        <div className="h-4 bg-bg-tertiary rounded w-2/3" />
        <div className="h-64 bg-bg-tertiary rounded" />
      </div>
    );
  }

  if (error || !threadData) {
    return (
      <div className="text-center py-12 bg-bg-secondary rounded-xl">
        <p className="text-sm text-error">
          thread not found or failed to load.
        </p>
        <button
          onClick={() => router.push("/threads")}
          className="mt-4 text-sm text-accent hover:text-accent-hover font-medium"
        >
          ← back to threads
        </button>
      </div>
    );
  }

  const { thread, entries, stats } = threadData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-bg-secondary rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl text-text-primary w-full px-3 py-2 bg-bg-tertiary border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="add a description..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-bg-tertiary text-text-primary border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateThread.isPending}
                    className="px-3 py-1 text-xs font-medium text-bg-primary bg-accent rounded-md hover:bg-accent-hover disabled:opacity-50"
                  >
                    {updateThread.isPending ? "saving..." : "save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs font-medium text-text-secondary bg-bg-tertiary rounded-md hover:bg-bg-hover"
                  >
                    cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl text-text-primary">
                  {thread.title}
                </h1>
                {thread.description && (
                  <p className="mt-1 text-sm text-text-secondary">
                    {thread.description}
                  </p>
                )}
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleStartEdit}
                className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                title="Edit thread"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-text-tertiary hover:text-error transition-colors"
                title="Delete thread"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Stats & Status */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-text-tertiary font-mono">
            <span>
              <span className="text-text-secondary">{stats.totalEntries}</span>{" "}
              {stats.totalEntries === 1 ? "entry" : "entries"}
            </span>
            {stats.dateRange.from && stats.dateRange.to && (
              <span>
                {new Date(stats.dateRange.from).toLocaleDateString()} –{" "}
                {new Date(stats.dateRange.to).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  thread.status === opt.value
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-bg-secondary rounded-xl p-1">
        {[
          { key: "timeline" as const, label: "timeline" },
          { key: "suggestions" as const, label: "ai suggestions" },
          { key: "summary" as const, label: "summary" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 text-sm rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-bg-tertiary text-accent"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add entry button */}
      {activeTab === "timeline" && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowLinkDialog(true)}
            className="px-4 py-2 text-sm text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
          >
            link entry
          </button>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "timeline" && (
        <ThreadTimeline threadId={threadId} entries={entries} />
      )}

      {activeTab === "suggestions" && (
        <SuggestedEntries threadId={threadId} />
      )}

      {activeTab === "summary" && (
        <ThreadSummary threadId={threadId} entryCount={stats.totalEntries} />
      )}

      {/* Link entry dialog */}
      <LinkEntryDialog
        threadId={threadId}
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
      />
    </div>
  );
}
