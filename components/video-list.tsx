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
  manual: number;
  extrapolated: number;
}

interface ApiResponse {
  interactions: VideoMetadata[];
  annotatedVideoIds: string[];
  annotationTypes: Record<string, string>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filterCounts: FilterCounts;
  stats: {
    uniqueSpeakers: number;
    morphACount: number;
    morphBCount: number;
    morphAPercentage: number;
    morphBPercentage: number;
  };
}

interface VideoListProps {
  showStats?: boolean;
}

export function VideoList({ showStats = false }: VideoListProps) {
  const [annotatedFilter, setAnnotatedFilter] = useState<
    "all" | "annotated" | "not-annotated"
  >("all");
  const [labelFilter, setLabelFilter] = useState<
    "all" | "improvised" | "naturalistic"
  >("all");
  const [annotationTypeFilter, setAnnotationTypeFilter] = useState<
    "all" | "manual" | "extrapolated"
  >("all");
  const [sortBy, setSortBy] = useState<"videoId" | "annotatedAt">("videoId");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state - persists across pages/filters
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(
    new Set(),
  );
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

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
          annotationTypeFilter,
          sortBy,
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
  }, [
    currentPage,
    debouncedSearch,
    annotatedFilter,
    labelFilter,
    annotationTypeFilter,
    sortBy,
  ]);

  // Selection handlers
  const toggleVideoSelection = (videoId: string) => {
    const newSet = new Set(selectedVideoIds);
    if (newSet.has(videoId)) {
      newSet.delete(videoId);
    } else {
      newSet.add(videoId);
    }
    setSelectedVideoIds(newSet);
  };

  const getCurrentPageAnnotatedIds = () => {
    if (!data) return [];
    return data.interactions
      .filter((v) => data.annotatedVideoIds.includes(v.videoId))
      .map((v) => v.videoId);
  };

  const areAllCurrentPageSelected = () => {
    const annotatedIds = getCurrentPageAnnotatedIds();
    return (
      annotatedIds.length > 0 &&
      annotatedIds.every((id) => selectedVideoIds.has(id))
    );
  };

  const toggleSelectAllCurrentPage = () => {
    const annotatedIds = getCurrentPageAnnotatedIds();
    const newSet = new Set(selectedVideoIds);

    if (areAllCurrentPageSelected()) {
      // Deselect all on current page
      annotatedIds.forEach((id) => newSet.delete(id));
    } else {
      // Select all on current page
      annotatedIds.forEach((id) => newSet.add(id));
    }

    setSelectedVideoIds(newSet);
  };

  const clearAllSelections = () => {
    setSelectedVideoIds(new Set());
  };

  const getVisibleSelectedCount = () => {
    if (!data) return 0;
    return data.interactions.filter((v) => selectedVideoIds.has(v.videoId))
      .length;
  };

  const handleBatchDelete = async () => {
    if (selectedVideoIds.size === 0) return;

    const message = `Delete ${selectedVideoIds.size} annotation(s)?\n\nThis will permanently delete the annotations. This action cannot be undone.`;

    if (!confirm(message)) return;

    setIsDeletingBatch(true);
    try {
      const response = await fetch("/api/annotations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          videoIds: Array.from(selectedVideoIds),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete annotations");
      }

      // Clear selection and refetch data
      clearAllSelections();
      // Re-fetch data by calling the same fetch logic
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: debouncedSearch,
        annotatedFilter,
        labelFilter,
        annotationTypeFilter,
        sortBy,
      });

      const refreshResponse = await fetch(`/api/videos?${params}`);
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        setData(result);
      }
    } catch (err) {
      setError("Failed to delete annotations. Please try again.");
    } finally {
      setIsDeletingBatch(false);
    }
  };

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
    manual: 0,
    extrapolated: 0,
  };

  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;
  const interactions = data?.interactions || [];
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, total);

  // Calculate stats for display if showStats is true
  const annotatedVideos = filterCounts.annotated;
  const stats = data?.stats || {
    uniqueSpeakers: 0,
    morphACount: 0,
    morphBCount: 0,
    morphAPercentage: 0,
    morphBPercentage: 0,
  };
  const uniqueSpeakers = stats.uniqueSpeakers;

  return (
    <div className="h-full flex flex-col">
      {/* Stats Section */}
      {showStats && (
        <div className="flex-shrink-0 container mx-auto px-4 pt-8 pb-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[auto_auto_1fr]">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-sm font-medium text-muted-foreground">
                Annotated Videos
              </h3>
              <p className="text-3xl font-bold mt-2">{annotatedVideos}</p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-sm font-medium text-muted-foreground">
                Unique Speakers Labeled
              </h3>
              <p className="text-3xl font-bold mt-2">{uniqueSpeakers}</p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Morph Distribution
              </h3>
              {uniqueSpeakers > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium">Morph A</span>
                      <span className="font-semibold">
                        {stats.morphACount} ({stats.morphAPercentage.toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="font-medium">Morph B</span>
                      <span className="font-semibold">
                        {stats.morphBCount} ({stats.morphBPercentage.toFixed(1)}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="flex w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-3 transition-all"
                      style={{ width: `${stats.morphAPercentage}%` }}
                    />
                    <div
                      className="bg-green-500 h-3 transition-all"
                      style={{ width: `${stats.morphBPercentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No annotations yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex-shrink-0 container mx-auto px-4 py-4 border-b bg-background">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by video ID..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-background"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Status
              </label>
              <select
                value={annotatedFilter}
                onChange={(e) => {
                  setAnnotatedFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg bg-background"
                aria-label="Annotation Status Filter"
                disabled={loading}
              >
                <option value="all">All ({filterCounts.total})</option>
                <option value="annotated">
                  Annotated ({filterCounts.annotated})
                </option>
                <option value="not-annotated">
                  Not Annotated ({filterCounts.notAnnotated})
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Annotation Type
              </label>
              <select
                value={annotationTypeFilter}
                onChange={(e) => {
                  setAnnotationTypeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg bg-background"
                aria-label="Annotation Type Filter"
                disabled={loading}
              >
                <option value="all">All ({filterCounts.annotated})</option>
                <option value="manual">Manual ({filterCounts.manual})</option>
                <option value="extrapolated">
                  Extrapolated ({filterCounts.extrapolated})
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Label
              </label>
              <select
                value={labelFilter}
                onChange={(e) => {
                  setLabelFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg bg-background"
                aria-label="Label Type Filter"
                disabled={loading}
              >
                <option value="all">All ({filterCounts.total})</option>
                <option value="improvised">
                  Improvised ({filterCounts.improvised})
                </option>
                <option value="naturalistic">
                  Naturalistic ({filterCounts.naturalistic})
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg bg-background"
                aria-label="Sort Order"
                disabled={loading}
              >
                <option value="videoId">Video ID</option>
                <option value="annotatedAt">Labeling Date</option>
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
        </div>
      </div>

      {/* Batch Action Bar - shows when selections exist */}
      {selectedVideoIds.size > 0 && (
        <div className="flex-shrink-0 container mx-auto px-4 py-3 bg-muted/50 border-b">
          <div className="flex items-center gap-4">
            {/* Select All Current Page Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-page"
                checked={areAllCurrentPageSelected()}
                onChange={toggleSelectAllCurrentPage}
                className="w-4 h-4 rounded border-gray-300"
                disabled={loading || isDeletingBatch}
                aria-label="Select all on current page"
              />
              <label
                htmlFor="select-all-page"
                className="text-sm font-medium cursor-pointer"
              >
                Select All on Page
              </label>
            </div>

            {/* Selection Count */}
            <div className="flex-1 flex items-center gap-2 text-sm">
              <span className="font-medium">
                {selectedVideoIds.size} selected
              </span>
              <span className="text-muted-foreground">
                ({getVisibleSelectedCount()} visible)
              </span>
            </div>

            {/* Actions */}
            <button
              onClick={clearAllSelections}
              className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
              disabled={isDeletingBatch}
            >
              Clear All
            </button>

            <button
              onClick={handleBatchDelete}
              disabled={isDeletingBatch || selectedVideoIds.size === 0}
              className="px-4 py-1.5 text-sm font-medium rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeletingBatch
                ? "Deleting..."
                : `Delete ${selectedVideoIds.size} Selected`}
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Video Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
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
                const isSelected = selectedVideoIds.has(interaction.videoId);
                const annotationType =
                  data?.annotationTypes[interaction.videoId];

                return (
                  <div
                    key={interaction.videoId}
                    className={`p-6 border rounded-lg bg-card hover:shadow-md transition-shadow ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox - only show for annotated videos */}
                      {isAnnotated && (
                        <div className="flex-shrink-0 pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleVideoSelection(interaction.videoId)
                            }
                            className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                            disabled={loading || isDeletingBatch}
                            aria-label={`Select ${interaction.videoId}`}
                          />
                        </div>
                      )}

                      {/* Existing card content */}
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold">
                              {interaction.videoId}
                            </h2>
                            {isAnnotated && (
                              <>
                                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-600 font-medium">
                                  Annotated
                                </span>
                                {annotationType === "manual" && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-teal-500/20 text-teal-600 font-medium">
                                    Manual
                                  </span>
                                )}
                                {annotationType === "extrapolated" && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-600 font-medium">
                                    Extrapolated
                                  </span>
                                )}
                              </>
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
                    </div>
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
                    (page) =>
                      page >= currentPage - 2 && page <= currentPage + 2,
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
      </div>
    </div>
  );
}
