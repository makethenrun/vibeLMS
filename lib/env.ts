import "server-only";

/**
 * Server-side environment access. Validated lazily so that a missing variable
 * produces a clear runtime error instead of a cryptic crash, without breaking
 * the build when envs are injected at deploy time.
 */
interface ServerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STORAGE_BUCKET: string;
  AUTH_SECRET: string;
  SESSION_MAX_AGE: number;
}

const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

let cached: ServerEnv | null = null;

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Copy .env.example to .env.local and fill in the values.",
    );
  }
  return value;
}

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const rawMaxAge = process.env.AUTH_SESSION_MAX_AGE;
  const parsedMaxAge = rawMaxAge ? Number.parseInt(rawMaxAge, 10) : DEFAULT_SESSION_MAX_AGE;

  cached = {
    SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "plms",
    AUTH_SECRET: required("AUTH_SECRET", process.env.AUTH_SECRET),
    SESSION_MAX_AGE:
      Number.isFinite(parsedMaxAge) && parsedMaxAge > 0 ? parsedMaxAge : DEFAULT_SESSION_MAX_AGE,
  };

  return cached;
}
