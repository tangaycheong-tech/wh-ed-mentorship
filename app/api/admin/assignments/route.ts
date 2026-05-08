// app/api/admin/assignments/route.ts — GET all, POST create, DELETE
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const pairs = await sql`
    SELECT m.id, m.status, m.created_at,
      mentor.id as mentor_id, mentor.name as mentor_name, mentor.email as mentor_email,
      mentee.id as mentee_id, mentee.name as mentee_name, mentee.email as mentee_email
    FROM mentorships m
    JOIN users mentor ON mentor.id = m.mentor_id
    JOIN users mentee ON mentee.id = m.mentee_id
    ORDER BY m.created_at DESC
  ` as any[];
  return NextResponse.json({ success: true, data: pairs });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { mentor_id, mentee_id } = body;

  if (!mentor_id || !mentee_id) return NextResponse.json({ success: false, error: "mentor_id and mentee_id required" }, { status: 400 });

  // Verify mentor and mentee exist with correct roles
  const mentorResult = await sql`SELECT id, role FROM users WHERE id = ${mentor_id}` as any[];
  const menteeResult = await sql`SELECT id, role FROM users WHERE id = ${mentee_id}` as any[];
  const mentor = mentorResult as { id: string; role: string }[];
  const mentee = menteeResult as { id: string; role: string }[];
  if (mentor.length === 0 || mentor[0].role !== "mentor") return NextResponse.json({ success: false, error: "Invalid mentor" }, { status: 400 });
  if (mentee.length === 0 || mentee[0].role !== "mentee") return NextResponse.json({ success: false, error: "Invalid mentee" }, { status: 400 });

  try {
    const result = await sql`
      INSERT INTO mentorships (mentor_id, mentee_id, status)
      VALUES (${mentor_id}, ${mentee_id}, 'active')
      RETURNING *
    ` as any[];
    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json({ success: false, error: "Assignment already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Failed to create assignment" }, { status: 500 });
  }
}