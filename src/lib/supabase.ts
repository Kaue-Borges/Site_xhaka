import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_MODE } from "./demo";

let client: SupabaseClient | null | undefined;

// Creating the client with missing environment variables throws during module
// import. Keep it lazy so an unavailable backend cannot crash the UI.
export function getSupabase(): SupabaseClient | null {
  if (DEMO_MODE) return null;
  if (client !== undefined) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return (client = null);

  try {
    client = createClient(url, key);
  } catch (error) {
    console.error("Não foi possível configurar o cliente Supabase:", error);
    client = null;
  }
  return client;
}
