import { supabase } from "./supabase";

export async function testSupabase() {
  const { data, error } = await supabase
    .from("cities")
    .select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);
}