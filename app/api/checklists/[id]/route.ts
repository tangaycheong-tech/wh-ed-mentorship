// app/api/checklists/[id]/route.ts — PATCH update checklist, DELETE
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const { status, title, description, due_date } = body;

  // Verify ownership (mentor who created it) or admin
  const existing = await sql`SELECT mentor_id FROM checklists WHERE id = ${id}` as any[];
  if (existing.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (existing[0].mentor_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Build parameterized update — only these columns are allowed
  const allowed: Record<string, unknown> = {};
  if (status !== undefined) allowed.status = status;
  if (title !== undefined) allowed.title = title;
  if (description !== undefined) allowed.description = description;
  if (due_date !== undefined) allowed.due_date = due_date;
  allowed.updated_at = new Date().toISOString();

  const keys = Object.keys(allowed);
  if (keys.length === 0) return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map(k => allowed[k]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await sql(`UPDATE checklists SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`, values as any)) as any[];

  return NextResponse.json({ success: true, data: result[0] });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const existing = await sql`SELECT mentor_id FROM checklists WHERE id = ${id}` as any[];
  if (existing.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (existing[0].mentor_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await sql`DELETE FROM checklists WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}