// ============================================================
// lib/auth.ts — Server-side auth helpers (cookies + DB)
// ============================================================

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser, User, UserRole } from "@/types";
import sql from "./db";

// ---- Config -----------------------------------------------------

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-please"
);

const COOKIE_NAME = "wh-ed-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

// ---- JWT helpers ------------------------------------------------

export async function createToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

// ---- Cookie helpers ---------------------------------------------

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ---- Auth actions -----------------------------------------------

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const { hashSync } = await import("bcryptjs");

  const existing = await sql`SELECT id FROM users WHERE email = ${data.email}` as any[];
  if (existing.length > 0) {
    return { success: false, error: "A user with this email already exists" };
  }

  const passwordHash = hashSync(data.password, 12);
  const rows = await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${data.email}, ${passwordHash}, ${data.name}, ${data.role})
    RETURNING id, email, name, role, avatar_url, bio, created_at, updated_at
  ` as any[];

  const user = rows[0] as User;
  return { success: true, user };
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const { compareSync } = await import("bcryptjs");

  const rows = await sql`SELECT id, email, password_hash, name, role, avatar_url, bio, created_at, updated_at FROM users WHERE email = ${data.email}` as any[];

  if (rows.length === 0) {
    return { success: false, error: "Invalid email or password" };
  }

  const row = rows[0] as User & { password_hash: string };
  if (!compareSync(data.password, row.password_hash)) {
    return { success: false, error: "Invalid email or password" };
  }

  const { password_hash: _, ...user } = row;
  return { success: true, user: user as User };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const rows = await sql`SELECT id, email, name, role, avatar_url, bio, created_at, updated_at FROM users WHERE id = ${session.id}` as any[];

  return rows.length > 0 ? (rows[0] as User) : null;
}

export function requireAuth(redirectTo = "/login") {
  return async function () {
    const session = await getSession();
    if (!session) {
      const { redirect } = await import("next/navigation");
      redirect(redirectTo);
    }
    return session;
  };
}