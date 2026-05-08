// app/api/admin/users/route.ts — GET all users, POST create user
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const users = await sql`SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC` as any[];
  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { email, password, name, role } = body;

  if (!email || !password || !name || !role) {
    return NextResponse.json({ success: false, error: "All fields required" }, { status: 400 });
  }
  if (!["mentor", "mentee", "admin"].includes(role)) {
    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ success: false, error: "Password min 8 chars" }, { status: 400 });
  }

  const { hashSync } = await import("bcryptjs");
  const passwordHash = hashSync(password, 12);

  try {
    const users = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email}, ${passwordHash}, ${name}, ${role})
      RETURNING id, email, name, role, created_at, updated_at
    ` as any[];
    return NextResponse.json({ success: true, data: users[0] }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}