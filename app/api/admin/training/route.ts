// app/api/admin/training/route.ts — GET all training modules
// Public endpoint — matches the deployed /ed_mentor/api/training response shape
import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const modules = await sql`
      SELECT
        id, slug, title, description, module_order, duration_minutes,
        slides_url, audio_url, video_url, notebooklm_guide,
        created_at, updated_at,
        pre_read_content, speaker_notes, trainer_notes
      FROM training_modules
      ORDER BY module_order ASC, created_at DESC
    ` as any[];

    return NextResponse.json(modules);
  } catch (err) {
    console.error("[training] GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load training modules" },
      { status: 500 }
    );
  }
}