// ============================================================
// app/api/mentor/[id]/route.ts — GET /api/mentor/:id (mentor profile)
// ============================================================

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

// GET /api/mentor/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const rows = await sql`
      SELECT
        u.id, u.email, u.name, u.role, u.avatar_url, u.bio, u.created_at, u.updated_at,
        COUNT(DISTINCT m.id) as total_mentorships,
        COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.id END) as active_mentorships,
        COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_mentorships,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions
      FROM users u
      LEFT JOIN mentorships m ON u.id = m.mentor_id
      LEFT JOIN sessions s ON m.id = s.mentorship_id
      WHERE u.id = ${id} AND u.role = 'mentor'
      GROUP BY u.id
    ` as any[];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Mentor not found" },
        { status: 404 }
      );
    }

    const row = rows[0];
    const mentor = {
      ...row,
      total_mentorships: parseInt(row.total_mentorships),
      active_mentorships: parseInt(row.active_mentorships),
      completed_mentorships: parseInt(row.completed_mentorships),
      total_sessions: parseInt(row.total_sessions),
      completed_sessions: parseInt(row.completed_sessions),
    };

    return NextResponse.json({ success: true, data: { mentor } });
  } catch (error) {
    console.error("Get mentor error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
