import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that use a session. The public site and /n/* stay free of auth work.
  matcher: ["/app/:path*", "/admin/:path*", "/login", "/auth/:path*"],
};
