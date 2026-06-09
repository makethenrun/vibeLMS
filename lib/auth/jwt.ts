import { SignJWT, jwtVerify } from "jose";

import type { UserRole } from "@/lib/db/database.types";

/**
 * Edge-safe session token helpers. This module intentionally avoids
 * `next/headers` and `server-only` so it can be imported from middleware
 * (Edge runtime) as well as Node server code.
 */
export const SESSION_COOKIE_NAME = "plms_session";

export interface SessionPayload {
  userId: string;
  login: string;
  role: UserRole;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error("Missing required environment variable: AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, maxAgeSeconds: number): Promise<string> {
  const expirationTime = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  return new SignJWT({ login: payload.login, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const { sub, login, role } = payload;
    if (typeof sub !== "string" || typeof login !== "string") return null;
    if (role !== "TUTOR" && role !== "STUDENT") return null;
    return { userId: sub, login, role };
  } catch {
    return null;
  }
}
