import { assertPaise } from "./money";
import type { NetworkSettings } from "./settings";

type EarnSettings = Pick<NetworkSettings, "earnMinBillPaise" | "earnBaseNotes" | "earnStepPaise">;
type CapSettings = Pick<NetworkSettings, "redeemCapBps" | "noteFacePaise">;

/**
 * Notes earned on a bill: 0 below the threshold, otherwise
 * base + floor((bill − threshold) / step). Defaults: ₹1,000 → 2, ₹1,500 → 3, ₹2,000 → 4.
 */
export function earnNotes(billPaise: number, s: EarnSettings): number {
  assertPaise(billPaise, "bill");
  if (billPaise < s.earnMinBillPaise) return 0;
  return s.earnBaseNotes + Math.floor((billPaise - s.earnMinBillPaise) / s.earnStepPaise);
}

/**
 * Maximum whole notes redeemable on a bill: floor(bill × cap% / face).
 * Defaults: ₹1,250 → 6, ₹150 → 0. Integer maths only.
 */
export function redeemCap(billPaise: number, s: CapSettings): number {
  assertPaise(billPaise, "bill");
  return Math.floor((billPaise * s.redeemCapBps) / (10_000 * s.noteFacePaise));
}
