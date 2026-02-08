import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type PersonCardProps = {
  person: {
    id: string;
    canonicalName: string;
    mentionCount: number;
    firstMention: Date | null;
    lastMention: Date | null;
  };
};

export function PersonCard({ person }: PersonCardProps) {
  return (
    <Link
      href={`/people/${person.id}`}
      className="block bg-bg-secondary rounded-xl p-5 hover:bg-bg-tertiary transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center">
            <span className="text-sm font-medium text-accent">
              {person.canonicalName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-text-primary truncate group-hover:text-accent transition-colors">
            {person.canonicalName}
          </h3>

          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs text-text-tertiary font-mono">
              <span className="text-text-secondary">{person.mentionCount}</span>{" "}
              {person.mentionCount === 1 ? "mention" : "mentions"}
            </p>

            {person.lastMention && (
              <p className="text-xs text-text-tertiary">
                last{" "}
                {formatDistanceToNow(new Date(person.lastMention), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
