import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Lands magic-link and invite emails: PKCE `code`, or `token_hash` + `type` from a custom template. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  const target = request.nextUrl.clone();
  target.search = "";
  if (error) {
    target.pathname = "/login";
    target.searchParams.set("error", "link");
  } else {
    const [path, query] = next.split("?");
    target.pathname = path ?? "/app";
    if (query) target.search = `?${query}`;
  }
  return NextResponse.redirect(target);
}
