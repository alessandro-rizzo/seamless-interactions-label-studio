import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelingForm } from "./labeling-form";
import type { VideoMetadata } from "@/lib/dataset";
import type { Annotation } from "@prisma/client";

// Mock fetch
global.fetch = jest.fn();

// Mock useRouter
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("LabelingForm", () => {
  const mockVideo: VideoMetadata = {
    videoId: "V00_S0001_I00000001",
    vendorId: 0,
    sessionId: 1,
    interactionId: 1,
    participant1Id: "0001",
    participant2Id: "0002",
    participant1VideoPath: "/downloads/video1.mp4",
    participant2VideoPath: "/downloads/video2.mp4",
    fileId1: "V00_S0001_I00000001_P0001",
    fileId2: "V00_S0001_I00000001_P0002",
    label: "improvised",
    split: "dev",
  };

  const mockAnnotation: Annotation = {
    id: "1",
    videoId: "V00_S0001_I00000001",
    vendorId: 0,
    sessionId: 1,
    interactionId: 1,
    speaker1Id: "0001",
    speaker2Id: "0002",
    speaker1Label: "Morph A",
    speaker2Label: "Morph B",
    speaker1Confidence: 4,
    speaker2Confidence: 3,
    speaker1Comments: "Comment 1",
    speaker2Comments: "Comment 2",
    labelingTimeMs: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it("should render video players and form elements", () => {
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    // Check participant labels
    expect(
      screen.getByText(
        `V${mockVideo.vendorId} · S${mockVideo.sessionId} · I${mockVideo.interactionId} · P${mockVideo.participant1Id}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `V${mockVideo.vendorId} · S${mockVideo.sessionId} · I${mockVideo.interactionId} · P${mockVideo.participant2Id}`,
      ),
    ).toBeInTheDocument();

    // Check form elements
    expect(screen.getByText("Save Annotation")).toBeInTheDocument();
    expect(screen.getByText("Back to List")).toBeInTheDocument();
  });

  it("should render morph selection buttons", () => {
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    // Should have Morph A and Morph B buttons for both speakers (4 total)
    expect(screen.getAllByText("Morph A")).toHaveLength(2);
    expect(screen.getAllByText("Morph B")).toHaveLength(2);
  });

  it("should select morph when button is clicked", async () => {
    const user = userEvent.setup();
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    const morphAButtons = screen.getAllByText("Morph A");
    await user.click(morphAButtons[0]);

    // The button should have the selected style (we check by checking it has the primary background class)
    expect(morphAButtons[0]).toHaveClass("bg-primary");
  });

  it("should populate form with existing annotation", () => {
    render(
      <LabelingForm video={mockVideo} existingAnnotation={mockAnnotation} />,
    );

    // Check that morph buttons are selected
    const morphAButtons = screen.getAllByText("Morph A");
    const morphBButtons = screen.getAllByText("Morph B");
    expect(morphAButtons[0]).toHaveClass("bg-primary"); // Speaker 1 = Morph A
    expect(morphBButtons[1]).toHaveClass("bg-primary"); // Speaker 2 = Morph B

    // Check confidence values are displayed
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Check comments
    const textareas = screen.getAllByPlaceholderText("Add observations...");
    expect(textareas[0]).toHaveValue("Comment 1");
    expect(textareas[1]).toHaveValue("Comment 2");
  });

  it("should show Clear Annotation button when existing annotation", () => {
    render(
      <LabelingForm video={mockVideo} existingAnnotation={mockAnnotation} />,
    );
    expect(screen.getByText("Clear Annotation")).toBeInTheDocument();
  });

  it("should not show Clear Annotation button for new annotation", () => {
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);
    expect(screen.queryByText("Clear Annotation")).not.toBeInTheDocument();
  });

  it("should show error when submitting without labels", async () => {
    const user = userEvent.setup();
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    const saveButton = screen.getByText("Save Annotation");
    await user.click(saveButton);

    expect(
      screen.getByText("Please select labels for both speakers"),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should submit annotation when form is valid", async () => {
    const user = userEvent.setup();
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    // Select morphs for both speakers
    const morphAButtons = screen.getAllByText("Morph A");
    const morphBButtons = screen.getAllByText("Morph B");
    await user.click(morphAButtons[0]); // Speaker 1 = Morph A
    await user.click(morphBButtons[1]); // Speaker 2 = Morph B

    // Submit
    const saveButton = screen.getByText("Save Annotation");
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/annotations",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    // Should navigate back to videos list
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/videos");
    });
  });

  it("should show saving state during submission", async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () =>
            resolve({ ok: true, json: () => Promise.resolve({}) });
        }),
    );

    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    // Select morphs
    const morphAButtons = screen.getAllByText("Morph A");
    await user.click(morphAButtons[0]);
    await user.click(morphAButtons[1]);

    // Submit
    await user.click(screen.getByText("Save Annotation"));

    // Should show saving state
    expect(screen.getByText("Saving...")).toBeInTheDocument();

    // Resolve the promise
    await act(async () => {
      resolvePromise!();
    });
  });

  it("should show error when submission fails", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    // Select morphs
    const morphAButtons = screen.getAllByText("Morph A");
    await user.click(morphAButtons[0]);
    await user.click(morphAButtons[1]);

    // Submit
    await user.click(screen.getByText("Save Annotation"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to save annotation. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("should navigate back when Back to List is clicked", async () => {
    const user = userEvent.setup();
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    await user.click(screen.getByText("Back to List"));

    expect(mockPush).toHaveBeenCalledWith("/videos");
  });

  it("should delete annotation when Clear Annotation is clicked", async () => {
    const user = userEvent.setup();
    render(
      <LabelingForm video={mockVideo} existingAnnotation={mockAnnotation} />,
    );

    await user.click(screen.getByText("Clear Annotation"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/annotations?videoId=${encodeURIComponent(mockVideo.videoId)}`,
        { method: "DELETE" },
      );
    });
  });

  it("should update confidence when slider changes", async () => {
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    // Find confidence sliders (min=1, max=5) - not the seek bar (min=0)
    const confidenceSliders = screen
      .getAllByRole("slider")
      .filter(
        (slider) =>
          slider.getAttribute("min") === "1" &&
          slider.getAttribute("max") === "5",
      );

    fireEvent.change(confidenceSliders[0], { target: { value: "5" } });

    // The confidence value display should show 5
    const confidenceDisplays = screen.getAllByText("5");
    expect(confidenceDisplays.length).toBeGreaterThan(0);
  });

  it("should update comment textarea", async () => {
    const user = userEvent.setup();
    render(<LabelingForm video={mockVideo} existingAnnotation={null} />);

    const textareas = screen.getAllByPlaceholderText("Add observations...");
    await user.type(textareas[0], "Test comment");

    expect(textareas[0]).toHaveValue("Test comment");
  });

  it("should render metadata if present", () => {
    const videoWithMetadata: VideoMetadata = {
      ...mockVideo,
      metadata: { customField: "value" },
    };

    render(
      <LabelingForm video={videoWithMetadata} existingAnnotation={null} />,
    );

    expect(screen.getByText("Metadata")).toBeInTheDocument();
    expect(screen.getByText(/"customField": "value"/)).toBeInTheDocument();
  });
});
