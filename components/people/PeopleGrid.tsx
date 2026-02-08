"use client";

import { PersonCard } from "./PersonCard";
import { useState } from "react";

type Person = {
  id: string;
  canonicalName: string;
  mentionCount: number;
  firstMention: Date | null;
  lastMention: Date | null;
};

type PeopleGridProps = {
  people: Person[];
};

export function PeopleGrid({ people }: PeopleGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter people based on search query
  const filteredPeople = people.filter((person) =>
    person.canonicalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort people by mention count (descending)
  const sortedPeople = [...filteredPeople].sort(
    (a, b) => b.mentionCount - a.mentionCount
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search people..."
            className="block w-full pl-10 pr-3 py-2.5 bg-bg-secondary border-none rounded-xl text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <p className="text-xs text-text-tertiary font-mono">
          {sortedPeople.length === people.length ? (
            <>
              <span className="text-text-secondary">{people.length}</span>{" "}
              {people.length === 1 ? "person" : "people"}
            </>
          ) : (
            <>
              showing <span className="text-text-secondary">{sortedPeople.length}</span>{" "}
              of <span className="text-text-secondary">{people.length}</span>
            </>
          )}
        </p>
      </div>

      {/* Grid */}
      {sortedPeople.length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-xl">
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
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          <p className="mt-3 text-sm text-text-secondary">
            {searchQuery ? "no people found" : "no people yet"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {searchQuery
              ? "try adjusting your search"
              : "start writing entries to build your network"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPeople.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
