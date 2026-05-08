// app/api/checklists/route.ts — POST create checklist
// app/api/checklists/[id]/route.ts — PATCH/DELETE checklist
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "mentor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { mentorship_id, title, description, due_date, items, mentee_id } = body;

  if (!title || !mentee_id) {
    return NextResponse.json({ success: false, error: "Title and mentee_id required" }, { status: 400 });
  }

  // Verify mentor is assigned to this mentee
  const assignment = await sql`
    SELECT id FROM mentorships
    WHERE mentor_id = ${session.id} AND mentee_id = ${mentee_id} AND status = 'active'
  ` as any[];
  if (assignment.length === 0) {
    return NextResponse.json({ success: false, error: "Not assigned to this mentee" }, { status: 403 });
  }

  const checklists = await sql`
    INSERT INTO checklists (mentorship_id, mentor_id, mentee_id, title, description, due_date)
    VALUES (${assignment[0].id}, ${session.id}, ${mentee_id}, ${title}, ${description || null}, ${due_date || null})
    RETURNING *
  ` as any[];
  const checklist = checklists[0];

  if (items && Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      await sql`
        INSERT INTO checklist_items (checklist_id, content, order_index)
        VALUES (${checklist.id}, ${items[i].content}, ${i})
      `;
    }
  }

  return NextResponse.json({ success: true, data: checklist }, { status: 201 });
}