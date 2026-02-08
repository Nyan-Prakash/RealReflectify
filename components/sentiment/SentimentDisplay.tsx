"use client";

type SentimentDisplayProps = {
  sentiment: {
    mood?: string;
    energy?: number;
  };
};

const moodColors: Record<string, string> = {
  positive: "text-success",
  neutral: "text-text-secondary",
  negative: "text-error",
  happy: "text-warning",
  sad: "text-info",
  anxious: "text-[#b48ead]",
  excited: "text-[#d08770]",
  calm: "text-success",
  angry: "text-error",
  grateful: "text-accent",
};

export function SentimentDisplay({ sentiment }: SentimentDisplayProps) {
  const { mood, energy } = sentiment;

  if (!mood && energy === undefined) {
    return null;
  }

  return (
    <div className="bg-bg-secondary rounded-xl p-5">
      <h2 className="text-sm font-medium text-text-secondary mb-4">
        sentiment
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mood && (
          <div className="bg-bg-tertiary rounded-lg p-4">
            <p className="text-xs text-text-tertiary font-mono mb-2">mood</p>
            <span
              className={`text-sm font-medium capitalize ${
                moodColors[mood.toLowerCase()] || "text-text-secondary"
              }`}
            >
              {mood}
            </span>
          </div>
        )}

        {energy !== undefined && (
          <div className="bg-bg-tertiary rounded-lg p-4">
            <p className="text-xs text-text-tertiary font-mono mb-2">energy</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="w-full bg-bg-secondary rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      energy >= 0.7
                        ? "bg-success"
                        : energy >= 0.4
                        ? "bg-warning"
                        : "bg-error"
                    }`}
                    style={{ width: `${energy * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-mono text-text-primary">
                {Math.round(energy * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {energy !== undefined && (
        <div className="mt-3 p-3 bg-bg-tertiary rounded-lg">
          <p className="text-xs text-text-secondary">
            {energy >= 0.7
              ? "high energy — you seem energized and motivated"
              : energy >= 0.4
              ? "moderate energy — a balanced state of mind"
              : "low energy — consider taking some time to rest and recharge"}
          </p>
        </div>
      )}
    </div>
  );
}
