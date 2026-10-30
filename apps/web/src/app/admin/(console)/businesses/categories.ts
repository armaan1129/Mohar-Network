import "server-only";
import type { createClient } from "@/lib/supabase/server";

/** Categories with a flag for those already held by an active or suspended business. */
export async function categoryOptions(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: categories }, { data: held }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("businesses").select("category_id").in("status", ["active", "suspended"]),
  ]);
  const taken = new Set(held?.map((b) => b.category_id));
  return (categories ?? []).map((c) => ({ ...c, taken: taken.has(c.id) }));
}
