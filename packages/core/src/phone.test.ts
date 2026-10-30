import { describe, expect, it } from "vitest";
import { maskMobile, normalizeMobile, normalizePhone, redactMobile } from "./phone";

describe("normalizeMobile", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["98765 43210", "+919876543210"],
    ["+91 98765-43210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["+44 7911 123456", "+447911123456"],
  ])("%s → %s", (input, e164) => {
    expect(normalizeMobile(input)).toBe(e164);
  });

  it.each(["", "12345", "abcdefghij", "+91 12345 67890", "0172 2700000"])("rejects %j", (input) => {
    expect(normalizeMobile(input)).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("accepts landlines and mobiles", () => {
    expect(normalizePhone("01763 222 333")).toBe("+911763222333");
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
  });

  it.each(["", "12", "not a phone"])("rejects %j", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("masking", () => {
  it("shows only the last two digits publicly", () => {
    expect(maskMobile("+919876543234")).toBe("••••••34");
  });

  it("redacts for logs", () => {
    expect(redactMobile("+919876543210")).toBe("+91********10");
    expect(redactMobile("+9112")).toBe("+9112");
  });
});
