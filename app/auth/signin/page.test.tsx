/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import SignInPage from "./page";

// Mock the auth signIn function
jest.mock("@/lib/auth", () => ({
  signIn: jest.fn(),
}));

describe("SignInPage", () => {
  it("should render sign in button", () => {
    render(<SignInPage />);

    const signInButton = screen.getByRole("button", {
      name: /sign in with google/i,
    });
    expect(signInButton).toBeInTheDocument();
  });

  it("should render Google logo in button", () => {
    render(<SignInPage />);

    const button = screen.getByRole("button", {
      name: /sign in with google/i,
    });

    // Check if SVG is present
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should render form with server action", () => {
    render(<SignInPage />);

    const form = screen.getByRole("button", {
      name: /sign in with google/i,
    }).closest("form");

    expect(form).toBeInTheDocument();
  });

  it("should not render any heading or description text", () => {
    render(<SignInPage />);

    // Verify no heading
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    // Verify minimal content - only the button
    const button = screen.getByRole("button", {
      name: /sign in with google/i,
    });
    expect(button).toBeInTheDocument();
  });
});
