import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FacetSelector } from "./facet-selector";
import type { Facet } from "@/lib/annotation-ontology";

describe("FacetSelector", () => {
  const mockFacet: Facet = {
    id: "prosody",
    label: "Prosody",
    description:
      "Acoustic characteristics of speech independent of word choice.",
    signals: [
      {
        id: "low_pitch_variance",
        label: "Low pitch variance",
        description: "Pitch remains within a narrow frequency range.",
      },
      {
        id: "high_pitch_variance",
        label: "High pitch variance",
        description: "Noticeable pitch modulation within a turn.",
      },
      {
        id: "rising_terminal",
        label: "Rising terminal",
        description: "Utterance ends with an upward pitch movement.",
      },
    ],
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render facet label", () => {
    render(
      <FacetSelector facet={mockFacet} value={[]} onChange={mockOnChange} />,
    );

    expect(screen.getByText("Prosody")).toBeInTheDocument();
  });

  it("should render facet label without info icon", () => {
    render(
      <FacetSelector facet={mockFacet} value={[]} onChange={mockOnChange} />,
    );

    expect(screen.getByText("Prosody")).toBeInTheDocument();

    // Info icon should not be present
    const infoButton = screen.queryByRole("button", {
      name: "Information about Prosody",
    });
    expect(infoButton).not.toBeInTheDocument();
  });

  it("should render multi-select dropdown", () => {
    render(
      <FacetSelector facet={mockFacet} value={[]} onChange={mockOnChange} />,
    );

    // Multi-select renders as a button with aria-label
    const dropdown = screen.getByRole("button", { name: "Select signals..." });
    expect(dropdown).toBeInTheDocument();
  });

  it("should display signal descriptions in dropdown", async () => {
    const user = userEvent.setup();
    render(
      <FacetSelector facet={mockFacet} value={[]} onChange={mockOnChange} />,
    );

    // Open dropdown
    const dropdown = screen.getByRole("button", { name: "Select signals..." });
    await user.click(dropdown);

    // Check that signals and their descriptions are visible
    mockFacet.signals.forEach((signal) => {
      expect(screen.getByText(signal.label)).toBeInTheDocument();
      expect(screen.getByText(signal.description)).toBeInTheDocument();
    });
  });

  it("should open dropdown when clicked", async () => {
    const user = userEvent.setup();
    render(
      <FacetSelector facet={mockFacet} value={[]} onChange={mockOnChange} />,
    );

    const dropdown = screen.getByRole("button", { name: "Select signals..." });
    await user.click(dropdown);

    // All signal options should be visible
    expect(screen.getByText("Low pitch variance")).toBeInTheDocument();
    expect(screen.getByText("High pitch variance")).toBeInTheDocument();
    expect(screen.getByText("Rising terminal")).toBeInTheDocument();
  });

  it("should call onChange when signal is selected", async () => {
    const user = userEvent.setup();
    render(
      <FacetSelector facet={mockFacet} value={[]} onChange={mockOnChange} />,
    );

    const dropdown = screen.getByRole("button", { name: "Select signals..." });
    await user.click(dropdown);

    const signal = screen.getByText("Low pitch variance");
    await user.click(signal);

    expect(mockOnChange).toHaveBeenCalledWith(["low_pitch_variance"]);
  });

  it("should display selected labels in dropdown", () => {
    render(
      <FacetSelector
        facet={mockFacet}
        value={["low_pitch_variance", "high_pitch_variance"]}
        onChange={mockOnChange}
      />,
    );

    const dropdown = screen.getByRole("button", { name: "Select signals..." });
    expect(dropdown).toHaveTextContent(
      "Low pitch variance, High pitch variance",
    );
  });

  it("should pass disabled prop to multi-select", () => {
    render(
      <FacetSelector
        facet={mockFacet}
        value={[]}
        onChange={mockOnChange}
        disabled={true}
      />,
    );

    const dropdown = screen.getByRole("button", { name: "Select signals..." });
    expect(dropdown).toBeDisabled();
  });

  it("should handle empty signals array", () => {
    const emptyFacet: Facet = {
      id: "empty",
      label: "Empty Facet",
      description: "A facet with no signals",
      signals: [],
    };

    render(
      <FacetSelector facet={emptyFacet} value={[]} onChange={mockOnChange} />,
    );

    expect(screen.getByText("Empty Facet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select signals..." }),
    ).toBeInTheDocument();
  });

  it("should update when value prop changes", () => {
    const { rerender } = render(
      <FacetSelector facet={mockFacet} value={[]} onChange={mockOnChange} />,
    );

    let dropdown = screen.getByRole("button", { name: "Select signals..." });
    expect(dropdown).toHaveTextContent("Select signals...");

    rerender(
      <FacetSelector
        facet={mockFacet}
        value={["low_pitch_variance"]}
        onChange={mockOnChange}
      />,
    );

    dropdown = screen.getByRole("button", { name: "Select signals..." });
    expect(dropdown).toHaveTextContent("Low pitch variance");
  });
});
