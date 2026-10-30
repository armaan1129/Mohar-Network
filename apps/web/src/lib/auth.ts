import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user with their profile, business membership and MFA level. One per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, membership, aal] = await Promise.all([
    supabase.from("profiles").select("role, display_name").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("business_users")
      .select("role, business_id, businesses(name, status)")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  return {
    supabase,
    user,
    isNetworkAdmin: profile.data?.role === "network_admin",
    displayName: profile.data?.display_name ?? null,
    membership: membership.data,
    aal: aal.data?.currentLevel ?? "aal1",
  };
});

/** Network admin with a TOTP-verified (aal2) session. Anyone else never learns /admin exists. */
export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (!viewer.isNetworkAdmin) notFound();
  if (viewer.aal !== "aal2") redirect("/admin/mfa");
  return viewer;
}

/** Owner or cashier of a business. */
export async function requireMember() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/app");
  return viewer;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined, fallback = "/app"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  return next;
}
