// app/api/goals/[id]/route.ts — PATCH/DELETE own goal
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();

  const existing = await sql`SELECT user_id FROM goals WHERE id = ${id}` as any[];
  if (existing.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (existing[0].user_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { title, description, target_date, status, progress } = body;
  const allowed: Record<string, unknown> = {};
  if (title !== undefined) allowed.title = title;
  if (description !== undefined) allowed.description = description;
  if (target_date !== undefined) allowed.target_date = target_date;
  if (status !== undefined) allowed.status = status;
  if (progress !== undefined) allowed.progress = progress;
  allowed.updated_at = new Date().toISOString();

  const keys = Object.keys(allowed);
  if (keys.length === 0) return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map(k => allowed[k]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await sql(`UPDATE goals SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`, values as any)) as any[];
  return NextResponse.json({ success: true, data: result[0] });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const existing = await sql`SELECT user_id FROM goals WHERE id = ${id}` as any[];
  if (existing.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (existing[0].user_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await sql`DELETE FROM goals WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}