import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import type { Thread } from "@/hooks/useThreads";

const statusColors: Record<string, { text: string; dot: string }> = {
  active: { text: "text-success", dot: "bg-success" },
  paused: { text: "text-warning", dot: "bg-warning" },
  completed: { text: "text-info", dot: "bg-info" },
  archived: { text: "text-text-tertiary", dot: "bg-text-tertiary" },
};

type ThreadCardProps = {
  thread: Thread;
};

export function ThreadCard({ thread }: ThreadCardProps) {
  const status = statusColors[thread.status] || statusColors.active;

  return (
    <Link
      href={`/threads/${thread.id}`}
      className="block bg-bg-secondary rounded-xl p-5 hover:bg-bg-tertiary transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-text-primary truncate group-hover:text-accent transition-colors">
            {thread.title}
          </h3>

          {thread.description && (
            <p className="mt-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {thread.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary font-mono">
            <span>
              <span className="text-text-secondary">{thread.entryCount}</span>{" "}
              {thread.entryCount === 1 ? "entry" : "entries"}
            </span>

            {thread.earliestEntryDate && thread.latestEntryDate && (
              <span>
                {format(new Date(thread.earliestEntryDate), "MMM d")}
                {thread.earliestEntryDate !== thread.latestEntryDate && (
                  <> – {format(new Date(thread.latestEntryDate), "MMM d, yyyy")}</>
                )}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-text-tertiary">
            updated{" "}
            {formatDistanceToNow(new Date(thread.updatedAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        <div
          className={`ml-4 shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs ${status.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {thread.status}
        </div>
      </div>
    </Link>
  );
}
