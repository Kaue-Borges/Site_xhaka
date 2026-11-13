import { getSupabase } from "./supabase";

export async function testSupabase() {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error("Supabase não configurado.") };
  try {
    return await supabase.from("cities").select("*").limit(1);
  } catch (error) {
    return { data: null, error };
  }
}
