import { supabase } from "@/lib/supabaseClient";

/**
 * Alinea el cliente JS de Supabase con los tokens guardados por el login propio (email/contraseña).
 * Necesario para Storage y otros clientes que usan auth.uid().
 */
export async function ensureSupabaseSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return true;

  const access = window.localStorage.getItem("access_token");
  const refresh = window.localStorage.getItem("refresh_token");
  if (!access || !refresh) return false;

  const { error } = await supabase.auth.setSession({
    access_token: access,
    refresh_token: refresh,
  });
  return !error;
}
