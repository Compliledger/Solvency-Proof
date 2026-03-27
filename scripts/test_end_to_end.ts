/**
 * scripts/test_end_to_end.ts
 *
 * End-to-end integration test for SolvencyProof pipeline:
 *   backend → adapter payload → Algorand encode → decode (read back) → verify
 *
 * Since no live Algorand testnet contract is deployed (no SOLVENT_REGISTRY_APP_ID),
 * this test validates the full data pipeline by simulating the on-chain round-trip
 * using encodeState/decodeState (the exact same wire format the PyTeal contract uses).
 *
 * Usage:
 *   npx tsx scripts/test_end_to_end.ts
 */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import from the algorand package
import {
  toAlgorandSolventRegistryPayload,
  encodeState,
  decodeState,
} from "../algorand/client/registry_client.js";
import {
  HealthStatus,
  HEALTH_STATUS_STRING_MAP,
  AMOUNT_SCALE,
  makeLatestBoxKey,
  makeEpochBoxKey,
} from "../algorand/types/registry.js";
import type {
  CanonicalEpochObject,
  AlgorandRegistryPayload,
} from "../algorand/types/registry.js";

// ============================================================
// HELPERS
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passCount++;
  } else {
    console.log(`  ❌ FAIL: ${label}`);
    failCount++;
    failures.push(label);
  }
}

