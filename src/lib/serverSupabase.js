import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Actualizado para soportar el nuevo estándar Secret Key de Supabase
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente server-side con SECRET KEY.
 * OJO: este archivo NO debe importarse en componentes client.
 */
export function serverSupabase() {
  if (!url || !secretKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

/**
 * Verifica token real y regresa el user.
 * - token: access_token (Bearer)
 */
export async function requireUserFromToken(sb, token) {
  if (!token) return { user: null, error: "Missing Bearer token" };

  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: error?.message || "Invalid token" };

  return { user: data.user, error: null };
}