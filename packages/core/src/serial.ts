/**
 * Note serials: 3-letter city code, hyphen, series letter, 6 digits. Stored compact
 * ("SIR-A000001"), displayed spaced ("SIR-A 000 001"). The QR encodes
 * NOTE_URL_PREFIX + compact serial, e.g. https://themoharnetwork.com/n/SIR-A000001.
 * That format is printed and permanent.
 */

export const SERIAL_RE = /^[A-Z]{3}-[A-Z][0-9]{6}$/;
export const CITY_CODE_RE = /^[A-Z]{3}$/;
export const MAX_SEQ = 999_999;
export const DEFAULT_NOTE_URL_PREFIX = "https://themoharnetwork.com/n/";

export interface SerialParts {
  city: string;
  series: string;
  seq: number;
}

export function isSerial(value: string): boolean {
  return SERIAL_RE.test(value);
}

export function toSerial(city: string, series: string, seq: number): string {
  if (!CITY_CODE_RE.test(city)) throw new RangeError("city code must be 3 letters A–Z");
  if (!/^[A-Z]$/.test(series)) throw new RangeError("series must be a single letter A–Z");
  if (!Number.isInteger(seq) || seq < 1 || seq > MAX_SEQ) {
    throw new RangeError(`seq must be an integer 1–${MAX_SEQ}`);
  }
  return `${city}-${series}${String(seq).padStart(6, "0")}`;
}

export function parseSerial(serial: string): SerialParts {
  if (!isSerial(serial)) throw new RangeError(`not a compact serial: ${serial}`);
  return { city: serial.slice(0, 3), series: serial.slice(4, 5), seq: Number(serial.slice(5)) };
}

/** "SIR-A000001" → "SIR-A 000 001" */
export function formatSerial(serial: string): string {
  parseSerial(serial);
  return `${serial.slice(0, 5)} ${serial.slice(5, 8)} ${serial.slice(8)}`;
}

export function noteUrl(serial: string, prefix = DEFAULT_NOTE_URL_PREFIX): string {
  parseSerial(serial);
  return prefix + serial;
}

/**
 * Normalises whatever a scanner or a cashier produced into a compact serial, or null.
 * Accepts the exact QR URL (prefix + serial, optional trailing slash) or a typed serial
 * with optional spaces and hyphen ("sir a 000 001", "SIRA000001"). Any other URL is rejected.
 */
export function normalizeSerial(raw: string, prefix = DEFAULT_NOTE_URL_PREFIX): string | null {
  let value = raw.trim();
  if (/^https?:\/\//i.test(value)) {
    if (value.slice(0, prefix.length).toLowerCase() !== prefix.toLowerCase()) return null;
    value = value.slice(prefix.length).replace(/\/$/, "");
  }
  const match = /^([A-Z]{3})-?([A-Z])([0-9]{6})$/.exec(value.replace(/\s+/g, "").toUpperCase());
  return match ? `${match[1]}-${match[2]}${match[3]}` : null;
}

/**
 * Cut-and-stack numbering: stack p (0-based) of a batch starting at firstSeq holds
 * firstSeq + p×size … firstSeq + p×size + size − 1, clipped to the batch end.
 * Batch A (1–504, size 42): stack 0 = 1–42, stack 11 = 463–504.
 */
export function stackRange(
  batch: { firstSeq: number; lastSeq: number; stackSize: number },
  stackIndex: number,
): { firstSeq: number; lastSeq: number } {
  const count = stackCount(batch);
  if (!Number.isInteger(stackIndex) || stackIndex < 0 || stackIndex >= count) {
    throw new RangeError(`stack index must be 0–${count - 1}`);
  }
  const firstSeq = batch.firstSeq + stackIndex * batch.stackSize;
  return { firstSeq, lastSeq: Math.min(firstSeq + batch.stackSize - 1, batch.lastSeq) };
}

export function stackCount(batch: {
  firstSeq: number;
  lastSeq: number;
  stackSize: number;
}): number {
  return Math.ceil((batch.lastSeq - batch.firstSeq + 1) / batch.stackSize);
}
