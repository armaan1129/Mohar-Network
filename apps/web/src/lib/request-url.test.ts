import { describe, expect, it } from "vitest";
import { urlOnRequestHost } from "./request-url";

const fallback = new URL("http://localhost:3000/");

describe("urlOnRequestHost", () => {
  it("keeps the host the browser used", () => {
    const h = new Headers({ host: "127.0.0.1:3000" });
    expect(urlOnRequestHost(h, fallback, "/login?next=%2Fadmin").href).toBe(
      "http://127.0.0.1:3000/login?next=%2Fadmin",
    );
  });

  it("honours proxy headers and defaults public hosts to https", () => {
    expect(
      urlOnRequestHost(new Headers({ host: "themoharnetwork.com" }), fallback, "/app").href,
    ).toBe("https://themoharnetwork.com/app");
    const proxied = new Headers({
      host: "internal:3000",
      "x-forwarded-host": "preview.vercel.app",
      "x-forwarded-proto": "https",
    });
    expect(urlOnRequestHost(proxied, fallback, "/admin").href).toBe(
      "https://preview.vercel.app/admin",
    );
  });

  it("falls back when there is no host header", () => {
    expect(urlOnRequestHost(new Headers(), fallback, "/login").href).toBe(
      "http://localhost:3000/login",
    );
  });
});
