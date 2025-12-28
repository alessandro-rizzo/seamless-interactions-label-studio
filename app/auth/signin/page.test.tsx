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

    const form = screen
      .getByRole("button", {
        name: /sign in with google/i,
      })
      .closest("form");

    expect(form).toBeInTheDocument();
  });

  it("should render heading and description text", () => {
    render(<SignInPage />);

    // Verify heading is present
    const heading = screen.getByRole("heading", {
      name: /seamless interactions label studio/i,
    });
    expect(heading).toBeInTheDocument();

    // Verify description is present
    const description = screen.getByText(
      /annotate multimodal dyadic interactions/i,
    );
    expect(description).toBeInTheDocument();

    // Verify button is also present
    const button = screen.getByRole("button", {
      name: /sign in with google/i,
    });
    expect(button).toBeInTheDocument();
  });
});
