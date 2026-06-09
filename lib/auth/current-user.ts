import "server-only";

import { createServerSupabaseClient } from "@/lib/db/supabase";
import type { UserRole } from "@/lib/db/database.types";
import { getSession } from "./session";

export interface CurrentUser {
  id: string;
  login: string;
  role: UserRole;
}

export interface CurrentStudent {
  user: CurrentUser;
  studentId: string;
  fullName: string;
}

/** Resolves the authenticated user from the session and verifies it still exists. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("users")
    .select("id, login, role")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, login: data.login, role: data.role };
}

/** Resolves the student profile linked to the current STUDENT user, if any. */
export async function getCurrentStudent(): Promise<CurrentStudent | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") return null;

  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("students")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { user, studentId: data.id, fullName: data.full_name };
}
