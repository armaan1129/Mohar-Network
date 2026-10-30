import { describe, expect, it } from "vitest";
import { earnNotes, redeemCap } from "./rules";
import { DEFAULT_SETTINGS as S } from "./settings";

const rupees = (r: number) => r * 100;

describe("earnNotes (acceptance §12)", () => {
  it.each([
    [0, 0],
    [999, 0],
    [999.99, 0],
    [1000, 2],
    [1499, 2],
    [1499.99, 2],
    [1500, 3],
    [1999, 3],
    [2000, 4],
    [10_000, 20],
  ])("₹%d earns %d notes", (bill, notes) => {
    expect(earnNotes(Math.round(rupees(bill)), S)).toBe(notes);
  });

  it("follows the settings", () => {
    expect(
      earnNotes(rupees(500), {
        earnMinBillPaise: rupees(500),
        earnBaseNotes: 1,
        earnStepPaise: rupees(250),
      }),
    ).toBe(1);
  });

  it("rejects non-integer or negative paise", () => {
    expect(() => earnNotes(100.5, S)).toThrow(RangeError);
    expect(() => earnNotes(-1, S)).toThrow(RangeError);
  });
});

describe("redeemCap (acceptance §12)", () => {
  it.each([
    [150, 0],
    [199, 0],
    [200, 1],
    [1250, 6],
    [1299, 6],
    [1300, 6],
    [1400, 7],
    [2000, 10],
  ])("₹%d allows %d notes", (bill, cap) => {
    expect(redeemCap(rupees(bill), S)).toBe(cap);
  });

  it("blocks the 7th note on a ₹1,250 bill", () => {
    expect(redeemCap(rupees(1250), S)).toBeLessThan(7);
  });

  it("rejects bad input", () => {
    expect(() => redeemCap(-100, S)).toThrow(RangeError);
  });
});
