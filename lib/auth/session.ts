import "server-only";

import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/env";
import { SESSION_COOKIE_NAME, signSession, verifySession, type SessionPayload } from "./jwt";

export type { SessionPayload };

/** Creates a signed session cookie for the given user. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const env = getServerEnv();
  const token = await signSession(payload, env.SESSION_MAX_AGE);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.SESSION_MAX_AGE,
  });
}

/** Reads and verifies the current session, or null if not authenticated. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Clears the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
