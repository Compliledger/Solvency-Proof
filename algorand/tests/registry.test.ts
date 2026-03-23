/**
 * algorand/tests/registry.test.ts
 *
 * Vitest unit tests for the Algorand Solvent Registry client and types.
 *
 * These tests run entirely in-process without a live Algorand node.
 * The algosdk Algodv2 client is mocked where needed.
 *
 * Coverage:
 *   - HealthStatus enum values
 *   - toAlgorandSolventRegistryPayload() field mapping and conversions
 *   - encodeState() / decodeState() round-trips
 *   - Flag derivation (insolvency_flag, liquidity_stress_flag)
 *   - SolventRegistryClient.isHealthy() logic
 *   - SolventRegistryClient.getHealthStatus() expiry detection
 *   - getLatestState() / getEpochRecord() return null on missing box
 *   - Box key derivation helpers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  HealthStatus,
  AMOUNT_SCALE,
  HEALTH_STATUS_STRING_MAP,
  makeLatestBoxKey,
  makeEpochBoxKey,
  BOX_KEY_ENTITY_PREFIX,
  BOX_KEY_LATEST_SUFFIX,
  BOX_KEY_EPOCH_INFIX,
} from "../types/registry.js";
import type { CanonicalEpochObject, AlgorandRegistryPayload } from "../types/registry.js";
import {
  toAlgorandSolventRegistryPayload,
  encodeState,
  decodeState,
  SolventRegistryClient,
} from "../client/registry_client.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SAMPLE_EPOCH: CanonicalEpochObject = {
  entity_id: "entity-001",
  epoch_id: "epoch-2026-03-23T18:00:00Z",
  liability_root: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd",
  reserve_root: "0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4",
  reserve_snapshot_hash:
    "0x789abcdef123789abcdef123789abcdef123789abcdef123789abcdef123789a",
  proof_hash: "0x112233445566112233445566112233445566112233445566112233445566aabb",
  reserves_total: 12_500_000.0,
  total_liabilities: 10_000_000.0,
  near_term_liabilities_total: 2_500_000.0,
  liquid_assets_total: 3_000_000.0,
  capital_backed: true,
  liquidity_ready: true,
  health_status: "HEALTHY",
  timestamp: "2026-03-23T18:00:00Z",
  valid_until: "2026-03-24T18:00:00Z",
  adapter_version: "algorand-adapter@0.1.0",
  source_type: "csv+json",
};

// Unix seconds for the sample timestamps
const SAMPLE_TS_SECONDS = BigInt(Math.floor(new Date("2026-03-23T18:00:00Z").getTime() / 1000));
const SAMPLE_VU_SECONDS = BigInt(Math.floor(new Date("2026-03-24T18:00:00Z").getTime() / 1000));

// ---------------------------------------------------------------------------
// HealthStatus enum
// ---------------------------------------------------------------------------

describe("HealthStatus enum", () => {
  it("has value 0 for UNKNOWN", () => expect(HealthStatus.UNKNOWN).toBe(0));
  it("has value 1 for HEALTHY", () => expect(HealthStatus.HEALTHY).toBe(1));
  it("has value 2 for LIQUIDITY_STRESSED", () =>
    expect(HealthStatus.LIQUIDITY_STRESSED).toBe(2));
  it("has value 3 for UNDERCOLLATERALIZED", () =>
    expect(HealthStatus.UNDERCOLLATERALIZED).toBe(3));
  it("has value 4 for CRITICAL", () => expect(HealthStatus.CRITICAL).toBe(4));
  it("has value 5 for EXPIRED", () => expect(HealthStatus.EXPIRED).toBe(5));

  it("maps all five string keys correctly via HEALTH_STATUS_STRING_MAP", () => {
    expect(HEALTH_STATUS_STRING_MAP["UNKNOWN"]).toBe(HealthStatus.UNKNOWN);
    expect(HEALTH_STATUS_STRING_MAP["HEALTHY"]).toBe(HealthStatus.HEALTHY);
    expect(HEALTH_STATUS_STRING_MAP["LIQUIDITY_STRESSED"]).toBe(HealthStatus.LIQUIDITY_STRESSED);
    expect(HEALTH_STATUS_STRING_MAP["UNDERCOLLATERALIZED"]).toBe(HealthStatus.UNDERCOLLATERALIZED);
    expect(HEALTH_STATUS_STRING_MAP["CRITICAL"]).toBe(HealthStatus.CRITICAL);
    expect(HEALTH_STATUS_STRING_MAP["EXPIRED"]).toBe(HealthStatus.EXPIRED);
  });
});

// ---------------------------------------------------------------------------
// toAlgorandSolventRegistryPayload
// ---------------------------------------------------------------------------

describe("toAlgorandSolventRegistryPayload", () => {
  let payload: AlgorandRegistryPayload;

  beforeEach(() => {
    payload = toAlgorandSolventRegistryPayload(SAMPLE_EPOCH);
  });

  it("preserves entity_id and epoch_id verbatim", () => {
    expect(payload.entity_id).toBe(SAMPLE_EPOCH.entity_id);
    expect(payload.epoch_id).toBe(SAMPLE_EPOCH.epoch_id);
  });

  it("preserves hash strings verbatim", () => {
    expect(payload.liability_root).toBe(SAMPLE_EPOCH.liability_root);
    expect(payload.reserve_root).toBe(SAMPLE_EPOCH.reserve_root);
    expect(payload.reserve_snapshot_hash).toBe(SAMPLE_EPOCH.reserve_snapshot_hash);
    expect(payload.proof_hash).toBe(SAMPLE_EPOCH.proof_hash);
  });

  it("converts health_status string to numeric enum", () => {
    expect(payload.health_status).toBe(HealthStatus.HEALTHY);
  });

  it("converts reserves_total float to bigint micro-units", () => {
    const expected = BigInt(Math.round(12_500_000.0 * Number(AMOUNT_SCALE)));
    expect(payload.reserves_total).toBe(expected);
  });

  it("converts liquid_assets_total float to bigint micro-units", () => {
    const expected = BigInt(Math.round(3_000_000.0 * Number(AMOUNT_SCALE)));
    expect(payload.liquid_assets_total).toBe(expected);
  });

  it("converts near_term_liabilities_total float to bigint micro-units", () => {
    const expected = BigInt(Math.round(2_500_000.0 * Number(AMOUNT_SCALE)));
    expect(payload.near_term_liabilities_total).toBe(expected);
  });

  it("converts timestamp ISO string to unix seconds bigint", () => {
    expect(payload.timestamp).toBe(SAMPLE_TS_SECONDS);
  });

  it("converts valid_until ISO string to unix seconds bigint", () => {
    expect(payload.valid_until).toBe(SAMPLE_VU_SECONDS);
  });

  it("preserves capital_backed and liquidity_ready booleans", () => {
    expect(payload.capital_backed).toBe(true);
    expect(payload.liquidity_ready).toBe(true);
  });

  it("maps LIQUIDITY_STRESSED string correctly", () => {
    const p = toAlgorandSolventRegistryPayload({
      ...SAMPLE_EPOCH,
      health_status: "LIQUIDITY_STRESSED",
    });
    expect(p.health_status).toBe(HealthStatus.LIQUIDITY_STRESSED);
  });

  it("maps UNDERCOLLATERALIZED string correctly", () => {
    const p = toAlgorandSolventRegistryPayload({
      ...SAMPLE_EPOCH,
      health_status: "UNDERCOLLATERALIZED",
    });
    expect(p.health_status).toBe(HealthStatus.UNDERCOLLATERALIZED);
  });

  it("maps CRITICAL string correctly", () => {
    const p = toAlgorandSolventRegistryPayload({
      ...SAMPLE_EPOCH,
      health_status: "CRITICAL",
    });
    expect(p.health_status).toBe(HealthStatus.CRITICAL);
  });

  it("defaults to UNKNOWN for unrecognised health_status string", () => {
    const p = toAlgorandSolventRegistryPayload({
      ...SAMPLE_EPOCH,
      health_status: "BOGUS_STATUS",
    });
    expect(p.health_status).toBe(HealthStatus.UNKNOWN);
  });
});

// ---------------------------------------------------------------------------
// encodeState / decodeState round-trip
// ---------------------------------------------------------------------------

describe("encodeState / decodeState round-trip", () => {
  const buildPayload = (overrides: Partial<AlgorandRegistryPayload> = {}): AlgorandRegistryPayload => ({
    entity_id: "entity-001",
    epoch_id: "epoch-2026-03-23T18:00:00Z",
    liability_root: "0xabc123",
    reserve_root: "0xdef456",
    reserve_snapshot_hash: "0x789abc",
    proof_hash: "0x112233",
    reserves_total: 12_500_000_000_000n,
    liquid_assets_total: 3_000_000_000_000n,
    near_term_liabilities_total: 2_500_000_000_000n,
    capital_backed: true,
    liquidity_ready: true,
    health_status: HealthStatus.HEALTHY,
    timestamp: SAMPLE_TS_SECONDS,
    valid_until: SAMPLE_VU_SECONDS,
    ...overrides,
  });

  it("round-trips a healthy state without data loss", () => {
    const payload = buildPayload();
    const encoded = encodeState(payload, false, false);
    const decoded = decodeState(encoded);

    expect(decoded.entity_id).toBe(payload.entity_id);
    expect(decoded.epoch_id).toBe(payload.epoch_id);
    expect(decoded.liability_root).toBe(payload.liability_root);
    expect(decoded.reserve_root).toBe(payload.reserve_root);
    expect(decoded.reserve_snapshot_hash).toBe(payload.reserve_snapshot_hash);
    expect(decoded.proof_hash).toBe(payload.proof_hash);
    expect(decoded.reserves_total).toBe(payload.reserves_total);
    expect(decoded.liquid_assets_total).toBe(payload.liquid_assets_total);
    expect(decoded.near_term_liabilities_total).toBe(payload.near_term_liabilities_total);
    expect(decoded.capital_backed).toBe(true);
    expect(decoded.liquidity_ready).toBe(true);
    expect(decoded.health_status).toBe(HealthStatus.HEALTHY);
    expect(decoded.timestamp).toBe(payload.timestamp);
    expect(decoded.valid_until).toBe(payload.valid_until);
    expect(decoded.insolvency_flag).toBe(false);
    expect(decoded.liquidity_stress_flag).toBe(false);
  });

  it("encodes zero amounts correctly", () => {
    const payload = buildPayload({
      reserves_total: 0n,
      liquid_assets_total: 0n,
      near_term_liabilities_total: 0n,
    });
    const decoded = decodeState(encodeState(payload, false, false));
    expect(decoded.reserves_total).toBe(0n);
    expect(decoded.liquid_assets_total).toBe(0n);
    expect(decoded.near_term_liabilities_total).toBe(0n);
  });

  it("produces deterministic output for identical inputs", () => {
    const payload = buildPayload();
    const a = encodeState(payload, false, false);
    const b = encodeState(payload, false, false);
    expect(a).toEqual(b);
  });

  it("different epoch_ids produce different encodings", () => {
    const a = encodeState(buildPayload({ epoch_id: "epoch-1" }), false, false);
    const b = encodeState(buildPayload({ epoch_id: "epoch-2" }), false, false);
    expect(a).not.toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// Flag derivation
// ---------------------------------------------------------------------------

describe("flag derivation in encodeState/decodeState", () => {
  const base: AlgorandRegistryPayload = {
    entity_id: "entity-001",
    epoch_id: "epoch-1",
    liability_root: "0xabc",
    reserve_root: "0xdef",
    reserve_snapshot_hash: "0x123",
    proof_hash: "0x456",
    reserves_total: 1_000n,
    liquid_assets_total: 1_000n,
    near_term_liabilities_total: 1_000n,
    capital_backed: true,
    liquidity_ready: true,
    health_status: HealthStatus.HEALTHY,
    timestamp: SAMPLE_TS_SECONDS,
    valid_until: SAMPLE_VU_SECONDS,
  };

  it("insolvency_flag is false when capital_backed = true", () => {
    const decoded = decodeState(encodeState({ ...base, capital_backed: true }, false, false));
    expect(decoded.insolvency_flag).toBe(false);
  });

  it("insolvency_flag is true when capital_backed = false", () => {
    const decoded = decodeState(encodeState({ ...base, capital_backed: false }, true, false));
    expect(decoded.insolvency_flag).toBe(true);
  });

  it("liquidity_stress_flag is false when liquidity_ready = true", () => {
    const decoded = decodeState(encodeState({ ...base, liquidity_ready: true }, false, false));
    expect(decoded.liquidity_stress_flag).toBe(false);
  });

  it("liquidity_stress_flag is true when liquidity_ready = false", () => {
    const decoded = decodeState(encodeState({ ...base, liquidity_ready: false }, false, true));
    expect(decoded.liquidity_stress_flag).toBe(true);
  });

  it("both flags are true for a CRITICAL epoch", () => {
    const decoded = decodeState(
      encodeState(
        { ...base, capital_backed: false, liquidity_ready: false },
        true,
        true
      )
    );
    expect(decoded.insolvency_flag).toBe(true);
    expect(decoded.liquidity_stress_flag).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Box key helpers
// ---------------------------------------------------------------------------

describe("box key helpers", () => {
  const dec = new TextDecoder();

  it("makeLatestBoxKey produces 'entity:{id}:latest'", () => {
    const key = makeLatestBoxKey("entity-001");
    expect(dec.decode(key)).toBe("entity:entity-001:latest");
  });

  it("makeEpochBoxKey produces 'entity:{id}:epoch:{epochId}'", () => {
    const key = makeEpochBoxKey("entity-001", "epoch-2026-03-23T18:00:00Z");
    expect(dec.decode(key)).toBe("entity:entity-001:epoch:epoch-2026-03-23T18:00:00Z");
  });

  it("different entity IDs produce different latest keys", () => {
    const a = dec.decode(makeLatestBoxKey("entity-001"));
    const b = dec.decode(makeLatestBoxKey("entity-002"));
    expect(a).not.toBe(b);
  });

  it("different epoch IDs produce different epoch keys", () => {
    const a = dec.decode(makeEpochBoxKey("entity-001", "epoch-1"));
    const b = dec.decode(makeEpochBoxKey("entity-001", "epoch-2"));
    expect(a).not.toBe(b);
  });

  it("BOX_KEY constants are consistent with generated keys", () => {
    const entityId = "entity-001";
    const manual = `${BOX_KEY_ENTITY_PREFIX}${entityId}${BOX_KEY_LATEST_SUFFIX}`;
    expect(manual).toBe("entity:entity-001:latest");

    const epochId = "epoch-1";
    const manualEpoch = `${BOX_KEY_ENTITY_PREFIX}${entityId}${BOX_KEY_EPOCH_INFIX}${epochId}`;
    expect(manualEpoch).toBe("entity:entity-001:epoch:epoch-1");
  });
});

// ---------------------------------------------------------------------------
// SolventRegistryClient – read methods (mocked algosdk)
// ---------------------------------------------------------------------------

describe("SolventRegistryClient", () => {
  const APP_ID = 12345n;

  /** Builds a minimal mock algosdk Algodv2 instance. */
  function makeMockAlgod(boxValue?: Uint8Array) {
    const mockGetBoxByName = vi.fn();

    if (boxValue) {
      mockGetBoxByName.mockReturnValue({
        do: () => Promise.resolve({ value: boxValue }),
      });
    } else {
      mockGetBoxByName.mockReturnValue({
        do: () => Promise.reject(new Error("Box not found")),
      });
    }

    return {
      getApplicationBoxByName: mockGetBoxByName,
      getTransactionParams: vi.fn().mockReturnValue({ do: () => Promise.resolve({}) }),
    };
  }

  function buildClient(algod: ReturnType<typeof makeMockAlgod>) {
    const client = new SolventRegistryClient({
      nodeUrl: "https://testnet-api.algonode.cloud",
      appId: APP_ID,
    });
    // Inject mock algod
    (client as unknown as { algodClient: unknown }).algodClient = algod;
    return client;
  }

  const healthyPayload: AlgorandRegistryPayload = {
    entity_id: "entity-001",
    epoch_id: "epoch-2026-03-23T18:00:00Z",
    liability_root: "0xabc",
    reserve_root: "0xdef",
    reserve_snapshot_hash: "0x123",
    proof_hash: "0x456",
    reserves_total: 12_500_000_000_000n,
    liquid_assets_total: 3_000_000_000_000n,
    near_term_liabilities_total: 2_500_000_000_000n,
    capital_backed: true,
    liquidity_ready: true,
    health_status: HealthStatus.HEALTHY,
    timestamp: SAMPLE_TS_SECONDS,
    valid_until: SAMPLE_VU_SECONDS,
  };

  // Encode a sample state that reports as healthy and non-expired
  // Use a valid_until far in the future so the test never expires
  const farFuture = BigInt(Math.floor(new Date("2099-01-01T00:00:00Z").getTime() / 1000));
  const freshPayload = { ...healthyPayload, valid_until: farFuture };
  const freshEncoded = encodeState(freshPayload, false, false);

  it("getLatestState returns null when box does not exist", async () => {
    const client = buildClient(makeMockAlgod(/* no value */));
    const result = await client.getLatestState("entity-001");
    expect(result).toBeNull();
  });

  it("getLatestState returns decoded state when box exists", async () => {
    const client = buildClient(makeMockAlgod(freshEncoded));
    const result = await client.getLatestState("entity-001");
    expect(result).not.toBeNull();
    expect(result!.entity_id).toBe("entity-001");
    expect(result!.health_status).toBe(HealthStatus.HEALTHY);
  });

  it("getEpochRecord returns null when box does not exist", async () => {
    const client = buildClient(makeMockAlgod(/* no value */));
    const result = await client.getEpochRecord("entity-001", "epoch-1");
    expect(result).toBeNull();
  });

  it("getEpochRecord returns decoded record when box exists", async () => {
    const client = buildClient(makeMockAlgod(freshEncoded));
    const result = await client.getEpochRecord("entity-001", "epoch-2026-03-23T18:00:00Z");
    expect(result).not.toBeNull();
    expect(result!.epoch_id).toBe("epoch-2026-03-23T18:00:00Z");
  });

  it("isHealthy returns false when no state exists", async () => {
    const client = buildClient(makeMockAlgod());
    expect(await client.isHealthy("entity-001")).toBe(false);
  });

  it("isHealthy returns true for a healthy, non-expired state", async () => {
    const client = buildClient(makeMockAlgod(freshEncoded));
    expect(await client.isHealthy("entity-001")).toBe(true);
  });

  it("isHealthy returns false when health_status != HEALTHY", async () => {
    const criticalPayload = { ...freshPayload, health_status: HealthStatus.CRITICAL };
    const encoded = encodeState(criticalPayload, true, true);
    const client = buildClient(makeMockAlgod(encoded));
    expect(await client.isHealthy("entity-001")).toBe(false);
  });

  it("getHealthStatus returns UNKNOWN when no state exists", async () => {
    const client = buildClient(makeMockAlgod());
    expect(await client.getHealthStatus("entity-001")).toBe(HealthStatus.UNKNOWN);
  });

  it("getHealthStatus returns HEALTHY for a fresh healthy state", async () => {
    const client = buildClient(makeMockAlgod(freshEncoded));
    expect(await client.getHealthStatus("entity-001")).toBe(HealthStatus.HEALTHY);
  });

  it("getHealthStatus returns EXPIRED for a state past valid_until", async () => {
    const expiredPayload = {
      ...freshPayload,
      valid_until: 1n, // Unix second 1 = well in the past
    };
    const encoded = encodeState(expiredPayload, false, false);
    const client = buildClient(makeMockAlgod(encoded));
    expect(await client.getHealthStatus("entity-001")).toBe(HealthStatus.EXPIRED);
  });

  it("submitEpoch throws when signer is not configured", async () => {
    const client = buildClient(makeMockAlgod());
    await expect(client.submitEpoch(healthyPayload)).rejects.toThrow(
      "submitEpoch requires signer and senderAddress"
    );
  });
});

