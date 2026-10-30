import { NextResponse, type NextRequest } from "next/server";
import { urlOnRequestHost } from "@/lib/request-url";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(urlOnRequestHost(request.headers, request.nextUrl, "/login"), {
    status: 303,
  });
}
