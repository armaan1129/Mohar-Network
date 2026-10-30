/**
 * Mirror of the `network_settings` row. The database is the source of truth;
 * these defaults match the migration defaults and are used by tests and seeds.
 */
export interface NetworkSettings {
  noteFacePaise: number;
  earnMinBillPaise: number;
  earnBaseNotes: number;
  earnStepPaise: number;
  earnOnBillsWithRedemption: boolean;
  /** Redemption cap as basis points of the bill (5000 = 50%). */
  redeemCapBps: number;
  requireMobileMatch: boolean;
  redeemOtp: boolean;
  validityMonths: number;
  settlementK: number;
  factorFloor: number;
  factorCap: number;
  /** Network fee as basis points of outbound owed. */
  networkFeeBps: number;
}

export const DEFAULT_SETTINGS: Readonly<NetworkSettings> = Object.freeze({
  noteFacePaise: 10_000,
  earnMinBillPaise: 100_000,
  earnBaseNotes: 2,
  earnStepPaise: 50_000,
  earnOnBillsWithRedemption: false,
  redeemCapBps: 5_000,
  requireMobileMatch: true,
  redeemOtp: false,
  validityMonths: 12,
  settlementK: 0.5,
  factorFloor: 0.85,
  factorCap: 1.15,
  networkFeeBps: 0,
});
