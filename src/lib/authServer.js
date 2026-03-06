import { serverSupabase, requireUserFromToken as requireUserFromTokenRaw } from "@/lib/serverSupabase";

export async function requireUserFromToken(token) {
  const sb = serverSupabase();
  const { user, error } = await requireUserFromTokenRaw(sb, token);
  if (error || !user) {
    throw new Error(error || "No autorizado");
  }
  return user;
}