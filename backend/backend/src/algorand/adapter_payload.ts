import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import type { SolvencyEpochObject } from "../types/epoch.js";
import type { AlgorandAdapterPayload } from "./adapter_types.js";

export type { AlgorandAdapterPayload };

/**
 * Builds the normalized Algorand adapter payload from a canonical
 * SolvencyEpochObject.
 *
 * SolvencyProof is the source of truth for all solvency computations.
 * This function translates the canonical epoch object into the hand-off
 * payload consumed by the external compliledger-algorand-adapter.
 *
 * Numeric totals are coerced to strings to accommodate ABI encoding
 * constraints for large integers (the adapter converts them to micro-units).
 */
export function toAlgorandSolventRegistryPayload(
  epoch: SolvencyEpochObject
): AlgorandAdapterPayload {
  return {
    entity_id: epoch.entity_id,
    epoch_id: epoch.epoch_id,
    liability_root: epoch.liability_root,
    reserve_root: epoch.reserve_root,
    reserve_snapshot_hash: epoch.reserve_snapshot_hash,
    proof_hash: epoch.proof_hash,
    reserves_total: String(epoch.reserves_total),
    liquid_assets_total: String(epoch.liquid_assets_total),
    near_term_liabilities_total: String(epoch.near_term_liabilities_total),
    capital_backed: epoch.capital_backed,
    liquidity_ready: epoch.liquidity_ready,
    health_status: epoch.health_status,
    timestamp: epoch.timestamp,
    valid_until: epoch.valid_until,
    adapter_version: epoch.adapter_version,
  };
}

/**
 * Writes the Algorand adapter payload to `{outputDir}/latest_epoch.json`.
 */
export function writeAlgorandPayload(
  payload: AlgorandAdapterPayload,
  outputDir: string
): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  const dest = path.join(outputDir, "latest_epoch.json");
  writeFileSync(dest, JSON.stringify(payload, null, 2), "utf-8");
}
