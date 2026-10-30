import "server-only";
import type { createClient } from "@/lib/supabase/server";

export type FormOptions = Awaited<ReturnType<typeof businessFormOptions>>;

/** Cities, categories, and which (city, category) slots an active or suspended business holds. */
export async function businessFormOptions(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: cities }, { data: categories }, { data: held }] = await Promise.all([
    supabase.from("cities").select("id, code, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("businesses")
      .select("city_id, category_id")
      .in("status", ["active", "suspended"]),
  ]);
  return {
    cities: cities ?? [],
    categories: categories ?? [],
    held: (held ?? []).map((h) => `${h.city_id}:${h.category_id}`),
  };
}
