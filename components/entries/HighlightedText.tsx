"use client";

type Mention = {
  mention: {
    mentionedAs: string;
    context: string | null;
    role: string | null;
    confidenceScore: string | null;
  };
  entity: {
    id: string;
    canonicalName: string;
    entityType: string;
  };
};

type HighlightedTextProps = {
  content: string;
  mentions: Mention[];
};

const entityTypeColors: Record<string, string> = {
  person: "bg-info/15 text-info",
  place: "bg-success/15 text-success",
  organization: "bg-[#b48ead]/15 text-[#b48ead]",
  food: "bg-warning/15 text-warning",
  activity: "bg-[#d08770]/15 text-[#d08770]",
  thing: "bg-text-secondary/15 text-text-secondary",
};

export function HighlightedText({ content, mentions }: HighlightedTextProps) {
  if (!mentions || mentions.length === 0) {
  }

  // Create a map of text spans to highlight
  const highlights = mentions.map(({ mention, entity }) => ({
    text: mention.mentionedAs,
    entityType: entity.entityType,
    canonicalName: entity.canonicalName,
    confidence: mention.confidenceScore,
  }));

  // Split content into parts and highlight matches
  let result: React.ReactNode[] = [];
  let lastIndex = 0;
  const processedRanges: Array<{ start: number; end: number }> = [];

  // Sort highlights by their position in the text
  const sortedHighlights = highlights
    .map((h) => ({
      ...h,
      index: content.toLowerCase().indexOf(h.text.toLowerCase()),
    }))
    .filter((h) => h.index !== -1)
    .sort((a, b) => a.index - b.index);

  sortedHighlights.forEach((highlight, idx) => {
    const index = highlight.index;
    const length = highlight.text.length;

    // Check if this range overlaps with any processed range
    const overlaps = processedRanges.some(
      (range) =>
        (index >= range.start && index < range.end) ||
        (index + length > range.start && index + length <= range.end)
    );

    if (overlaps) return;

    // Add text before highlight
    if (index > lastIndex) {
      result.push(
        <span key={`text-${idx}`}>{content.slice(lastIndex, index)}</span>
      );
    }

    // Add highlighted text
    const colorClass = entityTypeColors[highlight.entityType] || entityTypeColors.thing;
    result.push(
      <span
        key={`highlight-${idx}`}
        className={`px-1 py-0.5 rounded ${colorClass} cursor-help transition-all hover:opacity-80`}
        title={`${highlight.canonicalName} (${highlight.entityType})${
          highlight.confidence
            ? ` · ${(Number(highlight.confidence) * 100).toFixed(0)}% confidence`
            : ""
        }`}
      >
        {content.slice(index, index + length)}
      </span>
    );

    processedRanges.push({ start: index, end: index + length });
    lastIndex = index + length;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    result.push(
      <span key="text-end">{content.slice(lastIndex)}</span>
    );
  }

  return <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{result}</p>;
}
