"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  next: z.string().optional(),
});

export async function sendMagicLink(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({
    email: form.get("email"),
    next: form.get("next") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const next = safeNext(parsed.data.next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email.toLowerCase(),
    options: {
      // Accounts are created only by the network admin's invite.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error?.status === 429) return { error: "Too many attempts. Wait a minute and try again." };
  // Same answer whether or not the email has an account, so the form can't be used to probe staff lists.
  return {
    ok: true,
    message: "If this email belongs to a Mohar Network partner, a sign-in link is on its way.",
  };
}
