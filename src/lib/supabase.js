import { createClient } from "@supabase/supabase-js";

// =========================================================
// UNICOS - CLIENT SUPABASE CONNECTION (FRONT-END)
// =========================================================

// 1. URL Fija y Permanente de Score Store
const url = "https://lpbzndnavkbpxwnlbqgb.supabase.co";

// 2. Llave Pública Fija y Permanente (sb_publishable...)
const publicKey = "sb_publishable_LCTE1og04w_Fd0WGhBTVyw_s_gFg_DB";

if (!url || !publicKey) {
  console.error("⚠️ Falla Crítica: Faltan credenciales públicas de Supabase.");
}

// 3. Exportación del cliente con caché de sesión habilitada
export const supabase = createClient(url, publicKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});