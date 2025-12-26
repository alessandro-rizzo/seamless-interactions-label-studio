import { render, screen, fireEvent } from "@testing-library/react";
import { UserMenu } from "./user-menu";
import { signOut } from "next-auth/react";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

describe("UserMenu", () => {
  const mockUser = {
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render user information", () => {
    render(<UserMenu user={mockUser} />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("should render user avatar when image is provided", () => {
    render(<UserMenu user={mockUser} />);

    const avatar = screen.getByAltText("Test User");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", mockUser.image);
  });

  it("should not render avatar when image is not provided", () => {
    const userWithoutImage = {
      name: "Test User",
      email: "test@example.com",
      image: null,
    };

    render(<UserMenu user={userWithoutImage} />);

    expect(screen.queryByAltText("Test User")).not.toBeInTheDocument();
  });

  it("should render sign out button", () => {
    render(<UserMenu user={mockUser} />);

    const signOutButton = screen.getByLabelText("Sign out");
    expect(signOutButton).toBeInTheDocument();
  });

  it("should call signOut when sign out button is clicked", () => {
    render(<UserMenu user={mockUser} />);

    const signOutButton = screen.getByLabelText("Sign out");
    fireEvent.click(signOutButton);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/auth/signin" });
  });

  it("should handle user with no name", () => {
    const userWithoutName = {
      name: null,
      email: "test@example.com",
      image: null,
    };

    render(<UserMenu user={userWithoutName} />);

    // Should still render email
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });
});