function section(title: string): void {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ============================================================
// STEP 1: LOAD latest_epoch.json
// ============================================================

section("STEP 1 — Load latest_epoch.json (backend output)");

const epochPath = path.resolve(__dirname, "../backend/data/output/latest_epoch.json");
const rawEpoch = readFileSync(epochPath, "utf-8");
const epochPayload = JSON.parse(rawEpoch);

console.log(`  Loaded: ${epochPath}`);
console.log(`  Entity ID:        ${epochPayload.entity_id}`);
console.log(`  Epoch ID:         ${epochPayload.epoch_id}`);
console.log(`  Health Status:    ${epochPayload.health_status}`);
console.log(`  Capital Backed:   ${epochPayload.capital_backed}`);
console.log(`  Liquidity Ready:  ${epochPayload.liquidity_ready}`);
console.log(`  Reserves Total:   ${epochPayload.reserves_total}`);
console.log(`  Liquid Assets:    ${epochPayload.liquid_assets_total}`);
console.log(`  Near-Term Liab:   ${epochPayload.near_term_liabilities_total}`);
console.log(`  Timestamp:        ${epochPayload.timestamp}`);
console.log(`  Valid Until:      ${epochPayload.valid_until}`);

// ============================================================
// STEP 2: VALIDATE BACKEND OUTPUT
// ============================================================

section("STEP 2 — Validate backend epoch output");

assert(typeof epochPayload.entity_id === "string" && epochPayload.entity_id.length > 0, "entity_id is non-empty string");
assert(typeof epochPayload.epoch_id === "number" || typeof epochPayload.epoch_id === "string", "epoch_id exists");
assert(epochPayload.liability_root.startsWith("0x"), "liability_root is hex");
assert(epochPayload.reserve_root.startsWith("0x"), "reserve_root is hex");
assert(epochPayload.reserve_snapshot_hash.startsWith("0x"), "reserve_snapshot_hash is hex");
assert(epochPayload.proof_hash.startsWith("0x"), "proof_hash is hex");
assert(typeof epochPayload.capital_backed === "boolean", "capital_backed is boolean");
assert(typeof epochPayload.liquidity_ready === "boolean", "liquidity_ready is boolean");
assert(["HEALTHY", "LIQUIDITY_STRESSED", "UNDERCOLLATERALIZED", "CRITICAL"].includes(epochPayload.health_status), "health_status is valid enum");
assert(typeof epochPayload.timestamp === "number" && epochPayload.timestamp > 0, "timestamp is positive number");
assert(typeof epochPayload.valid_until === "number" && epochPayload.valid_until > epochPayload.timestamp, "valid_until > timestamp");

// Verify reserves >= liabilities (capital_backed check)
const reservesNum = Number(epochPayload.reserves_total);
const liabilitiesNum = Number(epochPayload.near_term_liabilities_total);
const liquidNum = Number(epochPayload.liquid_assets_total);
assert(epochPayload.capital_backed === (reservesNum >= liabilitiesNum), "capital_backed consistent with reserves >= liabilities");
assert(epochPayload.liquidity_ready === (liquidNum >= liabilitiesNum), "liquidity_ready consistent with liquid >= near_term_liabilities");

// ============================================================
// STEP 3: CONVERT TO ALGORAND PAYLOAD
// ============================================================

section("STEP 3 — Convert to AlgorandRegistryPayload");

// Build a CanonicalEpochObject from the adapter payload (latest_epoch.json)
// The adapter payload has string amounts and numeric timestamps
const canonicalEpoch: CanonicalEpochObject = {
  entity_id: epochPayload.entity_id,
  epoch_id: String(epochPayload.epoch_id),
  liability_root: epochPayload.liability_root,
  reserve_root: epochPayload.reserve_root,
  reserve_snapshot_hash: epochPayload.reserve_snapshot_hash,
  proof_hash: epochPayload.proof_hash,
  reserves_total: Number(epochPayload.reserves_total),
  total_liabilities: Number(epochPayload.near_term_liabilities_total),
  near_term_liabilities_total: Number(epochPayload.near_term_liabilities_total),
  liquid_assets_total: Number(epochPayload.liquid_assets_total),
  capital_backed: epochPayload.capital_backed,
  liquidity_ready: epochPayload.liquidity_ready,
  health_status: epochPayload.health_status,
  timestamp: new Date(epochPayload.timestamp * 1000).toISOString(),
  valid_until: new Date(epochPayload.valid_until * 1000).toISOString(),
  adapter_version: epochPayload.adapter_version ?? "algorand-adapter-v1",
  source_type: "backend",
};

const algoPayload: AlgorandRegistryPayload = toAlgorandSolventRegistryPayload(canonicalEpoch);

console.log(`  entity_id:              ${algoPayload.entity_id}`);
console.log(`  epoch_id:               ${algoPayload.epoch_id}`);
console.log(`  health_status (numeric):${algoPayload.health_status}`);
console.log(`  reserves_total (scaled):${algoPayload.reserves_total}`);
console.log(`  liquid_assets (scaled): ${algoPayload.liquid_assets_total}`);
console.log(`  near_term_liab (scaled):${algoPayload.near_term_liabilities_total}`);
console.log(`  capital_backed:         ${algoPayload.capital_backed}`);
console.log(`  liquidity_ready:        ${algoPayload.liquidity_ready}`);
console.log(`  timestamp (unix):       ${algoPayload.timestamp}`);
console.log(`  valid_until (unix):     ${algoPayload.valid_until}`);

assert(algoPayload.entity_id === canonicalEpoch.entity_id, "entity_id preserved in payload conversion");
assert(algoPayload.epoch_id === String(epochPayload.epoch_id), "epoch_id preserved");
assert(algoPayload.liability_root === epochPayload.liability_root, "liability_root preserved");
assert(algoPayload.reserve_root === epochPayload.reserve_root, "reserve_root preserved");
assert(algoPayload.proof_hash === epochPayload.proof_hash, "proof_hash preserved");

const expectedHealthNum = HEALTH_STATUS_STRING_MAP[epochPayload.health_status.toUpperCase()];
assert(algoPayload.health_status === expectedHealthNum, `health_status mapped correctly to ${expectedHealthNum}`);

const expectedReservesScaled = BigInt(Math.round(Number(epochPayload.reserves_total) * Number(AMOUNT_SCALE)));
assert(algoPayload.reserves_total === expectedReservesScaled, "reserves_total correctly scaled to micro-units");

// ============================================================
// STEP 4: ENCODE (simulates on-chain write via submit_epoch)
// ============================================================

section("STEP 4 — Encode state (simulates on-chain box write)");

const insolvencyFlag = !algoPayload.capital_backed;
const liquidityStressFlag = !algoPayload.liquidity_ready;

console.log(`  insolvency_flag:        ${insolvencyFlag}`);
console.log(`  liquidity_stress_flag:  ${liquidityStressFlag}`);

const encoded = encodeState(algoPayload, insolvencyFlag, liquidityStressFlag);
console.log(`  Encoded wire format:    ${encoded.length} bytes`);
assert(encoded.length > 0, "encoded state is non-empty");

// Verify box keys
const latestKey = makeLatestBoxKey(algoPayload.entity_id);
const epochKey = makeEpochBoxKey(algoPayload.entity_id, algoPayload.epoch_id);
const dec = new TextDecoder();
console.log(`  Latest box key:         ${dec.decode(latestKey)}`);
console.log(`  Epoch box key:          ${dec.decode(epochKey)}`);

assert(dec.decode(latestKey) === `entity:${algoPayload.entity_id}:latest`, "latest box key correct");
assert(dec.decode(epochKey) === `entity:${algoPayload.entity_id}:epoch:${algoPayload.epoch_id}`, "epoch box key correct");

// ============================================================
// STEP 5: DECODE (simulates on-chain read / get_latest_state)
// ============================================================

section("STEP 5 — Decode state (simulates on-chain box read)");

const decoded = decodeState(encoded);

console.log(`  entity_id:              ${decoded.entity_id}`);
console.log(`  epoch_id:               ${decoded.epoch_id}`);
console.log(`  liability_root:         ${decoded.liability_root}`);
console.log(`  reserve_root:           ${decoded.reserve_root}`);
console.log(`  reserve_snapshot_hash:  ${decoded.reserve_snapshot_hash}`);
console.log(`  proof_hash:             ${decoded.proof_hash}`);
console.log(`  reserves_total:         ${decoded.reserves_total}`);
console.log(`  liquid_assets_total:    ${decoded.liquid_assets_total}`);
console.log(`  near_term_liabilities:  ${decoded.near_term_liabilities_total}`);
console.log(`  capital_backed:         ${decoded.capital_backed}`);
console.log(`  liquidity_ready:        ${decoded.liquidity_ready}`);
console.log(`  health_status:          ${decoded.health_status} (${HealthStatus[decoded.health_status]})`);
console.log(`  timestamp:              ${decoded.timestamp}`);
console.log(`  valid_until:            ${decoded.valid_until}`);
console.log(`  insolvency_flag:        ${decoded.insolvency_flag}`);
console.log(`  liquidity_stress_flag:  ${decoded.liquidity_stress_flag}`);

// ============================================================
// STEP 6: VERIFY — compare decoded state against original payload
// ============================================================

section("STEP 6 — Verify stored record matches original payload");

const mismatches: string[] = [];

function verifyField(field: string, expected: unknown, actual: unknown): void {
  const match = expected === actual;
  if (!match) mismatches.push(`${field}: expected=${expected}, actual=${actual}`);
  assert(match, `${field} matches`);
}

verifyField("entity_id", algoPayload.entity_id, decoded.entity_id);
verifyField("epoch_id", algoPayload.epoch_id, decoded.epoch_id);
verifyField("liability_root", algoPayload.liability_root, decoded.liability_root);
verifyField("reserve_root", algoPayload.reserve_root, decoded.reserve_root);
verifyField("reserve_snapshot_hash", algoPayload.reserve_snapshot_hash, decoded.reserve_snapshot_hash);
verifyField("proof_hash", algoPayload.proof_hash, decoded.proof_hash);
verifyField("reserves_total", algoPayload.reserves_total, decoded.reserves_total);
verifyField("liquid_assets_total", algoPayload.liquid_assets_total, decoded.liquid_assets_total);
verifyField("near_term_liabilities_total", algoPayload.near_term_liabilities_total, decoded.near_term_liabilities_total);
verifyField("capital_backed", algoPayload.capital_backed, decoded.capital_backed);
verifyField("liquidity_ready", algoPayload.liquidity_ready, decoded.liquidity_ready);
verifyField("health_status", algoPayload.health_status, decoded.health_status);
verifyField("timestamp", algoPayload.timestamp, decoded.timestamp);
verifyField("valid_until", algoPayload.valid_until, decoded.valid_until);

// Derived flags
verifyField("insolvency_flag", insolvencyFlag, decoded.insolvency_flag);
verifyField("liquidity_stress_flag", liquidityStressFlag, decoded.liquidity_stress_flag);

console.log(`\n  Verification summary:`);
console.log(`    exists:     true`);
console.log(`    matches:    ${mismatches.length === 0}`);
console.log(`    mismatches: ${mismatches.length === 0 ? "[]" : JSON.stringify(mismatches)}`);

// ============================================================
// STEP 7: HEALTH + FRESHNESS CHECK
// ============================================================

section("STEP 7 — Health + freshness check");

const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
const isHealthy = decoded.health_status === HealthStatus.HEALTHY && nowSeconds <= decoded.valid_until;
const healthStatusStr = HealthStatus[decoded.health_status] ?? "UNKNOWN";
const isFresh = nowSeconds <= decoded.valid_until;

console.log(`  is_healthy:  ${isHealthy}`);
console.log(`  status:      ${healthStatusStr}`);
console.log(`  is_fresh:    ${isFresh}`);
console.log(`  now (unix):  ${nowSeconds}`);
console.log(`  valid_until: ${decoded.valid_until}`);

assert(typeof isHealthy === "boolean", "is_healthy computed");
assert(typeof isFresh === "boolean", "is_fresh computed");
assert(healthStatusStr === epochPayload.health_status, `health status string matches backend output (${healthStatusStr})`);

// ============================================================
// STEP 8: DETERMINISM CHECK (encode twice → same bytes)
// ============================================================

section("STEP 8 — Determinism check");

const encoded2 = encodeState(algoPayload, insolvencyFlag, liquidityStressFlag);
const bytesMatch = encoded.length === encoded2.length &&
  encoded.every((b, i) => b === encoded2[i]);
assert(bytesMatch, "encodeState is deterministic (identical output for identical input)");

// ============================================================
// FINAL REPORT
// ============================================================

section("TEST REPORT SUMMARY");

console.log(`  Total assertions: ${passCount + failCount}`);
console.log(`  Passed:           ${passCount}`);
console.log(`  Failed:           ${failCount}`);

if (failures.length > 0) {
  console.log(`\n  FAILURES:`);
  failures.forEach((f) => console.log(`    - ${f}`));
}

console.log(`\n  Pipeline: backend → adapter → encode → decode → verify`);
console.log(`  Result:   ${failCount === 0 ? "ALL PASS ✅" : "SOME FAILURES ❌"}`);
console.log(`${"═".repeat(60)}\n`);

process.exit(failCount > 0 ? 1 : 0);
