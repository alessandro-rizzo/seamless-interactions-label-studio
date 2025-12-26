import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoList } from "./video-list";

// Mock fetch globally
global.fetch = jest.fn();

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    }),
  ),
}));

const mockApiResponse = {
  interactions: [
    {
      videoId: "V00_S0001_I00000001",
      vendorId: 0,
      sessionId: 1,
      interactionId: 1,
      participant1Id: "0001",
      participant2Id: "0002",
      label: "improvised",
      split: "train",
      fileId1: "V00_S0001_I00000001_P0001",
      fileId2: "V00_S0001_I00000001_P0002",
      participant1VideoPath: "/api/video?fileId=V00_S0001_I00000001_P0001",
      participant2VideoPath: "/api/video?fileId=V00_S0001_I00000001_P0002",
      annotatedAt: new Date("2024-01-01"),
    },
    {
      videoId: "V00_S0001_I00000002",
      vendorId: 0,
      sessionId: 1,
      interactionId: 2,
      participant1Id: "0003",
      participant2Id: "0004",
      label: "naturalistic",
      split: "dev",
      fileId1: "V00_S0001_I00000002_P0003",
      fileId2: "V00_S0001_I00000002_P0004",
      participant1VideoPath: "/api/video?fileId=V00_S0001_I00000002_P0003",
      participant2VideoPath: "/api/video?fileId=V00_S0001_I00000002_P0004",
      annotatedAt: null,
    },
  ],
  annotatedVideoIds: ["V00_S0001_I00000001"],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
  filterCounts: {
    total: 100,
    annotated: 50,
    notAnnotated: 50,
    improvised: 60,
    naturalistic: 40,
  },
  stats: {
    morphACount: 30,
    morphBCount: 70,
    morphAPercentage: 30,
    morphBPercentage: 70,
  },
};

