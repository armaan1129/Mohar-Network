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
    expect(toSerial("SIR", "A", 1)).toBe("SIR-A000001");
    expect(toSerial("PTA", "B", 999_999)).toBe("PTA-B999999");
    expect(formatSerial("SIR-A000001")).toBe("SIR-A 000 001");
    expect(parseSerial("SIR-A000504")).toEqual({ city: "SIR", series: "A", seq: 504 });
    expect(isSerial("SIR-A000001")).toBe(true);
    expect(isSerial("sir-a000001")).toBe(false);
    expect(isSerial("A000001")).toBe(false);
  });

  it("rejects bad parts", () => {
    expect(() => toSerial("SI", "A", 1)).toThrow(RangeError);
    expect(() => toSerial("sir", "A", 1)).toThrow(RangeError);
    expect(() => toSerial("SIR", "AA", 1)).toThrow(RangeError);
    expect(() => toSerial("SIR", "a", 1)).toThrow(RangeError);
    expect(() => toSerial("SIR", "A", 0)).toThrow(RangeError);
    expect(() => toSerial("SIR", "A", 1_000_000)).toThrow(RangeError);
    expect(() => toSerial("SIR", "A", 1.5)).toThrow(RangeError);
    expect(() => parseSerial("SIR-A 000 001")).toThrow(RangeError);
  });
});

describe("QR URL (printed, permanent)", () => {
  it("is exactly https://themoharnetwork.com/n/SIR-A000001", () => {
    expect(noteUrl("SIR-A000001")).toBe("https://themoharnetwork.com/n/SIR-A000001");
  });

  it("refuses to build a URL from a non-serial", () => {
    expect(() => noteUrl("A000001")).toThrow(RangeError);
  });

  it.each([
    ["https://themoharnetwork.com/n/SIR-A000001", "SIR-A000001"],
    ["https://themoharnetwork.com/n/SIR-A000001/", "SIR-A000001"],
    ["HTTPS://THEMOHARNETWORK.COM/n/SIR-A000001", "SIR-A000001"],
    ["  https://themoharnetwork.com/n/sir-a000042  ", "SIR-A000042"],
    ["SIR-A000001", "SIR-A000001"],
    ["sir a 000 001", "SIR-A000001"],
    ["SIRA000001", "SIR-A000001"],
    ["SIR-A 000 001", "SIR-A000001"],
  ])("normalises %j", (raw, serial) => {
    expect(normalizeSerial(raw)).toBe(serial);
  });

  it.each([
    "https://evil.example/n/SIR-A000001",
    "https://sirhind.themoharnetwork.com/n/SIR-A000001",
    "https://themoharnetwork.com/x/SIR-A000001",
    "https://themoharnetwork.com/n/SIR-A00001",
    "http://themoharnetwork.com/n/SIR-A000001",
    "A000001",
    "SIR--A000001",
    "SIR-A0000011",
    "",
    "hello",
  ])("rejects %j", (raw) => {
    expect(normalizeSerial(raw)).toBeNull();
  });

  it("honours a custom prefix", () => {
    expect(normalizeSerial("http://localhost:3000/n/SIR-A000007", "http://localhost:3000/n/")).toBe(
      "SIR-A000007",
    );
  });
});

describe("cut-and-stack ranges (batch SIR-A)", () => {
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
