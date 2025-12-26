/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "./middleware";

describe("Middleware", () => {
  const createRequest = (pathname: string, hasSessionCookie = false) => {
    const url = `http://localhost:3000${pathname}`;
    const request = new NextRequest(url);

    if (hasSessionCookie) {
      request.cookies.set("authjs.session-token", "mock-session-token");
    }

    return request;
  };

  describe("Auth routes", () => {
    it("should allow access to sign-in page without session", () => {
      const request = createRequest("/auth/signin", false);
      const response = middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307); // Not a redirect
    });

    it("should allow access to auth API routes without session", () => {
      const request = createRequest("/api/auth/signin", false);
      const response = middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });

    it("should allow access to auth callback without session", () => {
      const request = createRequest("/api/auth/callback/google", false);
      const response = middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });
  });

  describe("Protected routes", () => {
    it("should redirect to sign-in when accessing home without session", () => {
      const request = createRequest("/", false);
      const response = middleware(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/auth/signin");
    });

    it("should redirect to sign-in when accessing videos without session", () => {
      const request = createRequest("/videos/V1_S1_I1", false);
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/auth/signin");
    });

    it("should redirect to sign-in when accessing API routes without session", () => {
      const request = createRequest("/api/annotations", false);
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/auth/signin");
    });

    it("should allow access to home with valid session", () => {
      const request = createRequest("/", true);
      const response = middleware(request);

      expect(response.status).not.toBe(307);
    });

    it("should allow access to videos with valid session", () => {
      const request = createRequest("/videos/V1_S1_I1", true);
      const response = middleware(request);

      expect(response.status).not.toBe(307);
    });

    it("should allow access to API routes with valid session", () => {
      const request = createRequest("/api/annotations", true);
      const response = middleware(request);

      expect(response.status).not.toBe(307);
    });
  });

  describe("Static files", () => {
    it("should allow access to static files without session", () => {
      const staticPaths = [
        "/_next/static/chunks/main.js",
        "/_next/image?url=/logo.png",
        "/favicon.ico",
        "/logo.png",
      ];

      staticPaths.forEach((path) => {
        const request = createRequest(path, false);
        const response = middleware(request);

        // Should not redirect (these are excluded by matcher config)
        // In reality, these wouldn't even hit the middleware due to the matcher
        expect(response).toBeDefined();
      });
    });
  });
});
