// app/api/reflections/route.ts — GET list, POST create
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let reflections;
  if (session.role === "admin") {
    // Admin sees all reflections
    reflections = await sql`SELECT * FROM reflections ORDER BY created_at DESC LIMIT 100`;
  } else if (session.role === "mentor") {
    // Mentor sees own reflections + their mentees' non-private reflections
    reflections = await sql`
      SELECT r.*, u.name as user_name
      FROM reflections r
      JOIN users u ON u.id = r.user_id
      WHERE r.user_id = ${session.id}
      OR (r.user_id IN (
        SELECT mentee_id FROM mentorships WHERE mentor_id = ${session.id} AND status = 'active'
      ) AND r.is_private = false)
      ORDER BY r.created_at DESC
      LIMIT 100
    `;
  } else {
    // Mentee sees own reflections + mentor's reflections shared with them (is_private = false)
    reflections = await sql`
      SELECT r.*, u.name as user_name
      FROM reflections r
      JOIN users u ON u.id = r.user_id
      WHERE r.user_id = ${session.id}
      OR (r.user_id IN (
        SELECT mentor_id FROM mentorships WHERE mentee_id = ${session.id} AND status = 'active'
      ) AND r.is_private = false)
      ORDER BY r.created_at DESC
      LIMIT 100
    `;
  }

  return NextResponse.json({ success: true, data: reflections });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, content, mood, is_private, mentorship_id } = body;

  if (!title || !content) {
    return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
  }

  const reflections = await sql`
    INSERT INTO reflections (user_id, mentorship_id, title, content, mood, is_private)
    VALUES (
      ${session.id},
      ${mentorship_id || null},
      ${title},
      ${content},
      ${mood || null},
      ${is_private !== undefined ? is_private : true}
    )
    RETURNING *
  ` as any[];

  return NextResponse.json({ success: true, data: reflections[0] }, { status: 201 });
}