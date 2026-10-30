import { describe, expect, it } from "vitest";
import { assertPaise, formatPaise, parseRupeesToPaise } from "./money";

describe("parseRupeesToPaise", () => {
  it.each([
    ["1250", 125_000],
    ["1,250", 125_000],
    ["₹ 1,250.5", 125_050],
    ["999.99", 99_999],
    ["0", 0],
  ])("%s → %d", (input, paise) => {
    expect(parseRupeesToPaise(input)).toBe(paise);
  });

  it.each(["", "abc", "-5", "1.234", "1e3", "12.3.4"])("rejects %j", (input) => {
    expect(parseRupeesToPaise(input)).toBeNull();
  });

  it("rejects amounts beyond safe integers", () => {
    expect(parseRupeesToPaise("99999999999999999")).toBeNull();
  });
});

describe("formatPaise", () => {
  it("uses Indian grouping", () => {
    expect(formatPaise(12_500_000)).toBe("₹1,25,000");
    expect(formatPaise(125_050)).toBe("₹1,250.5");
  });

  it("rejects fractions of a paisa", () => {
    expect(() => formatPaise(1.5)).toThrow(RangeError);
  });
});

describe("assertPaise", () => {
  it("accepts integers and rejects the rest", () => {
    expect(() => assertPaise(0)).not.toThrow();
    expect(() => assertPaise(Number.NaN)).toThrow(/amount/);
  });
});
