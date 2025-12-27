import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoPanel } from "./info-panel";

describe("InfoPanel", () => {
  const mockItems = [
    {
      label: "Signal 1",
      description: "Description for signal 1",
    },
    {
      label: "Signal 2",
      description: "Description for signal 2",
    },
    {
      label: "Signal 3",
      description: "Description for signal 3",
    },
  ];

  it("should render trigger element", () => {
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Open Info" }),
    ).toBeInTheDocument();
  });

  it("should open dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open Info" });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should display title and description in dialog", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open Info" }));

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should display all items with labels and descriptions", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open Info" }));

    mockItems.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    });
  });

  it("should have a close button", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open Info" }));

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toBeInTheDocument();
  });

  it("should close dialog when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    // Open dialog
    await user.click(screen.getByRole("button", { name: "Open Info" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close dialog
    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);

    // Dialog should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should close dialog when ESC key is pressed", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    // Open dialog
    await user.click(screen.getByRole("button", { name: "Open Info" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press ESC
    await user.keyboard("{Escape}");

    // Dialog should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render with empty items array", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open Info" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should handle long content with scrolling", async () => {
    const user = userEvent.setup();
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      label: `Signal ${i + 1}`,
      description: `Description for signal ${i + 1}`,
    }));

    render(
      <InfoPanel
        trigger={<button>Open Info</button>}
        title="Test Title"
        description="Test description"
        items={manyItems}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open Info" }));

    // Check that dialog is rendered
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Check that first and last items are in the document
    expect(screen.getByText("Signal 1")).toBeInTheDocument();
    expect(screen.getByText("Signal 20")).toBeInTheDocument();
  });

  it("should support custom trigger elements", async () => {
    const user = userEvent.setup();
    render(
      <InfoPanel
        trigger={
          <div role="button" tabIndex={0}>
            Custom Trigger
          </div>
        }
        title="Test Title"
        description="Test description"
        items={mockItems}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Custom Trigger" });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
