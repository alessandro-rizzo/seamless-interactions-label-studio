"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VideoMetadata } from "@/lib/dataset";

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

interface FilterCounts {
  total: number;
  annotated: number;
  notAnnotated: number;
  improvised: number;
  naturalistic: number;
}

interface ApiResponse {
  interactions: VideoMetadata[];
  annotatedVideoIds: string[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filterCounts: FilterCounts;
}

export function VideoList() {
  const [annotatedFilter, setAnnotatedFilter] = useState<
    "all" | "annotated" | "not-annotated"
  >("all");
  const [labelFilter, setLabelFilter] = useState<
    "all" | "improvised" | "naturalistic"
  >("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Fetch data when filters or page change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          search: debouncedSearch,
          annotatedFilter,
          labelFilter,
        });

        const response = await fetch(`/api/videos?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, debouncedSearch, annotatedFilter, labelFilter]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  };

  const annotatedVideoIds = new Set(data?.annotatedVideoIds || []);

  if (error) {
    return (
      <div className="p-8 border rounded-lg bg-card text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const filterCounts = data?.filterCounts || {
    total: 0,
    annotated: 0,
    notAnnotated: 0,
    improvised: 0,
    naturalistic: 0,
  };

  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;
  const interactions = data?.interactions || [];
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, total);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search by video ID..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-background"
          disabled={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={annotatedFilter}
            onChange={(e) => {
              setAnnotatedFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg bg-background"
            disabled={loading}
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
            onChange={(e) => {
              setLabelFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg bg-background"
            disabled={loading}
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
          {loading ? (
            "Loading..."
          ) : (
            <>
              Showing {startIndex + 1}-{endIndex} of {total} videos
            </>
          )}
        </div>
        {totalPages > 1 && (
          <div>
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="p-8 border rounded-lg bg-card text-center">
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      ) : interactions.length === 0 ? (
        <div className="p-8 border rounded-lg bg-card text-center">
          <p className="text-muted-foreground">
            No videos found matching your filters
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {interactions.map((interaction) => {
            const isAnnotated = annotatedVideoIds.has(interaction.videoId);

            return (
              <div
                key={interaction.videoId}
                className="p-6 border rounded-lg bg-card flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">
                      {interaction.videoId}
                    </h2>
                    {isAnnotated && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-600 font-medium">
                        Annotated
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Vendor {interaction.vendorId} • Session{" "}
                    {interaction.sessionId} • Interaction{" "}
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
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
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
                  disabled={loading}
                  className="px-3 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  1
                </button>
                {currentPage > 4 && <span className="px-2">...</span>}
              </>
            )}

            {/* Show pages around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) => page >= currentPage - 2 && page <= currentPage + 2,
              )
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                  className={`px-3 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
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
                {currentPage < totalPages - 3 && (
                  <span className="px-2">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={loading}
                  className="px-3 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || loading}
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
