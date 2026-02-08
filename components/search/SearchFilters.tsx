"use client";

import { useState } from "react";

type Entity = {
  id: string;
  name: string;
  type: string;
};

type Filters = {
  dateFrom?: string;
  dateTo?: string;
  entityIds?: string[];
  sentiment?: "positive" | "neutral" | "negative";
};

type SearchFiltersProps = {
  entities: Entity[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  isLoading?: boolean;
};

export function SearchFilters({
  entities,
  filters,
  onFilterChange,
  isLoading = false,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDateFromChange = (value: string) => {
    onFilterChange({
      ...filters,
      dateFrom: value || undefined,
    });
  };

  const handleDateToChange = (value: string) => {
    onFilterChange({
      ...filters,
      dateTo: value || undefined,
    });
  };

  const handleEntityToggle = (entityId: string) => {
    const currentIds = filters.entityIds || [];
    const newIds = currentIds.includes(entityId)
      ? currentIds.filter((id) => id !== entityId)
      : [...currentIds, entityId];

    onFilterChange({
      ...filters,
      entityIds: newIds.length > 0 ? newIds : undefined,
    });
  };

  const handleSentimentChange = (sentiment: "positive" | "neutral" | "negative" | "") => {
    onFilterChange({
      ...filters,
      sentiment: sentiment || undefined,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters =
    filters.dateFrom || filters.dateTo || filters.entityIds?.length || filters.sentiment;

  // Group entities by type
  const entitiesByType = entities.reduce((acc, entity) => {
    if (!acc[entity.type]) {
      acc[entity.type] = [];
    }
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<string, Entity[]>);

  const peopleEntities = entitiesByType.person || [];

  return (
    <div className="bg-bg-secondary rounded-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-xs text-text-secondary">filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-accent-muted text-accent">
              active
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-text-tertiary transition-transform ${
            isExpanded ? "transform rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">
          {/* Date Range */}
          <div>
            <label className="block text-xs text-text-tertiary font-mono mb-2">date range</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-tertiary mb-1">from</label>
                <input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="block w-full px-3 py-2 bg-bg-tertiary border-none rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">to</label>
                <input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="block w-full px-3 py-2 bg-bg-tertiary border-none rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-xs text-text-tertiary font-mono mb-2">sentiment</label>
            <select
              value={filters.sentiment || ""}
              onChange={(e) =>
                handleSentimentChange(
                  e.target.value as "positive" | "neutral" | "negative" | ""
                )
              }
              className="block w-full px-3 py-2 bg-bg-tertiary border-none rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              <option value="">all</option>
              <option value="positive">positive</option>
              <option value="neutral">neutral</option>
              <option value="negative">negative</option>
            </select>
          </div>

          {/* People Filter */}
          {peopleEntities.length > 0 && (
            <div>
              <label className="block text-xs text-text-tertiary font-mono mb-2">people</label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 bg-bg-tertiary rounded-lg p-3">
                {isLoading ? (
                  <div className="text-xs text-text-tertiary">loading...</div>
                ) : (
                  peopleEntities.slice(0, 20).map((entity) => (
                    <label key={entity.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={filters.entityIds?.includes(entity.id) || false}
                        onChange={() => handleEntityToggle(entity.id)}
                        className="h-3.5 w-3.5 rounded border-border bg-bg-secondary text-accent focus:ring-accent/30"
                      />
                      <span className="text-xs text-text-secondary">{entity.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 text-xs text-text-secondary hover:text-accent hover:bg-accent-muted rounded-lg transition-colors"
            >
              clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
