// Shared solvency types — frontend is a state consumer, not a logic driver.
// Backend computes state; Algorand is the public registry; frontend displays & verifies.

export type HealthStatus =
    | 'HEALTHY'
    | 'LIQUIDITY_STRESSED'
    | 'UNDERCOLLATERALIZED'
    | 'CRITICAL'
    | 'EXPIRED';

/** A single epoch's solvency state as computed by the backend and anchored on Algorand. */
export interface EpochState {
    entity_id: string;
    epoch_id: string;
    liability_root: string;
    reserve_root: string;
    /** Hash of the raw reserve snapshot used to produce reserve_root. */
    reserve_snapshot_hash: string;
    /** Combined proof hash anchored on Algorand. */
    proof_hash: string;
    reserves_total: number;
    total_liabilities: number;
    near_term_liabilities_total: number;
    liquid_assets_total: number;
    capital_backed: boolean;
    liquidity_ready: boolean;
    health_status: HealthStatus;
    /** ISO-8601 timestamp of when this epoch was computed. */
    timestamp: string;
    /** ISO-8601 timestamp after which this epoch is considered EXPIRED. */
    valid_until: string;
}

/** Summary card shown in the public dashboard. */
export interface EpochSummary {
    entity_id: string;
    epoch_id: string;
    health_status: HealthStatus;
    proof_hash: string;
    timestamp: string;
    valid_until: string;
    capital_backed: boolean;
    liquidity_ready: boolean;
}

/** Algorand registry metadata for an entity. */
export interface RegistryMetadata {
    entity_id: string;
    algorand_app_id?: string;
    algorand_address?: string;
    last_updated: string;
    epoch_count: number;
}

/** Result of a user inclusion verification against a specific epoch's liability_root. */
export interface InclusionResult {
    success: boolean;
    user_id: string;
    epoch_id: string;
    liability_root: string;
    balance?: number;
    proof?: string[];
    error?: string;
}

/** Backend health response. */
export interface BackendHealth {
    status: string;
    timestamp: string;
}
