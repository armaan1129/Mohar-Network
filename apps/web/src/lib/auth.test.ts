import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { safeNext } = await import("./auth");

describe("safeNext", () => {
  it.each([
    ["/admin", "/admin"],
    ["/app/issue?x=1", "/app/issue?x=1"],
    [null, "/app"],
    ["", "/app"],
    ["https://evil.example", "/app"],
    ["//evil.example", "/app"],
    ["/\\evil.example", "/app"],
  ])("%j → %j", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
