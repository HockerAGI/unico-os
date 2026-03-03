import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const SUPABASE_CONFIGURED = Boolean(url && publicKey);

/**
 * Cliente público (browser):
 * - SOLO anon/publishable key
 * - Requiere RLS en Supabase
 */
export const supabase = SUPABASE_CONFIGURED
  ? createClient(url, publicKey, {
      global: { headers: { "x-client-info": "unicos-admin-web" } },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;