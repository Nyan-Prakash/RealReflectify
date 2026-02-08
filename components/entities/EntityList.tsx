"use client";

type Entity = {
  id: string;
  canonicalName: string;
  entityType: string;
  metadata: any;
};

type Mention = {
  mentionedAs: string;
  context: string | null;
  role: string | null;
  confidenceScore: string | null;
};

type EntityListProps = {
  entities: Record<string, Array<{ entity: Entity; mention: Mention }>>;
};

const entityTypeIcons: Record<string, string> = {
  person: "👤",
  place: "📍",
  organization: "🏢",
  food: "🍽️",
  activity: "⚡",
  thing: "📦",
};

const entityTypeLabels: Record<string, string> = {
  person: "people",
  place: "places",
  organization: "organizations",
  food: "food & drinks",
  activity: "activities",
  thing: "things",
};

const entityTypeColors: Record<string, string> = {
  person: "text-info",
  place: "text-success",
  organization: "text-[#b48ead]",
  food: "text-warning",
  activity: "text-[#d08770]",
  thing: "text-text-secondary",
};

export function EntityList({ entities }: EntityListProps) {
  const entityTypes = Object.keys(entities).sort();

  if (entityTypes.length === 0) {
    return (
      <p className="text-text-tertiary text-sm">no entities extracted from this entry.</p>
    );
  }

  return (
    <div className="space-y-5">
      {entityTypes.map((type) => (
        <div key={type}>
          <h3 className={`text-xs font-mono mb-2.5 flex items-center gap-2 ${entityTypeColors[type] || 'text-text-secondary'}`}>
            {entityTypeLabels[type] || type}
            <span className="text-text-tertiary">
              {entities[type].length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {entities[type].map(({ entity, mention }, idx) => (
              <div
                key={`${entity.id}-${idx}`}
                className="bg-bg-tertiary rounded-lg p-3 hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {entity.canonicalName}
                    </p>
                    {mention.mentionedAs !== entity.canonicalName && (
                      <p className="text-xs text-text-tertiary mt-0.5">
                        as &ldquo;{mention.mentionedAs}&rdquo;
                      </p>
                    )}
                    {mention.role && mention.role !== "participant" && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-xs bg-accent-muted text-accent rounded">
                        {mention.role}
                      </span>
                    )}
                  </div>
                  {mention.confidenceScore && (
                    <span className="ml-2 text-xs text-text-tertiary font-mono">
                      {(Number(mention.confidenceScore) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {mention.context && (
                  <p className="mt-2 text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {mention.context}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
