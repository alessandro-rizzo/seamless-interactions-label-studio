import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelect, type MultiSelectOption } from "./multi-select";

describe("MultiSelect", () => {
  const mockOptions: MultiSelectOption[] = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render with placeholder text", () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
        placeholder="Select items"
      />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Select items");
  });

  it("should show labels when items are selected", () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={["option1", "option2"]}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Option 1, Option 2");
  });

  it("should show single option label when one item is selected", () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={["option1"]}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Option 1");
  });

  it("should open dropdown when clicked", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect options={mockOptions} value={[]} onChange={mockOnChange} />,
    );

    const trigger = screen.getByRole("button");
    await user.click(trigger);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("should toggle selection when option is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect options={mockOptions} value={[]} onChange={mockOnChange} />,
    );

    // Open dropdown
    await user.click(screen.getByRole("button"));

    // Click first option
    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    expect(mockOnChange).toHaveBeenCalledWith(["option1"]);
  });

  it("should deselect option when already selected", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        options={mockOptions}
        value={["option1"]}
        onChange={mockOnChange}
      />,
    );

    // Open dropdown
    await user.click(screen.getByRole("button"));

    // Click first option to deselect (get all and select the one in the dropdown, not the trigger)
    const option1Elements = screen.getAllByText("Option 1");
    await user.click(option1Elements[1]); // Click the one in the dropdown

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it("should show clear all button when items are selected", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        options={mockOptions}
        value={["option1", "option2"]}
        onChange={mockOnChange}
      />,
    );

    // Open dropdown
    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("should not show clear all button when no items are selected", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect options={mockOptions} value={[]} onChange={mockOnChange} />,
    );

    // Open dropdown
    await user.click(screen.getByRole("button"));

    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("should clear all selections when clear all is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        options={mockOptions}
        value={["option1", "option2"]}
        onChange={mockOnChange}
      />,
    );

    // Open dropdown
    await user.click(screen.getByRole("button"));

    // Click clear all
    const clearButton = screen.getByText("Clear all");
    await user.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it("should be disabled when disabled prop is true", () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
        disabled={true}
      />,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toBeDisabled();
  });

  it("should not open when disabled", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
        disabled={true}
      />,
    );

    const trigger = screen.getByRole("button");
    await user.click(trigger);

    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
  });

  it("should handle multiple selections", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MultiSelect options={mockOptions} value={[]} onChange={mockOnChange} />,
    );

    // Open dropdown
    await user.click(screen.getByRole("button"));

    // Select first option
    await user.click(screen.getByText("Option 1"));
    expect(mockOnChange).toHaveBeenCalledWith(["option1"]);

    // Rerender with updated value
    rerender(
      <MultiSelect
        options={mockOptions}
        value={["option1"]}
        onChange={mockOnChange}
      />,
    );

    // Select second option
    await user.click(screen.getByText("Option 2"));
    expect(mockOnChange).toHaveBeenCalledWith(["option1", "option2"]);
  });

  it("should preserve selection order", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MultiSelect options={mockOptions} value={[]} onChange={mockOnChange} />,
    );

    await user.click(screen.getByRole("button"));

    // Select in specific order
    await user.click(screen.getByText("Option 3"));
    expect(mockOnChange).toHaveBeenCalledWith(["option3"]);

    rerender(
      <MultiSelect
        options={mockOptions}
        value={["option3"]}
        onChange={mockOnChange}
      />,
    );

    await user.click(screen.getByText("Option 1"));
    expect(mockOnChange).toHaveBeenCalledWith(["option3", "option1"]);
  });
});
