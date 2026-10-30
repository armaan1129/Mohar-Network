import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  APP_BASE_URL: z.url().default("https://themoharnetwork.com"),
  // Printed on every note. Permanent.
  NOTE_URL_PREFIX: z.url().default("https://themoharnetwork.com/n/"),
});

/** Public env, safe in the browser. Next inlines NEXT_PUBLIC_* at build time. */
export function publicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** Server-only env. Never import from a client component. */
export function serverEnv() {
  return serverSchema.parse(process.env);
}
