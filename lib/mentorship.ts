// ============================================================
// lib/mentorship.ts — Mentorship business logic
// ============================================================

import sql from "./db";
import type {
  Mentorship,
  Session,
  Message,
  Resource,
  CreateMentorshipData,
  ScheduleSessionData,
  MentorshipStatus,
} from "@/types";

// ---- Mentorships ------------------------------------------------

export async function getMentorshipById(
  id: string
): Promise<Mentorship | null> {
  const rows = await sql`
    SELECT m.*,
      mentor.id AS mentor_id_join, mentor.name AS mentor_name, mentor.avatar_url AS mentor_avatar,
      mentee.id AS mentee_id_join, mentee.name AS mentee_name, mentee.avatar_url AS mentee_avatar
    FROM mentorships m
    JOIN users mentor ON m.mentor_id = mentor.id
    JOIN users mentee ON m.mentee_id = mentee.id
    WHERE m.id = ${id}
  ` as any[];
  if (rows.length === 0) return null;
  return hydrateMentorship(rows[0]);
}

export async function getMentorshipsForUser(
  userId: string
): Promise<Mentorship[]> {
  const rows = await sql`
    SELECT m.*,
      mentor.name AS mentor_name, mentor.avatar_url AS mentor_avatar,
      mentee.name AS mentee_name, mentee.avatar_url AS mentee_avatar
    FROM mentorships m
    JOIN users mentor ON m.mentor_id = mentor.id
    JOIN users mentee ON m.mentee_id = mentee.id
    WHERE m.mentor_id = ${userId} OR m.mentee_id = ${userId}
    ORDER BY m.updated_at DESC
  ` as any[];
  return rows.map(hydrateMentorship);
}

export async function createMentorship(
  menteeId: string,
  data: CreateMentorshipData
): Promise<Mentorship> {
  const rows = await sql`
    INSERT INTO mentorships (mentor_id, mentee_id, status, goals)
    VALUES (${data.mentor_id}, ${menteeId}, 'pending', ${data.goals ?? null})
    RETURNING *
  ` as any[];
  return rows[0] as Mentorship;
}

export async function updateMentorshipStatus(
  id: string,
  status: MentorshipStatus
): Promise<Mentorship> {
  const rows = await sql`
    UPDATE mentorships
    SET status = ${status},
        started_at = CASE WHEN ${status} = 'active' AND started_at IS NULL THEN NOW() ELSE started_at END,
        ended_at   = CASE WHEN ${status} IN ('completed','cancelled') THEN NOW() ELSE ended_at END,
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  ` as any[];
  return rows[0] as Mentorship;
}

// ---- Sessions ---------------------------------------------------

export async function getSessionsForMentorship(
  mentorshipId: string
): Promise<Session[]> {
  const rows = await sql`
    SELECT * FROM sessions WHERE mentorship_id = ${mentorshipId} ORDER BY scheduled_at DESC
  ` as any[];
  return rows as Session[];
}

export async function getUpcomingSessions(
  userId: string
): Promise<Session[]> {
  const rows = await sql`
    SELECT s.* FROM sessions s
    JOIN mentorships m ON s.mentorship_id = m.id
    WHERE (m.mentor_id = ${userId} OR m.mentee_id = ${userId})
      AND s.scheduled_at > NOW() AND s.status = 'scheduled'
    ORDER BY s.scheduled_at ASC
  ` as any[];
  return rows as Session[];
}

export async function scheduleSession(
  data: ScheduleSessionData
): Promise<Session> {
  const rows = await sql`
    INSERT INTO sessions (mentorship_id, title, description, scheduled_at, duration_minutes, meeting_link)
    VALUES (${data.mentorship_id}, ${data.title}, ${data.description ?? null},
            ${data.scheduled_at}, ${data.duration_minutes}, ${data.meeting_link ?? null})
    RETURNING *
  ` as any[];
  return rows[0] as Session;
}

export async function updateSessionStatus(
  id: string,
  status: "completed" | "cancelled",
  notes?: string
): Promise<Session> {
  const rows = await sql`
    UPDATE sessions SET status = ${status}, notes = ${notes ?? null}, updated_at = NOW()
    WHERE id = ${id} RETURNING *
  ` as any[];
  return rows[0] as Session;
}

// ---- Messages ---------------------------------------------------

export async function getMessages(
  mentorshipId: string,
  limit = 50,
  before?: string
): Promise<Message[]> {
  const rows = await sql`
    SELECT msg.*, u.name AS sender_name, u.avatar_url AS sender_avatar
    FROM messages msg
    JOIN users u ON msg.sender_id = u.id
    WHERE msg.mentorship_id = ${mentorshipId}
      ${before ? sql`AND msg.created_at < ${before}` : sql``}
    ORDER BY msg.created_at DESC LIMIT ${limit}
  ` as any[];
  return rows.map((r: any) => ({
    id: r.id,
    mentorship_id: r.mentorship_id,
    sender_id: r.sender_id,
    content: r.content,
    read_at: r.read_at,
    created_at: r.created_at,
    sender: { id: r.sender_id, name: r.sender_name, avatar_url: r.sender_avatar },
  }));
}

export async function sendMessage(
  mentorshipId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const rows = await sql`
    INSERT INTO messages (mentorship_id, sender_id, content) VALUES (${mentorshipId}, ${senderId}, ${content}) RETURNING *
  ` as any[];
  return rows[0] as Message;
}

// ---- Resources --------------------------------------------------

export async function getResources(mentorshipId: string): Promise<Resource[]> {
  const rows = await sql`SELECT * FROM resources WHERE mentorship_id = ${mentorshipId} ORDER BY created_at DESC` as any[];
  return rows as Resource[];
}

export async function createResource(data: {
  mentorship_id: string;
  uploaded_by: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size_bytes?: number;
}): Promise<Resource> {
  const rows = await sql`
    INSERT INTO resources (mentorship_id, uploaded_by, title, description, file_url, file_type, file_size_bytes)
    VALUES (${data.mentorship_id}, ${data.uploaded_by}, ${data.title},
            ${data.description ?? null}, ${data.file_url}, ${data.file_type},
            ${data.file_size_bytes ?? null}) RETURNING *
  ` as any[];
  return rows[0] as Resource;
}

// ---- Helpers ----------------------------------------------------

function hydrateMentorship(row: any): Mentorship {
  return {
    id: row.id as string,
    mentor_id: row.mentor_id as string,
    mentee_id: row.mentee_id as string,
    status: row.status as MentorshipStatus,
    goals: row.goals as string | undefined,
    started_at: row.started_at as string | undefined,
    ended_at: row.ended_at as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    mentor: {
      id: row.mentor_id as string,
      email: "",
      name: row.mentor_name as string,
      role: "mentor",
      avatar_url: row.mentor_avatar as string | undefined,
      created_at: "",
      updated_at: "",
    },
    mentee: {
      id: row.mentee_id as string,
      email: "",
      name: row.mentee_name as string,
      role: "mentee",
      avatar_url: row.mentee_avatar as string | undefined,
      created_at: "",
      updated_at: "",
    },
  };
}