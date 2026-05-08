// app/api/users/[id]/route.ts — GET/PATCH/DELETE /api/users/:id
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import type { User } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const rows = await sql`SELECT id, email, name, role, avatar_url, bio, created_at, updated_at FROM users WHERE id = ${id}` as any[];
    if (rows.length === 0) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: { user: rows[0] as User } });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    if (session.role !== "admin" && session.id !== id) return NextResponse.json({ success: false, error: "You can only update your own profile" }, { status: 403 });
    const body = await request.json();
    const { name, bio, avatar_url, role } = body;
    if (role && session.role !== "admin") return NextResponse.json({ success: false, error: "Only admins can change roles" }, { status: 403 });
    if (role && !["mentor", "mentee", "admin"].includes(role)) return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });

    // Build query with only provided fields using positional params
    const cols: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (name !== undefined) { cols.push(`name = $${i++}`); vals.push(name); }
    if (bio !== undefined) { cols.push(`bio = $${i++}`); vals.push(bio); }
    if (avatar_url !== undefined) { cols.push(`avatar_url = $${i++}`); vals.push(avatar_url); }
    if (role !== undefined && session.role === "admin") { cols.push(`role = $${i++}`); vals.push(role); }
    cols.push(`updated_at = NOW()`);
    vals.push(id);
    if (cols.length === 1) return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    const setStr = cols.join(", ");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await sql(`UPDATE users SET ${setStr} WHERE id = $${i} RETURNING id, email, name, role, avatar_url, bio, created_at, updated_at`, vals as any)) as any[];
    if (result.length === 0) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: { user: result[0] as User } });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    const { id } = await params;
    if (id === session.id) return NextResponse.json({ success: false, error: "Cannot delete your own account" }, { status: 400 });
    const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING id` as any[];
    if (result.length === 0) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: { message: "User deleted" } });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}