import { describe, expect, it } from "vitest";
import {
  formatSerial,
  isSerial,
  normalizeSerial,
  noteUrl,
  parseSerial,
  stackCount,
  stackRange,
  toSerial,
} from "./serial";

describe("serial format", () => {
  it("builds and formats compact serials", () => {
    expect(toSerial("A", 1)).toBe("A000001");
    expect(toSerial("B", 999_999)).toBe("B999999");
    expect(formatSerial("A000001")).toBe("A 000 001");
    expect(parseSerial("A000504")).toEqual({ series: "A", seq: 504 });
    expect(isSerial("A000001")).toBe(true);
    expect(isSerial("a000001")).toBe(false);
  });

  it("rejects bad parts", () => {
    expect(() => toSerial("AA", 1)).toThrow(RangeError);
    expect(() => toSerial("a", 1)).toThrow(RangeError);
    expect(() => toSerial("A", 0)).toThrow(RangeError);
    expect(() => toSerial("A", 1_000_000)).toThrow(RangeError);
    expect(() => toSerial("A", 1.5)).toThrow(RangeError);
    expect(() => parseSerial("A 000 001")).toThrow(RangeError);
  });
});

describe("QR URL (printed, permanent)", () => {
  it("is exactly https://sirhindmohar.in/n/A000001", () => {
    expect(noteUrl("A000001")).toBe("https://sirhindmohar.in/n/A000001");
  });

  it("refuses to build a URL from a non-serial", () => {
    expect(() => noteUrl("A1")).toThrow(RangeError);
  });

  it.each([
    ["https://sirhindmohar.in/n/A000001", "A000001"],
    ["https://sirhindmohar.in/n/A000001/", "A000001"],
    ["HTTPS://SIRHINDMOHAR.IN/n/A000001", "A000001"],
    ["  https://sirhindmohar.in/n/a000042  ", "A000042"],
    ["A000001", "A000001"],
    ["a 000 001", "A000001"],
    ["A 000001", "A000001"],
  ])("normalises %j", (raw, serial) => {
    expect(normalizeSerial(raw)).toBe(serial);
  });

  it.each([
    "https://evil.example/n/A000001",
    "https://sirhindmohar.in/x/A000001",
    "https://sirhindmohar.in/n/A00001",
    "http://sirhindmohar.in/n/A000001",
    "A0000011",
    "",
    "hello",
  ])("rejects %j", (raw) => {
    expect(normalizeSerial(raw)).toBeNull();
  });

  it("honours a custom prefix", () => {
    expect(normalizeSerial("http://localhost:3000/n/A000007", "http://localhost:3000/n/")).toBe(
      "A000007",
    );
  });
});

describe("cut-and-stack ranges (batch A)", () => {
  const batchA = { firstSeq: 1, lastSeq: 504, stackSize: 42 };

  it("has 12 stacks of 42", () => {
    expect(stackCount(batchA)).toBe(12);
    expect(stackRange(batchA, 0)).toEqual({ firstSeq: 1, lastSeq: 42 });
    expect(stackRange(batchA, 1)).toEqual({ firstSeq: 43, lastSeq: 84 });
    expect(stackRange(batchA, 11)).toEqual({ firstSeq: 463, lastSeq: 504 });
  });

  it("clips a short last stack", () => {
    const odd = { firstSeq: 1001, lastSeq: 1050, stackSize: 20 };
    expect(stackCount(odd)).toBe(3);
    expect(stackRange(odd, 2)).toEqual({ firstSeq: 1041, lastSeq: 1050 });
  });

  it("rejects out-of-range stacks", () => {
    expect(() => stackRange(batchA, 12)).toThrow(RangeError);
    expect(() => stackRange(batchA, -1)).toThrow(RangeError);
    expect(() => stackRange(batchA, 0.5)).toThrow(RangeError);
  });
});
