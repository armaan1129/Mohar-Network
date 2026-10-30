import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { urlOnRequestHost } from "@/lib/request-url";

/** Refreshes the auth session cookie and gates /app and /admin on being signed in. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Must run before anything else: validates the JWT with Supabase Auth and refreshes it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path === "/app" || path.startsWith("/app/") || path === "/admin" || path.startsWith("/admin/");
  if (!user && isProtected) {
    return NextResponse.redirect(
      urlOnRequestHost(request.headers, request.nextUrl, `/login?next=${encodeURIComponent(path)}`),
    );
  }

  return response;
}
