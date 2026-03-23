/**
 * algorand/types/registry.ts
 *
 * Shared type definitions for the Algorand Solvent Registry.
 * These types are used by both the registry client and the adapter layer.
 *
 * Field names mirror the canonical epoch object produced by the SolvencyProof backend
 * and the payload emitted by toAlgorandSolventRegistryPayload().
 */

// ============================================================
// HEALTH STATUS ENUM
// ============================================================

/**
 * Numeric health-status codes stored on-chain.
 *
 * 0 = UNKNOWN           – state has not been evaluated / initialised
 * 1 = HEALTHY           – capital backing + liquidity readiness both satisfied
 * 2 = LIQUIDITY_STRESSED – capital backing OK, but liquid assets < near-term obligations
 * 3 = UNDERCOLLATERALIZED – reserves < total liabilities
 * 4 = CRITICAL          – both capital backing and liquidity readiness have failed
 * 5 = EXPIRED           – valid_until window has passed without renewal
 */
export enum HealthStatus {
  UNKNOWN = 0,
  HEALTHY = 1,
  LIQUIDITY_STRESSED = 2,
  UNDERCOLLATERALIZED = 3,
  CRITICAL = 4,
  EXPIRED = 5,
}

/** Maps the string health_status in canonical epoch objects to the on-chain numeric value. */
export const HEALTH_STATUS_STRING_MAP: Record<string, HealthStatus> = {
  UNKNOWN: HealthStatus.UNKNOWN,
  HEALTHY: HealthStatus.HEALTHY,
  LIQUIDITY_STRESSED: HealthStatus.LIQUIDITY_STRESSED,
  UNDERCOLLATERALIZED: HealthStatus.UNDERCOLLATERALIZED,
  CRITICAL: HealthStatus.CRITICAL,
  EXPIRED: HealthStatus.EXPIRED,
};

// ============================================================
// SCALE FACTOR
// ============================================================

/**
 * Monetary amounts in the canonical epoch object are floating-point USD values.
 * The on-chain contract stores them as uint64 integers scaled by AMOUNT_SCALE to
 * preserve 6 decimal places of precision without floating-point arithmetic.
 *
 * e.g. 12_500_000.00 USD  →  12_500_000_000_000 (12.5 trillion micro-units)
 */
export const AMOUNT_SCALE = 1_000_000n;

// ============================================================
// ON-CHAIN PAYLOAD (input to the contract)
// ============================================================

/**
 * The payload submitted to the Solvent Registry contract via submit_epoch.
 * All amounts are scaled uint64 values; timestamps are Unix epoch seconds (uint64);
 * health_status is the numeric HealthStatus enum value.
 *
 * Produced by toAlgorandSolventRegistryPayload() from a canonical EpochObject.
 */
export interface AlgorandRegistryPayload {
  entity_id: string;
  epoch_id: string;

  /** Hex string commitment to the full liability set (e.g. "0xabc123...") */
  liability_root: string;
  /** Hex string commitment to the reserve set */
  reserve_root: string;
  /** Deterministic hash of reserve state at evaluation time */
  reserve_snapshot_hash: string;
  /** Proof hash linking liabilities + reserves + epoch identity */
  proof_hash: string;

  /** Total reserves in micro-units (reserves_total × AMOUNT_SCALE) */
  reserves_total: bigint;
  /** Liquid assets in micro-units */
  liquid_assets_total: bigint;
  /** Near-term liabilities in micro-units */
  near_term_liabilities_total: bigint;

  capital_backed: boolean;
  liquidity_ready: boolean;

  /** Numeric HealthStatus value (0-5) */
  health_status: HealthStatus;

  /** Unix timestamp (seconds since epoch) */
  timestamp: bigint;
  /** Unix timestamp after which this epoch is considered EXPIRED */
  valid_until: bigint;
}

// ============================================================
// STORED RECORDS (decoded from the contract)
// ============================================================

/**
 * Per-epoch historical record stored in box:
 *   entity:{entity_id}:epoch:{epoch_id}
 */
export interface EpochRecord {
  entity_id: string;
  epoch_id: string;
  liability_root: string;
  reserve_root: string;
  reserve_snapshot_hash: string;
  proof_hash: string;
  reserves_total: bigint;
  liquid_assets_total: bigint;
  near_term_liabilities_total: bigint;
  capital_backed: boolean;
  liquidity_ready: boolean;
  health_status: HealthStatus;
  timestamp: bigint;
  valid_until: bigint;
  insolvency_flag: boolean;
  liquidity_stress_flag: boolean;
}

/**
 * Latest state stored in box:
 *   entity:{entity_id}:latest
 *
 * Identical to EpochRecord but also carries the latest_epoch identifier so
 * callers can locate the full historical record without a separate lookup.
 */
export type LatestState = EpochRecord;

// ============================================================
// CANONICAL EPOCH OBJECT  (backend output shape)
// ============================================================

/**
 * Shape of the canonical epoch object emitted by the SolvencyProof backend.
 * Used as the input to toAlgorandSolventRegistryPayload().
 */
export interface CanonicalEpochObject {
  entity_id: string;
  epoch_id: string;
  liability_root: string;
  reserve_root: string;
  reserve_snapshot_hash: string;
  proof_hash: string;
  /** USD float */
  reserves_total: number;
  /** USD float – total liabilities (informational; not submitted to contract) */
  total_liabilities?: number;
  /** USD float */
  near_term_liabilities_total: number;
  /** USD float */
  liquid_assets_total: number;
  capital_backed: boolean;
  liquidity_ready: boolean;
  /** String enum value, e.g. "HEALTHY" */
  health_status: string;
  /** ISO-8601 timestamp string */
  timestamp: string;
  /** ISO-8601 timestamp string */
  valid_until: string;
  adapter_version?: string;
  source_type?: string;
}

// ============================================================
// BOX ENCODING CONSTANTS  (kept in sync with the PyTeal contract)
// ============================================================

/**
 * Prefix used in every box key. Kept here so the client and contract share
 * the exact same key derivation logic.
 */
export const BOX_KEY_ENTITY_PREFIX = "entity:";
export const BOX_KEY_LATEST_SUFFIX = ":latest";
export const BOX_KEY_EPOCH_INFIX = ":epoch:";

export function makeLatestBoxKey(entityId: string): Uint8Array {
  return new TextEncoder().encode(
    `${BOX_KEY_ENTITY_PREFIX}${entityId}${BOX_KEY_LATEST_SUFFIX}`
  );
}

export function makeEpochBoxKey(entityId: string, epochId: string): Uint8Array {
  return new TextEncoder().encode(
    `${BOX_KEY_ENTITY_PREFIX}${entityId}${BOX_KEY_EPOCH_INFIX}${epochId}`
  );
}