describe("VideoList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  it("should render loading state initially", () => {
    render(<VideoList />);
    expect(screen.getByText("Loading videos...")).toBeInTheDocument();
  });

  it("should fetch and display videos on mount", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
      expect(screen.getByText("V00_S0001_I00000002")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/videos"),
    );
  });

  it("should display annotated badge for annotated videos", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const firstVideo = screen
      .getByText("V00_S0001_I00000001")
      .closest("div.p-6") as HTMLElement;
    const secondVideo = screen
      .getByText("V00_S0001_I00000002")
      .closest("div.p-6") as HTMLElement;

    expect(within(firstVideo).getByText("Annotated")).toBeInTheDocument();
    expect(
      within(secondVideo).queryByText("Annotated"),
    ).not.toBeInTheDocument();
  });

  it("should show correct button text for annotated and non-annotated videos", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const firstVideo = screen
      .getByText("V00_S0001_I00000001")
      .closest("div.p-6") as HTMLElement;
    const secondVideo = screen
      .getByText("V00_S0001_I00000002")
      .closest("div.p-6") as HTMLElement;

    expect(within(firstVideo).getByText(/Edit/)).toBeInTheDocument();
    expect(within(secondVideo).getByText(/Label/)).toBeInTheDocument();
  });

  it("should filter videos by search term", async () => {
    const user = userEvent.setup();
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by video ID...");
    await user.type(searchInput, "V00_S0001_I00000001");

    // Wait for debounce (300ms) and API call
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("search=V00_S0001_I00000001"),
        );
      },
      { timeout: 500 },
    );
  });

  it("should filter videos by annotation status", async () => {
    const user = userEvent.setup();
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole("combobox", {
      name: "Annotation Status Filter",
    });
    await user.selectOptions(statusSelect, "annotated");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("annotatedFilter=annotated"),
      );
    });
  });

  it("should filter videos by label type", async () => {
    const user = userEvent.setup();
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const labelSelect = screen.getByRole("combobox", {
      name: "Label Type Filter",
    });
    await user.selectOptions(labelSelect, "improvised");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("labelFilter=improvised"),
      );
    });
  });

  it("should display filter counts in select options", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    expect(screen.getByText("All Status (100)")).toBeInTheDocument();
    expect(screen.getByText("Annotated (50)")).toBeInTheDocument();
    expect(screen.getByText("Not Annotated (50)")).toBeInTheDocument();
    expect(screen.getByText("Improvised (60)")).toBeInTheDocument();
    expect(screen.getByText("Naturalistic (40)")).toBeInTheDocument();
  });

  it("should display pagination information", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    expect(screen.getByText(/Showing 1-2 of 2 videos/)).toBeInTheDocument();
  });

  it("should handle pagination navigation", async () => {
    const user = userEvent.setup();
    const multiPageResponse = {
      ...mockApiResponse,
      total: 100,
      totalPages: 5,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => multiPageResponse,
    });

    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();

    const nextButton = screen.getByText(/Next/);
    await user.click(nextButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
      );
    });
  });

  it("should disable filters and pagination while loading", async () => {
    // Make fetch hang to keep loading state
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockApiResponse,
              }),
            1000,
          ),
        ),
    );

    render(<VideoList />);

    expect(screen.getByText("Loading videos...")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search by video ID...");
    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects[0];
    const labelSelect = selects[1];
    const sortSelect = selects[2];

    expect(searchInput).toBeDisabled();
    expect(statusSelect).toBeDisabled();
    expect(labelSelect).toBeDisabled();
    expect(sortSelect).toBeDisabled();
  });

  it("should display error message on fetch failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch/)).toBeInTheDocument();
    });
  });

  it("should display empty state when no videos match filters", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockApiResponse,
        interactions: [],
        total: 0,
      }),
    });

    render(<VideoList />);

    await waitFor(() => {
      expect(
        screen.getByText("No videos found matching your filters"),
      ).toBeInTheDocument();
    });
  });

  it("should reset page to 1 when changing filters", async () => {
    const user = userEvent.setup();
    const multiPageResponse = {
      ...mockApiResponse,
      total: 100,
      totalPages: 5,
      page: 2,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => multiPageResponse,
    });

    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    // Navigate to page 2
    const nextButton = screen.getByText(/Next/);
    await user.click(nextButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
      );
    });

    // Change filter - should reset to page 1
    const labelSelect = screen.getByRole("combobox", {
      name: "Label Type Filter",
    });
    await user.selectOptions(labelSelect, "improvised");

    await waitFor(() => {
      const lastCall = (global.fetch as jest.Mock).mock.calls[
        (global.fetch as jest.Mock).mock.calls.length - 1
      ][0];
      expect(lastCall).toContain("page=1");
      expect(lastCall).toContain("labelFilter=improvised");
    });
  });

  it("should debounce search input", async () => {
    const user = userEvent.setup();
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by video ID...");

    // Type multiple characters quickly
    await user.type(searchInput, "abc");

    // Should not have called fetch for each character
    const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

    // Wait for debounce
    await waitFor(
      () => {
        const newCallCount = (global.fetch as jest.Mock).mock.calls.length;
        expect(newCallCount).toBe(initialCallCount + 1);
      },
      { timeout: 500 },
    );
  });

  it("should display video metadata", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Vendor 0/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Session 1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Interaction 1/).length).toBeGreaterThan(0);
  });

  it("should display label and split info", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/improvised/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/train/).length).toBeGreaterThan(0);
  });

  it("should handle API error responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<VideoList />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: Failed to fetch videos/),
      ).toBeInTheDocument();
    });
  });

  it("should show stats when showStats prop is true", async () => {
    render(<VideoList showStats={true} />);

    await waitFor(() => {
      expect(screen.getByText("Annotated Videos")).toBeInTheDocument();
      expect(screen.getByText("Labeled Speakers")).toBeInTheDocument();
      expect(screen.getByText("Morph Distribution")).toBeInTheDocument();
    });

    await waitFor(() => {
      // Stats should show the values from mockApiResponse
      const annotatedVideosCard = screen
        .getByText("Annotated Videos")
        .closest("div");
      const labeledSpeakersCard = screen
        .getByText("Labeled Speakers")
        .closest("div");

      expect(annotatedVideosCard).toHaveTextContent("50");
      expect(labeledSpeakersCard).toHaveTextContent("100");
    });
  });

  it("should hide stats when showStats prop is false", async () => {
    render(<VideoList showStats={false} />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    expect(screen.queryByText("Annotated Videos")).not.toBeInTheDocument();
    expect(screen.queryByText("Labeled Speakers")).not.toBeInTheDocument();
    expect(screen.queryByText("Morph Distribution")).not.toBeInTheDocument();
  });

  it("should display morph distribution in stats", async () => {
    render(<VideoList showStats={true} />);

    await waitFor(() => {
      expect(screen.getByText("Morph Distribution")).toBeInTheDocument();
    });

    expect(screen.getByText(/Morph A/)).toBeInTheDocument();
    expect(screen.getByText(/Morph B/)).toBeInTheDocument();
    expect(screen.getByText(/30 \/ 100 \(30.0%\)/)).toBeInTheDocument();
    expect(screen.getByText(/70 \/ 100 \(70.0%\)/)).toBeInTheDocument();
  });

  it("should have sort dropdown with correct options", async () => {
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole("combobox", { name: "Sort Order" });
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveValue("videoId");
    expect(screen.getByText("Sort by Labeling Date")).toBeInTheDocument();
  });

  it("should filter videos by sort option", async () => {
    const user = userEvent.setup();
    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole("combobox", { name: "Sort Order" });
    await user.selectOptions(sortSelect, "annotatedAt");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=annotatedAt"),
      );
    });
  });

  it("should reset page to 1 when changing sort", async () => {
    const user = userEvent.setup();
    const multiPageResponse = {
      ...mockApiResponse,
      total: 100,
      totalPages: 5,
      page: 2,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => multiPageResponse,
    });

    render(<VideoList />);

    await waitFor(() => {
      expect(screen.getByText("V00_S0001_I00000001")).toBeInTheDocument();
    });

    // Navigate to page 2
    const nextButton = screen.getByText(/Next/);
    await user.click(nextButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
      );
    });

    // Change sort - should reset to page 1
    const sortSelect = screen.getByRole("combobox", { name: "Sort Order" });
    await user.selectOptions(sortSelect, "annotatedAt");

    await waitFor(() => {
      const lastCall = (global.fetch as jest.Mock).mock.calls[
        (global.fetch as jest.Mock).mock.calls.length - 1
      ][0];
      expect(lastCall).toContain("page=1");
      expect(lastCall).toContain("sortBy=annotatedAt");
    });
  });
});
