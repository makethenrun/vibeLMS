"use server";

import { redirect } from "next/navigation";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Проверьте правильность полей", parsed.error.flatten().fieldErrors);
  }

  try {
    const login = parsed.data.login.toLowerCase();
    const db = createServerSupabaseClient();
    const { data: user, error } = await db
      .from("users")
      .select("id, login, password_hash, role")
      .eq("login", login)
      .maybeSingle();

    if (error) return fail(getErrorMessage(error));
    if (!user) return fail("Неверный логин или пароль");

    const valid = await verifyPassword(parsed.data.password, user.password_hash);
    if (!valid) return fail("Неверный логин или пароль");

    await createSession({ userId: user.id, login: user.login, role: user.role });
    return ok();
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Проверьте правильность полей", parsed.error.flatten().fieldErrors);
  }

  try {
    const db = createServerSupabaseClient();

    // Single-tenant instance: only the first account may self-register (as the
    // TUTOR/owner). Afterwards, accounts are created from within the app.
    const { count, error: countError } = await db
      .from("users")
      .select("id", { count: "exact", head: true });
    if (countError) return fail(getErrorMessage(countError));
    if ((count ?? 0) > 0) {
      return fail("Регистрация закрыта. Обратитесь к преподавателю для получения доступа.");
    }

    const login = parsed.data.login.toLowerCase();
    const passwordHash = await hashPassword(parsed.data.password);

    const { data: user, error } = await db
      .from("users")
      .insert({ login, password_hash: passwordHash, role: "TUTOR" })
      .select("id, login, role")
      .single();

    if (error || !user) {
      if (error?.code === "23505") return fail("Такой логин уже занят");
      return fail(error ? getErrorMessage(error) : "Не удалось создать аккаунт. Попробуйте ещё раз.");
    }

    await createSession({ userId: user.id, login: user.login, role: user.role });
    return ok();
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
