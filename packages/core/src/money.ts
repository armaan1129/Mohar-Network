/** All money is integer paise. These helpers are the only place rupees appear. */

export function assertPaise(value: number, label = "amount"): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer number of paise`);
  }
}

/**
 * Parses a rupee amount typed by a cashier ("1250", "1,250.50", "₹ 999") into paise.
 * Returns null for anything that is not a plain non-negative amount with at most 2 decimals.
 */
export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const rupees = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const paise = rupees * 100 + fraction;
  return Number.isSafeInteger(paise) ? paise : null;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats paise as rupees with Indian digit grouping, e.g. 125000 → "₹1,250". */
export function formatPaise(paise: number): string {
  if (!Number.isSafeInteger(paise)) throw new RangeError("paise must be an integer");
  return inr.format(paise / 100);
}
