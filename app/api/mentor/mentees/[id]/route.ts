// app/api/mentor/mentees/[id]/route.ts — GET or POST checklists for a mentee
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "mentor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  // Verify this mentee is assigned to this mentor
  const assignment = await sql`
    SELECT id FROM mentorships
    WHERE mentor_id = ${session.id} AND mentee_id = ${id} AND status = 'active'
  ` as any[];
  if (assignment.length === 0) {
    return NextResponse.json({ success: false, error: "Not assigned to this mentee" }, { status: 403 });
  }
  const checklists = await sql`
    SELECT c.*, ci.id as item_id, ci.content as item_content, ci.is_completed, ci.order_index
    FROM checklists c
    LEFT JOIN checklist_items ci ON ci.checklist_id = c.id
    WHERE c.mentor_id = ${session.id} AND c.mentee_id = ${id}
    ORDER BY c.created_at DESC
  ` as any[];
  return NextResponse.json({ success: true, data: checklists });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "mentor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  const body = await req.json();
  const { title, description, due_date, items } = body;

  if (!title) {
    return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
  }

  // Verify assignment
  const assignment = await sql`
    SELECT id FROM mentorships
    WHERE mentor_id = ${session.id} AND mentee_id = ${id} AND status = 'active'
  ` as any[];
  if (assignment.length === 0) {
    return NextResponse.json({ success: false, error: "Not assigned to this mentee" }, { status: 403 });
  }

  // Get mentorship id
  const mentorship = assignment[0];

  const checklists = await sql`
    INSERT INTO checklists (mentorship_id, mentor_id, mentee_id, title, description, due_date)
    VALUES (${mentorship.id}, ${session.id}, ${id}, ${title}, ${description || null}, ${due_date || null})
    RETURNING *
  ` as any[];

  const checklist = checklists[0];

  // Insert checklist items if provided
  if (items && Array.isArray(items) && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await sql`
        INSERT INTO checklist_items (checklist_id, content, order_index)
        VALUES (${checklist.id}, ${item.content}, ${i})
      `;
    }
  }

  return NextResponse.json({ success: true, data: checklist }, { status: 201 });
}