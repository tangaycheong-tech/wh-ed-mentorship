// app/api/reflections/[id]/route.ts — PATCH/DELETE own reflection
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();

  const existing = await sql`SELECT user_id FROM reflections WHERE id = ${id}` as any[];
  if (existing.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (existing[0].user_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { title, content, mood, is_private } = body;
  const allowed: Record<string, unknown> = {};
  if (title !== undefined) allowed.title = title;
  if (content !== undefined) allowed.content = content;
  if (mood !== undefined) allowed.mood = mood;
  if (is_private !== undefined) allowed.is_private = is_private;
  allowed.updated_at = new Date().toISOString();

  const keys = Object.keys(allowed);
  if (keys.length === 0) return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map(k => allowed[k]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await sql(`UPDATE reflections SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`, values as any)) as any[];
  return NextResponse.json({ success: true, data: result[0] });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const existing = await sql`SELECT user_id FROM reflections WHERE id = ${id}` as any[];
  if (existing.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (existing[0].user_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await sql`DELETE FROM reflections WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}