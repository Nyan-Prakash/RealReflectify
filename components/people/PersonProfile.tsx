"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { MergeDialog } from "./MergeDialog";

type PersonProfileProps = {
  person: {
    id: string;
    canonicalName: string;
    createdAt: Date;
    metadata: any;
  };
  mentions: Array<{
    mention: any;
    entry: any;
  }>;
  stats: {
    totalMentions: number;
    uniqueEntries: number;
    firstMention: Date | null;
    lastMention: Date | null;
  };
  allPeople: Array<{
    id: string;
    canonicalName: string;
  }>;
};

export function PersonProfile({
  person,
  mentions,
  stats,
  allPeople,
}: PersonProfileProps) {
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  // Filter out current person from merge targets
  const availableMergeTargets = allPeople.filter((p) => p.id !== person.id);

  return (
    <>
      {/* Person Header */}
      <div className="bg-bg-secondary rounded-xl p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            <div className="w-14 h-14 rounded-xl bg-accent-muted flex items-center justify-center">
              <span className="text-xl font-medium text-accent">
                {person.canonicalName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-medium text-text-primary">
                {person.canonicalName}
              </h1>

              {availableMergeTargets.length > 0 && (
                <button
                  onClick={() => setShowMergeDialog(true)}
                  className="text-xs px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                  title="Merge this person with another"
                >
                  merge
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-text-tertiary font-mono">mentions</p>
                <p className="text-lg font-medium text-text-primary mt-0.5">
                  {stats.totalMentions}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-mono">entries</p>
                <p className="text-lg font-medium text-text-primary mt-0.5">
                  {stats.uniqueEntries}
                </p>
              </div>
              {stats.firstMention && (
                <div>
                  <p className="text-xs text-text-tertiary font-mono">first seen</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {formatDistanceToNow(new Date(stats.firstMention), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
              {stats.lastMention && (
                <div>
                  <p className="text-xs text-text-tertiary font-mono">last seen</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {formatDistanceToNow(new Date(stats.lastMention), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline of Mentions */}
      <div className="bg-bg-secondary rounded-xl p-5">
        <h2 className="text-sm font-medium text-text-secondary mb-4">
          timeline ({mentions.length} {mentions.length === 1 ? "mention" : "mentions"})
        </h2>

        {mentions.length === 0 ? (
          <p className="text-text-tertiary text-center py-8 text-sm">
            no mentions found for this person.
          </p>
        ) : (
          <div className="space-y-2">
            {mentions.map(({ mention, entry }) => (
              <Link
                key={mention.id}
                href={`/entries/${entry.id}`}
                className="block border-l-2 border-accent/30 pl-4 py-3 hover:bg-bg-tertiary transition-colors rounded-r-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <time className="text-xs text-text-tertiary font-mono">
                    {format(new Date(entry.occurredAt), "PPP")} ·{" "}
                    {formatDistanceToNow(new Date(entry.occurredAt), {
                      addSuffix: true,
                    })}
                  </time>
                  {mention.confidenceScore && (
                    <span className="text-xs text-text-tertiary font-mono">
                      {(parseFloat(mention.confidenceScore) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {mention.context && (
                  <div className="bg-bg-tertiary p-3 rounded-lg text-sm text-text-secondary mb-2">
                    <span className="italic">&ldquo;{mention.context}&rdquo;</span>
                  </div>
                )}

                <p className="text-sm text-text-primary line-clamp-2 leading-relaxed">{entry.content}</p>

                {mention.mentionedAs && mention.mentionedAs !== person.canonicalName && (
                  <p className="mt-2 text-xs text-text-tertiary">
                    as: <span className="text-text-secondary">{mention.mentionedAs}</span>
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Merge Dialog */}
      {showMergeDialog && (
        <MergeDialog
          sourcePerson={person}
          availablePeople={availableMergeTargets}
          onClose={() => setShowMergeDialog(false)}
        />
      )}
    </>
  );
}
