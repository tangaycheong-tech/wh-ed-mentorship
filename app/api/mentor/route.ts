// app/api/mentor/route.ts — GET /api/mentor (list mentors)
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    let query = sql`
      SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.bio, u.created_at, u.updated_at,
        COUNT(DISTINCT m.id) as mentorship_count,
        COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.id END) as active_mentorships
      FROM users u
      LEFT JOIN mentorships m ON u.id = m.mentor_id
      WHERE u.role = 'mentor'
    `;

    if (search) {
      query = sql`${query} AND (u.name ILIKE ${"%" + search + "%"} OR u.bio ILIKE ${"%" + search + "%"})`;
    }

    const countQuery = sql`SELECT COUNT(*) as total FROM (${query} GROUP BY u.id) sub`;
    query = sql`${query} GROUP BY u.id ORDER BY u.name ASC LIMIT ${limit} OFFSET ${offset}`;

    const [rowsResult, countResultResult] = await Promise.all([query, countQuery]);
    const rows = rowsResult as any[];
    const countResult = countResultResult as any[];
    const total = parseInt(countResult[0]?.total || "0");

    const mentors = rows.map((row) => ({
      ...row,
      mentorship_count: parseInt(row.mentorship_count),
      active_mentorships: parseInt(row.active_mentorships),
    }));

    return NextResponse.json({ success: true, data: mentors, total, page, limit });
  } catch (error) {
    console.error("List mentors error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}