// app/api/mentor/mentees/route.ts — GET assigned mentees for current mentor
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "mentor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const mentees = await sql`
    SELECT u.id, u.email, u.name, u.role, u.created_at
    FROM users u
    JOIN mentorships m ON m.mentee_id = u.id
    WHERE m.mentor_id = ${session.id} AND m.status = 'active'
  ` as any[];
  return NextResponse.json({ success: true, data: mentees });
}