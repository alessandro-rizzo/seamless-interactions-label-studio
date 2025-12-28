import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth/signin");
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");

  // Create response
  const response = NextResponse.next();

  // Add pathname to headers for use in layout
  response.headers.set("x-pathname", request.nextUrl.pathname);

  // Allow access to sign-in page and auth API routes
  if (isAuthRoute || isApiAuthRoute) {
    return response;
  }

  // Check for session cookie (set by NextAuth)
  // Note: Cookie name differs between HTTP (localhost) and HTTPS (production)
  const sessionCookie =
    request.cookies.get("__Secure-authjs.session-token") || // HTTPS (production)
    request.cookies.get("authjs.session-token"); // HTTP (localhost)

  // Redirect unauthenticated users to sign-in
  if (!sessionCookie) {
    const signInUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)",
  ],
};
