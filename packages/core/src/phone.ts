import { parsePhoneNumberFromString as parseAny } from "libphonenumber-js/min";
import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";

/**
 * Normalises a typed mobile number to E.164 (default region IN), or null.
 * Uses mobile-only metadata, so landlines are rejected: notes are tied to a number we can OTP.
 */
export function normalizeMobile(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), "IN");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** Normalises any valid phone number (landlines too, e.g. a shop counter) to E.164, or null. */
export function normalizePhone(input: string): string | null {
  const parsed = parseAny(input.trim(), "IN");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** Display form that never reveals more than the last two digits: "••••••34". */
export function maskMobile(e164: string): string {
  return "••••••" + e164.slice(-2);
}

/** For application logs: never log a full mobile number. */
export function redactMobile(e164: string): string {
  return e164.slice(0, 3) + "*".repeat(Math.max(0, e164.length - 5)) + e164.slice(-2);
}
