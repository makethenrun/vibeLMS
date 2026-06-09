import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getCurrentUser, type CurrentStudent, type CurrentUser } from "./current-user";

/** Page-loader guard: requires any authenticated user or redirects to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Page-loader guard: requires a TUTOR or redirects to /dashboard. */
export async function requireTutor(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "TUTOR") redirect("/dashboard");
  return user;
}

/** Page-loader guard: requires a STUDENT with a linked profile. */
export async function requireStudent(): Promise<CurrentStudent> {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/dashboard");

  const db = createServerSupabaseClient();
  const { data } = await db
    .from("students")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) redirect("/login");
  return { user, studentId: data.id, fullName: data.full_name };
}

/**
 * Server-Action guard: returns the TUTOR or null (no redirect) so the action
 * can return a typed failure result instead of throwing a redirect.
 */
export async function getTutorOrNull(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user && user.role === "TUTOR" ? user : null;
}

/** Server-Action guard: returns the current student profile or null. */
export async function getStudentOrNull(): Promise<CurrentStudent | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") return null;

  const db = createServerSupabaseClient();
  const { data } = await db
    .from("students")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return { user, studentId: data.id, fullName: data.full_name };
}
