"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VideoMetadata } from "@/lib/dataset";

interface VideoListProps {
  interactions: VideoMetadata[];
  annotatedVideoIds: Set<string>;
}

const ITEMS_PER_PAGE = 20;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function VideoList({ interactions, annotatedVideoIds }: VideoListProps) {
  const [annotatedFilter, setAnnotatedFilter] = useState<"all" | "annotated" | "not-annotated">("all");
  const [labelFilter, setLabelFilter] = useState<"all" | "improvised" | "naturalistic">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Pre-compute filter counts once (memoized)
  const filterCounts = useMemo(() => {
    let improvised = 0;
    let naturalistic = 0;

    for (const i of interactions) {
      if (i.label === "improvised") improvised++;
      else if (i.label === "naturalistic") naturalistic++;
    }

    return {
      total: interactions.length,
      annotated: annotatedVideoIds.size,
      notAnnotated: interactions.length - annotatedVideoIds.size,
      improvised,
      naturalistic,
    };
  }, [interactions, annotatedVideoIds]);

  // Memoized filtered interactions
  const filteredInteractions = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();

    return interactions.filter(interaction => {
      // Annotated status filter
      const isAnnotated = annotatedVideoIds.has(interaction.videoId);
      if (annotatedFilter === "annotated" && !isAnnotated) return false;
      if (annotatedFilter === "not-annotated" && isAnnotated) return false;

      // Label type filter (improvised/naturalistic)
      if (labelFilter === "improvised" && interaction.label !== "improvised") return false;
      if (labelFilter === "naturalistic" && interaction.label !== "naturalistic") return false;

      // Search filter (using debounced value)
      if (searchLower && !interaction.videoId.toLowerCase().includes(searchLower)) return false;

      return true;
    });
  }, [interactions, annotatedFilter, labelFilter, debouncedSearch, annotatedVideoIds]);

  // Pagination
  const totalPages = Math.ceil(filteredInteractions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedInteractions = filteredInteractions.slice(startIndex, endIndex);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search by video ID..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-background"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={annotatedFilter}
            onChange={e => {
              setAnnotatedFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option value="all">All Status ({filterCounts.total})</option>
            <option value="annotated">
              Annotated ({filterCounts.annotated})
            </option>
            <option value="not-annotated">
              Not Annotated ({filterCounts.notAnnotated})
            </option>
          </select>

          <select
            value={labelFilter}
            onChange={e => {
              setLabelFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option value="all">All Types ({filterCounts.total})</option>
            <option value="improvised">
              Improvised ({filterCounts.improvised})
            </option>
            <option value="naturalistic">
              Naturalistic ({filterCounts.naturalistic})
            </option>
          </select>
        </div>
      </div>

      {/* Results count and pagination info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredInteractions.length)} of{" "}
          {filteredInteractions.length} videos
        </div>
        {totalPages > 1 && (
          <div>
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Video Grid */}
      {filteredInteractions.length === 0 ? (
        <div className="p-8 border rounded-lg bg-card text-center">
          <p className="text-muted-foreground">No videos found matching your filters</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {paginatedInteractions.map(interaction => {
            const isAnnotated = annotatedVideoIds.has(interaction.videoId);

            return (
              <div
                key={interaction.videoId}
                className="p-6 border rounded-lg bg-card flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{interaction.videoId}</h2>
                    {isAnnotated && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-600 font-medium">
                        Annotated
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Vendor {interaction.vendorId} • Session {interaction.sessionId} • Interaction{" "}
                    {interaction.interactionId}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {interaction.label} • {interaction.split}
                  </div>
                </div>

                <Link
                  href={`/videos/${interaction.videoId}`}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {isAnnotated ? "Edit" : "Label"} →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {/* Show first page */}
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  1
                </button>
                {currentPage > 4 && <span className="px-2">...</span>}
              </>
            )}

            {/* Show pages around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg transition-colors ${
                    page === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {page}
                </button>
              ))}

            {/* Show last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
