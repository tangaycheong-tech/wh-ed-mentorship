// app/api/admin/training/[slug]/route.ts — GET one module, PATCH update (admin only)
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = params;
  const rows = await sql`
    SELECT
      id, slug, title, description, module_order, duration_minutes,
      slides_url, audio_url, video_url, notebooklm_guide,
      created_at, updated_at,
      pre_read_content, speaker_notes, trainer_notes
    FROM training_modules
    WHERE slug = ${slug}
  ` as any[];

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: rows[0] });
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = params;
  const body = await req.json();
  const {
    pre_read_content,
    speaker_notes,
    trainer_notes,
    title,
    description,
    module_order,
    duration_minutes,
    slides_url,
    audio_url,
  } = body;

  // Collect only provided fields
  const cols: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if (pre_read_content !== undefined) { cols.push(`pre_read_content = $${i++}`); vals.push(pre_read_content); }
  if (speaker_notes !== undefined)    { cols.push(`speaker_notes = $${i++}`);    vals.push(speaker_notes); }
  if (trainer_notes !== undefined)     { cols.push(`trainer_notes = $${i++}`);     vals.push(trainer_notes); }
  if (title !== undefined)             { cols.push(`title = $${i++}`);             vals.push(title); }
  if (description !== undefined)       { cols.push(`description = $${i++}`);       vals.push(description); }
  if (module_order !== undefined)      { cols.push(`module_order = $${i++}`);      vals.push(module_order); }
  if (duration_minutes !== undefined)  { cols.push(`duration_minutes = $${i++}`);  vals.push(duration_minutes); }
  if (slides_url !== undefined)       { cols.push(`slides_url = $${i++}`);       vals.push(slides_url); }
  if (audio_url !== undefined)        { cols.push(`audio_url = $${i++}`);        vals.push(audio_url); }

  if (cols.length === 0) {
    return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
  }

  cols.push(`updated_at = $${i++}`);
  vals.push(new Date().toISOString());
  vals.push(slug);
  const setStr = cols.join(", ");

  // Use raw SQL (same pattern as admin/users/[id]/route.ts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await sql(
    `UPDATE training_modules SET ${setStr} WHERE slug = $${i} RETURNING *`,
    vals
  )) as any[];

  if (result.length === 0) {
    return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: result[0] });
}