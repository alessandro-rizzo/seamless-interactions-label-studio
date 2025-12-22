import "@testing-library/jest-dom";

// Only apply browser mocks when running in jsdom environment
if (typeof window !== "undefined") {
  // Mock HTMLMediaElement methods (not implemented in jsdom)
  Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });

  Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });

  Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });

  // Mock window.confirm
  Object.defineProperty(window, "confirm", {
    configurable: true,
    writable: true,
    value: jest.fn(() => true),
  });

  // Mock window.alert
  Object.defineProperty(window, "alert", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });
}

// Mock next/navigation (works in both environments)
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
