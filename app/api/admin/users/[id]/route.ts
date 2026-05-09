// app/api/admin/users/[id]/route.ts — PATCH/DELETE user
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const { email, name, role } = body;

  const updates: Record<string, unknown> = {};
  if (email !== undefined) updates.email = email;
  if (name !== undefined) updates.name = name;
  if (role !== undefined) {
    if (!["mentor", "mentee", "admin"].includes(role)) return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    updates.role = role;
  }
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length === 0) return NextResponse.json({ success: false, error: "No fields" }, { status: 400 });

  // Only these columns can be updated — build query with only provided fields
  const cols: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (updates.email !== undefined) { cols.push(`email = $${i++}`); vals.push(updates.email); }
  if (updates.name !== undefined) { cols.push(`name = $${i++}`); vals.push(updates.name); }
  if (updates.role !== undefined) { cols.push(`role = $${i++}`); vals.push(updates.role); }
  cols.push(`updated_at = $${i++}`); vals.push(updates.updated_at);
  vals.push(id);
  const setStr = cols.join(", ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await sql(`UPDATE users SET ${setStr} WHERE id = $${i} RETURNING id, email, name, role, created_at, updated_at`, vals)) as any[];
  if (result.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: result[0] });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  if (id === session.id) return NextResponse.json({ success: false, error: "Cannot delete yourself" }, { status: 400 });

  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}