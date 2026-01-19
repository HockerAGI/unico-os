import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente server-side con SERVICE ROLE.
 * OJO: este archivo NO debe importarse en componentes client.
 */
export function serverSupabase() {
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

/**
 * Verifica token real y regresa el user.
 * - token: access_token (Bearer)
 */
export async function requireUserFromToken(sb, token) {
  if (!token) return { user: null, error: "Missing Bearer token" };

  // supabase-js v2 soporta auth.getUser(token)
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: error?.message || "Invalid token" };

  return { user: data.user, error: null };
}