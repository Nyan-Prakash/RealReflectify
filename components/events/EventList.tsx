"use client";

import { format } from "date-fns";

type Event = {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isAllDay: boolean | null;
  extractedText: string | null;
  confidenceScore: string | null;
  participants: Array<{
    entity: {
      id: string;
      canonicalName: string;
      entityType: string;
    };
    mention: {
      role: string | null;
    };
  }>;
};

type EventListProps = {
  events: Event[];
};

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <p className="text-text-tertiary text-sm">no events extracted from this entry.</p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        return (
          <div
            key={event.id}
            className="bg-bg-tertiary rounded-lg p-4 hover:bg-bg-hover transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm text-text-primary">
                  {event.title}
                </h3>
                <p className="text-xs text-text-tertiary font-mono capitalize mt-0.5">
                  {event.eventType}
                </p>
              </div>
              {event.confidenceScore && (
                <span className="text-xs text-text-tertiary font-mono">
                  {(Number(event.confidenceScore) * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-text-secondary mb-3 leading-relaxed">{event.description}</p>
            )}

            {event.startDate && (
              <div className="flex items-center text-xs text-text-tertiary font-mono mb-2">
                {event.isAllDay
                  ? format(new Date(event.startDate), "PPP")
                  : format(new Date(event.startDate), "PPP 'at' p")}
                {event.endDate && (
                  <>
                    {" → "}
                    {event.isAllDay
                      ? format(new Date(event.endDate), "PPP")
                      : format(new Date(event.endDate), "p")}
                  </>
                )}
              </div>
            )}

            {event.participants && event.participants.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-text-tertiary mb-2">participants</p>
                <div className="flex flex-wrap gap-1.5">
                  {event.participants.map((participant, idx) => (
                    <span
                      key={`${participant.entity.id}-${idx}`}
                      className="inline-flex items-center px-2 py-0.5 text-xs bg-bg-secondary text-text-secondary rounded"
                    >
                      {participant.entity.canonicalName}
                      {participant.mention.role &&
                        participant.mention.role !== "participant" && (
                          <span className="ml-1 text-text-tertiary">
                            ({participant.mention.role})
                          </span>
                        )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.extractedText && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-text-tertiary italic leading-relaxed">
                  &ldquo;{event.extractedText}&rdquo;
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
