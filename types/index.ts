// ============================================================
// types/index.ts — Shared TypeScript types for WH-ED Mentorship
// ============================================================

// ---- User / Auth -------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = "mentor" | "mentee" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ---- Mentorship -------------------------------------------------

export type MentorshipStatus = "pending" | "active" | "paused" | "completed" | "cancelled";

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: MentorshipStatus;
  goals?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  // joined relations (when hydrating)
  mentor?: User;
  mentee?: User;
}

// ---- Sessions ---------------------------------------------------

export type SessionStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";

export interface Session {
  id: string;
  mentorship_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  meeting_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ---- Messages ---------------------------------------------------

export interface Message {
  id: string;
  mentorship_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
  sender?: Pick<User, "id" | "name" | "avatar_url">;
}

// ---- Resources --------------------------------------------------

export interface Resource {
  id: string;
  mentorship_id: string;
  uploaded_by: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size_bytes?: number;
  created_at: string;
}

// ---- Checklists -------------------------------------------------

export interface Checklist {
  id: string;
  mentorship_id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// ---- Reflections ------------------------------------------------

export interface Reflection {
  id: string;
  user_id: string;
  mentorship_id?: string;
  title: string;
  content: string;
  mood?: string;
  created_at: string;
  updated_at: string;
}

// ---- Goals ------------------------------------------------------

export type GoalStatus = "not_started" | "in_progress" | "completed" | "abandoned";

export interface Goal {
  id: string;
  user_id: string;
  mentorship_id?: string;
  title: string;
  description?: string;
  target_date?: string;
  status: GoalStatus;
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
}

// ---- Training Modules -------------------------------------------

export interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description?: string;
  module_order: number;
  duration_minutes?: number;
  slides_url?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  notebooklm_guide?: string | null;
  pre_read_content?: string | null;
  speaker_notes?: string | null;
  trainer_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Assignments ------------------------------------------------

export type AssignmentStatus = "pending" | "submitted" | "reviewed" | "completed";

export interface Assignment {
  id: string;
  mentorship_id: string;
  assigned_by: string;
  assigned_to: string;
  title: string;
  description?: string;
  due_date?: string;
  status: AssignmentStatus;
  submission_url?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

// ---- Form / Action types ----------------------------------------

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface CreateMentorshipData {
  mentor_id: string;
  goals?: string;
}

export interface ScheduleSessionData {
  mentorship_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link?: string;
}

export interface CreateChecklistData {
  mentorship_id: string;
  title: string;
  description?: string;
}

export interface CreateChecklistItemData {
  content: string;
  order_index?: number;
}

export interface UpdateChecklistItemData {
  is_completed?: boolean;
  content?: string;
}

export interface CreateReflectionData {
  mentorship_id?: string;
  title: string;
  content: string;
  mood?: string;
}

export interface CreateGoalData {
  mentorship_id?: string;
  title: string;
  description?: string;
  target_date?: string;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  target_date?: string;
  status?: GoalStatus;
  progress?: number;
}

export interface CreateAssignmentData {
  mentorship_id: string;
  assigned_to: string;
  title: string;
  description?: string;
  due_date?: string;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  due_date?: string;
  status?: AssignmentStatus;
  submission_url?: string;
  feedback?: string;
}

// ---- API Response helpers ---------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
