// app/api/admin/assignments/[id]/route.ts — DELETE assignment
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM mentorships WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
}