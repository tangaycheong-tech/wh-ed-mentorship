// ============================================================
// app/api/users/route.ts — GET /api/users, POST /api/users
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import type { User } from "@/types";

// GET /api/users — List users (admin only) or search mentors/mentees
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const role = searchParams.get("role"); // optional filter: mentor | mentee
    const search = searchParams.get("search"); // optional name/email search
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    let query = sql`
      SELECT id, email, name, role, avatar_url, bio, created_at, updated_at
      FROM users
      WHERE 1=1
    `;

    if (role) {
      query = sql`${query} AND role = ${role}`;
    }

    if (search) {
      query = sql`${query} AND (name ILIKE ${"%" + search + "%"} OR email ILIKE ${"%" + search + "%"})`;
    }

    const countQuery = sql`SELECT COUNT(*) as total FROM (${query}) sub`;

    query = sql`${query} ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`;

    const [rowsResult, countResultResult] = await Promise.all([query, countQuery]);
    const rows = rowsResult as any[];
    const countResult = countResultResult as any[];
    const total = parseInt(countResult[0]?.total || "0");

    return NextResponse.json({
      success: true,
      data: rows as User[],
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users — Admin-only create user
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, role, bio, avatar_url } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "Email, password, name, and role are required" },
        { status: 400 }
      );
    }

    if (!["mentor", "mentee", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role must be one of: mentor, mentee, admin" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { hashSync } = await import("bcryptjs");
    const passwordHash = hashSync(password, 12);

    const existing = await sql`SELECT id FROM users WHERE email = ${email}` as any[];
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const rows = await sql`
      INSERT INTO users (email, password_hash, name, role, bio, avatar_url)
      VALUES (${email}, ${passwordHash}, ${name}, ${role}, ${bio ?? null}, ${avatar_url ?? null})
      RETURNING id, email, name, role, avatar_url, bio, created_at, updated_at
    ` as any[];

    return NextResponse.json(
      { success: true, data: { user: rows[0] as User } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