// ---------------------------------------------------------------------------
// Integration: toAlgorandSolventRegistryPayload → encodeState → decodeState
// ---------------------------------------------------------------------------

describe("end-to-end: canonical epoch → payload → encode → decode", () => {
  it("preserves all fields from the canonical epoch object through the full pipeline", () => {
    const payload = toAlgorandSolventRegistryPayload(SAMPLE_EPOCH);
    const insolvencyFlag = !payload.capital_backed;
    const liquidityStressFlag = !payload.liquidity_ready;
    const encoded = encodeState(payload, insolvencyFlag, liquidityStressFlag);
    const decoded = decodeState(encoded);

    expect(decoded.entity_id).toBe(SAMPLE_EPOCH.entity_id);
    expect(decoded.epoch_id).toBe(SAMPLE_EPOCH.epoch_id);
    expect(decoded.liability_root).toBe(SAMPLE_EPOCH.liability_root);
    expect(decoded.reserve_root).toBe(SAMPLE_EPOCH.reserve_root);
    expect(decoded.reserve_snapshot_hash).toBe(SAMPLE_EPOCH.reserve_snapshot_hash);
    expect(decoded.proof_hash).toBe(SAMPLE_EPOCH.proof_hash);
    expect(decoded.health_status).toBe(HealthStatus.HEALTHY);
    expect(decoded.capital_backed).toBe(true);
    expect(decoded.liquidity_ready).toBe(true);
    expect(decoded.insolvency_flag).toBe(false);
    expect(decoded.liquidity_stress_flag).toBe(false);
    expect(decoded.timestamp).toBe(SAMPLE_TS_SECONDS);
    expect(decoded.valid_until).toBe(SAMPLE_VU_SECONDS);
  });
});
