import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoList } from "./video-list";
import type { VideoMetadata } from "@/lib/dataset";

// Mock fetch
global.fetch = jest.fn();

describe("VideoList", () => {
  const createMockInteraction = (
    overrides: Partial<VideoMetadata> = {},
  ): VideoMetadata => ({
    videoId: "V00_S0001_I00000001",
    vendorId: 0,
    sessionId: 1,
    interactionId: 1,
    participant1Id: "0001",
    participant2Id: "0002",
    participant1VideoPath:
      "/api/video?fileId=V00_S0001_I00000001_P0001&label=improvised&split=dev",
    participant2VideoPath:
      "/api/video?fileId=V00_S0001_I00000001_P0002&label=improvised&split=dev",
    label: "improvised",
    split: "dev",
    fileId1: "V00_S0001_I00000001_P0001",
    fileId2: "V00_S0001_I00000001_P0002",
    ...overrides,
  });

  const mockInteractions: VideoMetadata[] = [
    createMockInteraction({ videoId: "V00_S0001_I00000001" }),
    createMockInteraction({ videoId: "V00_S0001_I00000002" }),
    createMockInteraction({
      videoId: "V00_S0001_I00000003",
      label: "naturalistic",
    }),
    createMockInteraction({
      videoId: "V00_S0001_I00000004",
      label: "naturalistic",
    }),
  ];

  const mockAnnotatedVideoIds = new Set(["V00_S0001_I00000001"]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render list of videos", () => {
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    expect(screen.getByText("V00_S0001_I00000002")).toBeInTheDocument();
    expect(screen.getByText("V00_S0001_I00000003")).toBeInTheDocument();
    expect(screen.getByText("V00_S0001_I00000004")).toBeInTheDocument();
  });

  it("should show search input", () => {
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );
    expect(
      screen.getByPlaceholderText("Search by video ID..."),
    ).toBeInTheDocument();
  });

  it("should filter videos by search query", async () => {
    jest.useFakeTimers();
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Search by video ID...");
    fireEvent.change(searchInput, { target: { value: "I00000001" } });

    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
      expect(screen.queryByText("V00_S0001_I00000002")).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("should show filter dropdowns with counts", () => {
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    expect(screen.getByText("All Status (4)")).toBeInTheDocument();
    expect(screen.getByText("Annotated (1)")).toBeInTheDocument();
    expect(screen.getByText("Not Annotated (3)")).toBeInTheDocument();
    expect(screen.getByText("Improvised (2)")).toBeInTheDocument();
    expect(screen.getByText("Naturalistic (2)")).toBeInTheDocument();
  });

  it("should filter by annotated status", async () => {
    const user = userEvent.setup();
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    const annotatedFilter = screen.getAllByRole("combobox")[0];
    await user.selectOptions(annotatedFilter, "annotated");

    // Only annotated videos should be visible
    expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    expect(screen.queryByText("V00_S0001_I00000002")).not.toBeInTheDocument();
  });

  it("should filter by label type", async () => {
    const user = userEvent.setup();
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    const labelFilter = screen.getAllByRole("combobox")[1];
    await user.selectOptions(labelFilter, "naturalistic");

    // Only naturalistic videos should be visible
    expect(screen.getByText("V00_S0001_I00000003")).toBeInTheDocument();
    expect(screen.getByText("V00_S0001_I00000004")).toBeInTheDocument();
    expect(screen.queryByText("V00_S0001_I00000001")).not.toBeInTheDocument();
    expect(screen.queryByText("V00_S0001_I00000002")).not.toBeInTheDocument();
  });

  it("should show Annotated chip for annotated videos", () => {
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );
    expect(screen.getByText("Annotated")).toBeInTheDocument();
  });

  it("should show Label button for all videos", () => {
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    // Annotated video shows "Edit"
    expect(screen.getByText("Edit →")).toBeInTheDocument();

    // Non-annotated videos show "Label"
    expect(screen.getAllByText("Label →")).toHaveLength(3);
  });

  it("should show empty state when no videos match filters", async () => {
    const user = userEvent.setup();
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    // Filter to annotated
    const annotatedFilter = screen.getAllByRole("combobox")[0];
    await user.selectOptions(annotatedFilter, "annotated");

    // Then filter to naturalistic (there's no annotated + naturalistic video)
    const labelFilter = screen.getAllByRole("combobox")[1];
    await user.selectOptions(labelFilter, "naturalistic");

    expect(
      screen.getByText("No videos found matching your filters"),
    ).toBeInTheDocument();
  });

  describe("Pagination", () => {
    const manyInteractions = Array.from({ length: 50 }, (_, i) =>
      createMockInteraction({
        videoId: `V00_S0001_I${String(i + 1).padStart(8, "0")}`,
        label: i % 3 === 0 ? "naturalistic" : "improvised",
      }),
    );

    it("should show pagination controls when more than 20 items", () => {
      render(
        <VideoList
          interactions={manyInteractions}
          annotatedVideoIds={new Set()}
        />,
      );

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });

    it("should show correct items per page", () => {
      render(
        <VideoList
          interactions={manyInteractions}
          annotatedVideoIds={new Set()}
        />,
      );

      expect(screen.getByText("Showing 1-20 of 50 videos")).toBeInTheDocument();
    });

    it("should navigate to next page", async () => {
      const user = userEvent.setup();
      render(
        <VideoList
          interactions={manyInteractions}
          annotatedVideoIds={new Set()}
        />,
      );

      await user.click(screen.getByText("Next"));

      expect(
        screen.getByText("Showing 21-40 of 50 videos"),
      ).toBeInTheDocument();
      expect(screen.getByText("V00_S0001_I00000021")).toBeInTheDocument();
    });

    it("should navigate to previous page", async () => {
      const user = userEvent.setup();
      render(
        <VideoList
          interactions={manyInteractions}
          annotatedVideoIds={new Set()}
        />,
      );

      // Go to page 2
      await user.click(screen.getByText("Next"));

      // Go back to page 1
      await user.click(screen.getByText("Previous"));

      expect(screen.getByText("Showing 1-20 of 50 videos")).toBeInTheDocument();
    });

    it("should disable Previous on first page", () => {
      render(
        <VideoList
          interactions={manyInteractions}
          annotatedVideoIds={new Set()}
        />,
      );

      const prevButton = screen.getByText("Previous").closest("button");
      expect(prevButton).toBeDisabled();
    });

    it("should disable Next on last page", async () => {
      const user = userEvent.setup();
      render(
        <VideoList
          interactions={manyInteractions}
          annotatedVideoIds={new Set()}
        />,
      );

      // Go to last page
      await user.click(screen.getByText("3"));

      const nextButton = screen.getByText("Next").closest("button");
      expect(nextButton).toBeDisabled();
    });

    it("should reset to page 1 when filter changes", async () => {
      const user = userEvent.setup();
      render(
        <VideoList
          interactions={manyInteractions}
          annotatedVideoIds={new Set()}
        />,
      );

      // Go to page 2
      await user.click(screen.getByText("Next"));
      expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

      // Change filter
      const annotatedFilter = screen.getAllByRole("combobox")[0];
      await user.selectOptions(annotatedFilter, "not-annotated");

      // Should be back to page 1
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });
  });

  it("should show video metadata (vendor, session, interaction)", () => {
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    expect(screen.getAllByText(/Vendor 0/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Session 1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Interaction 1/).length).toBeGreaterThan(0);
  });

  it("should show label and split info", () => {
    render(
      <VideoList
        interactions={mockInteractions}
        annotatedVideoIds={mockAnnotatedVideoIds}
      />,
    );

    expect(screen.getAllByText(/improvised/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/dev/).length).toBeGreaterThan(0);
  });
});
