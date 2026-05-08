// app/api/goals/route.ts — GET list, POST create
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let goals;
  if (session.role === "admin") {
    goals = await sql`SELECT g.*, u.name as user_name FROM goals g JOIN users u ON u.id = g.user_id ORDER BY g.created_at DESC LIMIT 100`;
  } else if (session.role === "mentor") {
    // Mentor sees own goals and assigned mentees' goals
    goals = await sql`
      SELECT g.*, u.name as user_name
      FROM goals g
      JOIN users u ON u.id = g.user_id
      WHERE g.user_id = ${session.id}
      OR g.user_id IN (SELECT mentee_id FROM mentorships WHERE mentor_id = ${session.id} AND status = 'active')
      ORDER BY g.created_at DESC
    `;
  } else {
    // Mentee sees own goals
    goals = await sql`SELECT * FROM goals WHERE user_id = ${session.id} ORDER BY created_at DESC`;
  }

  return NextResponse.json({ success: true, data: goals });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "mentee") {
    return NextResponse.json({ success: false, error: "Only mentees can create goals" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, target_date, status, progress, mentorship_id } = body;

  if (!title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });

  const goals = await sql`
    INSERT INTO goals (user_id, mentorship_id, title, description, target_date, status, progress)
    VALUES (${session.id}, ${mentorship_id || null}, ${title}, ${description || null}, ${target_date || null}, ${status || 'not_started'}, ${progress || 0})
    RETURNING *
  ` as any[];

  return NextResponse.json({ success: true, data: goals[0] }, { status: 201 });
}