// ============================================================
// middleware.ts — Auth-protected route middleware (Next.js 14)
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-please"
);

const COOKIE_NAME = "wh-ed-session";

// Routes that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
];

// Routes that authenticated users should be redirected away from
const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and Next.js internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      // Token invalid or expired
    }
  }

  // If user is authenticated and on a public auth page, redirect to dashboard
  if (isAuthenticated && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If user is not authenticated and path is not public, redirect to login
  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname) && pathname !== "/") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
