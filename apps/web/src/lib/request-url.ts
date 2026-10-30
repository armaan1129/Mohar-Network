/**
 * Absolute URL on the host the browser actually used. `request.nextUrl` can report the
 * server's bind address (e.g. localhost) instead, and a redirect there drops the session
 * cookie, which is scoped to the original host.
 */
export function urlOnRequestHost(headers: Headers, fallback: URL, path: string): URL {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return new URL(path, fallback);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto = headers.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return new URL(path, `${proto}://${host}`);
}
