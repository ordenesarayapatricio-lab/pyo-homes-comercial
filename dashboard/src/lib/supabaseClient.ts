import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el entorno.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Header Authorization con el JWT de la sesión actual, para los endpoints propios
// de server.js (/api/webhooks/*) que exigen que quien llama esté logueado.
export async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
