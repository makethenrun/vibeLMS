import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";
import type { Database } from "./database.types";

export type Db = SupabaseClient<Database>;

let cached: Db | null = null;

/**
 * Returns a server-only Supabase client authenticated with the service-role
 * key. This bypasses RLS by design — pLMS performs authorization in the
 * application layer (see lib/auth). NEVER import this from a client component.
 */
export function createServerSupabaseClient(): Db {
  if (cached) return cached;

  const env = getServerEnv();
  cached = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}
