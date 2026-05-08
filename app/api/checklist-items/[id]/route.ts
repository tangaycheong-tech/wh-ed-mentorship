// app/api/checklist-items/[id]/route.ts — PATCH toggle item completion
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const { is_completed } = body;

  // Verify the checklist belongs to a mentorship where this user is mentor or mentee
  const item = await sql`
    SELECT ci.*, c.mentor_id, c.mentee_id
    FROM checklist_items ci
    JOIN checklists c ON c.id = ci.checklist_id
    WHERE ci.id = ${id}
  ` as any[];
  if (item.length === 0) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const { mentor_id, mentee_id } = item[0];
  if (mentor_id !== session.id && mentee_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const completed_at = is_completed ? new Date().toISOString() : null;
  const updated = await sql`
    UPDATE checklist_items SET is_completed = ${is_completed}, completed_at = ${completed_at}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  ` as any[];

  return NextResponse.json({ success: true, data: updated[0] });
}