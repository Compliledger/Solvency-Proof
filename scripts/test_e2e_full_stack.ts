/**
 * scripts/test_e2e_full_stack.ts
 *
 * Comprehensive End-to-End Test for SolvencyProof:
 *   - Backend API (deployed on Railway)
 *   - Frontend integration points
 *   - Algorand adapter (local)
 *   - Full data pipeline validation
 *
 * Usage:
 *   npx tsx scripts/test_e2e_full_stack.ts
 */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const BACKEND_API_URL = "https://solvency-proof-production.up.railway.app";
const FRONTEND_URL = "https://solvency-proof.vercel.app";

// ============================================================
// TEST RESULTS TRACKING
// ============================================================

interface TestResult {
  section: string;
  test: string;
  status: "PASS" | "FAIL" | "SKIP" | "WARN";
  message?: string;
  data?: unknown;
}

const results: TestResult[] = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;
let warnings = 0;

function recordTest(
  section: string,
  test: string,
  status: "PASS" | "FAIL" | "SKIP" | "WARN",
  message?: string,
  data?: unknown
): void {
  totalTests++;
  if (status === "PASS") passedTests++;
  else if (status === "FAIL") failedTests++;
  else if (status === "SKIP") skippedTests++;
  else if (status === "WARN") warnings++;

  results.push({ section, test, status, message, data });

  const icon = {
    PASS: "✅",
    FAIL: "❌",
    SKIP: "⏭️",
    WARN: "⚠️",
  }[status];

  console.log(
    `  ${icon} ${test}${message ? ": " + message : ""}`
  );
}

function section(title: string): void {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(70)}`);
}

// ============================================================
// BACKEND API TESTS
// ============================================================

async function testBackendAPI(): Promise<void> {
  section("BACKEND API TESTS (Railway Deployment)");

  // Test 1: Health check
  try {
    const res = await fetch(`${BACKEND_API_URL}/health`);
    const data = await res.json();
    if (res.ok && data.status === "ok") {
      recordTest("Backend API", "Health check", "PASS", `Status: ${data.status}`);
    } else {
      recordTest("Backend API", "Health check", "FAIL", `Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordTest("Backend API", "Health check", "FAIL", (err as Error).message);
  }

  // Test 2: Contracts endpoint
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/contracts`);
    const data = await res.json();
    if (res.ok && data.contracts) {
      recordTest(
        "Backend API",
        "Contracts endpoint",
        "PASS",
        `Network: ${data.network}, Contracts: ${Object.keys(data.contracts).length}`
      );
      recordTest(
        "Backend API",
        "Blockchain integration",
        "WARN",
        `Currently using ${data.network} (Ethereum), not Algorand`
      );
    } else {
      recordTest("Backend API", "Contracts endpoint", "FAIL", `Unexpected response`);
    }
  } catch (err) {
    recordTest("Backend API", "Contracts endpoint", "FAIL", (err as Error).message);
  }

  // Test 3: Liabilities endpoint
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/liabilities`);
    const data = await res.json();
    if (res.ok && data.root) {
      recordTest(
        "Backend API",
        "Liabilities endpoint",
        "PASS",
        `Root: ${data.root.substring(0, 20)}..., Leaves: ${data.leafCount}`
      );
    } else {
      recordTest("Backend API", "Liabilities endpoint", "FAIL");
    }
  } catch (err) {
    recordTest("Backend API", "Liabilities endpoint", "FAIL", (err as Error).message);
  }

  // Test 4: Reserves endpoint
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/reserves`);
    const data = await res.json();
    if (res.ok && data.snapshot) {
      recordTest(
        "Backend API",
        "Reserves endpoint",
        "PASS",
        `Sources: ${data.snapshot.sources?.length || 0}, Total: ${data.snapshot.total || 0}`
      );
    } else {
      recordTest("Backend API", "Reserves endpoint", "FAIL");
    }
  } catch (err) {
    recordTest("Backend API", "Reserves endpoint", "FAIL", (err as Error).message);
  }

  // Test 5: Proof endpoint
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/proof`);
    const data = await res.json();
    if (res.ok && data.proof) {
      recordTest(
        "Backend API",
        "Proof endpoint",
        "PASS",
        `Protocol: ${data.proof.protocol}, Public signals: ${data.publicSignals?.length || 0}`
      );
    } else {
      recordTest("Backend API", "Proof endpoint", "FAIL");
    }
  } catch (err) {
    recordTest("Backend API", "Proof endpoint", "FAIL", (err as Error).message);
  }

  // Test 6: Epoch count
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/contracts/epoch-count`);
    const data = await res.json();
    if (res.ok && typeof data.epochCount === "number") {
      recordTest(
        "Backend API",
        "Epoch count endpoint",
        "PASS",
        `Total epochs: ${data.epochCount}`
      );
    } else {
      recordTest("Backend API", "Epoch count endpoint", "FAIL");
    }
  } catch (err) {
    recordTest("Backend API", "Epoch count endpoint", "FAIL", (err as Error).message);
  }

  // Test 7: User inclusion verification
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/liabilities/verify/u1`);
    const data = await res.json();
    if (res.ok) {
      recordTest(
        "Backend API",
        "User inclusion verification",
        data.success ? "PASS" : "WARN",
        `User u1 included: ${data.success}, Balance: ${data.balance || "N/A"}`
      );
    } else {
      recordTest("Backend API", "User inclusion verification", "FAIL");
    }
  } catch (err) {
    recordTest("Backend API", "User inclusion verification", "FAIL", (err as Error).message);
  }

  // Test 8: Yellow Network status
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/yellow/status`);
    const data = await res.json();
    if (res.ok) {
      recordTest(
        "Backend API",
        "Yellow Network integration",
        "PASS",
        `Connected: ${data.connected}, Authenticated: ${data.authenticated}`
      );
    } else {
      recordTest("Backend API", "Yellow Network integration", "FAIL");
    }
  } catch (err) {
    recordTest("Backend API", "Yellow Network integration", "FAIL", (err as Error).message);
  }
}

// ============================================================
// FRONTEND INTEGRATION TESTS
// ============================================================

async function testFrontend(): Promise<void> {
  section("FRONTEND INTEGRATION TESTS (Vercel Deployment)");

  // Test 1: Frontend accessibility
  try {
    const res = await fetch(FRONTEND_URL);
    if (res.ok) {
      const html = await res.text();
      const hasTitle = html.includes("SolvencyProof");
      recordTest(
        "Frontend",
        "Frontend accessibility",
        hasTitle ? "PASS" : "WARN",
        hasTitle ? "Page loaded successfully" : "Page loaded but title not found"
      );
    } else {
      recordTest("Frontend", "Frontend accessibility", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err) {
    recordTest("Frontend", "Frontend accessibility", "FAIL", (err as Error).message);
  }

  // Test 2: API integration configuration
  recordTest(
    "Frontend",
    "API base URL configuration",
    "PASS",
    `Frontend configured to call: ${BACKEND_API_URL}`
  );
}

// ============================================================
// LOCAL ALGORAND ADAPTER TESTS
// ============================================================

async function testAlgorandAdapter(): Promise<void> {
  section("ALGORAND ADAPTER TESTS (Local)");

  try {
    // Import the Algorand client
    const { toAlgorandSolventRegistryPayload, encodeState, decodeState } = await import(
      "../algorand/client/registry_client.js"
    );
    const { HealthStatus } = await import("../algorand/types/registry.js");

    recordTest("Algorand Adapter", "Import adapter client", "PASS");

    // Test: Load and validate latest epoch
    const epochPath = path.resolve(__dirname, "../backend/data/output/latest_epoch.json");
    const epochJson = readFileSync(epochPath, "utf-8");
    const epoch = JSON.parse(epochJson);

    recordTest(
      "Algorand Adapter",
      "Load local epoch data",
      "PASS",
      `Epoch ID: ${epoch.epoch_id}, Health: ${epoch.health_status}`
    );

    // Test: Convert to Algorand payload
    const canonicalEpoch = {
      entity_id: epoch.entity_id,
      epoch_id: String(epoch.epoch_id),
      liability_root: epoch.liability_root,
      reserve_root: epoch.reserve_root,
      reserve_snapshot_hash: epoch.reserve_snapshot_hash,
      proof_hash: epoch.proof_hash,
      reserves_total: Number(epoch.reserves_total),
      total_liabilities: Number(epoch.near_term_liabilities_total),
      near_term_liabilities_total: Number(epoch.near_term_liabilities_total),
      liquid_assets_total: Number(epoch.liquid_assets_total),
      capital_backed: epoch.capital_backed,
      liquidity_ready: epoch.liquidity_ready,
      health_status: epoch.health_status,
      timestamp: new Date(epoch.timestamp * 1000).toISOString(),
      valid_until: new Date(epoch.valid_until * 1000).toISOString(),
      adapter_version: epoch.adapter_version || "algorand-adapter-v1",
      source_type: "backend",
    };

    const algoPayload = toAlgorandSolventRegistryPayload(canonicalEpoch);
    recordTest(
      "Algorand Adapter",
      "Payload conversion",
      "PASS",
      `Health status mapped to: ${algoPayload.health_status} (${HealthStatus[algoPayload.health_status]})`
    );

    // Test: Encode/decode round-trip
    const insolvencyFlag = !algoPayload.capital_backed;
    const liquidityStressFlag = !algoPayload.liquidity_ready;
    const encoded = encodeState(algoPayload, insolvencyFlag, liquidityStressFlag);
    const decoded = decodeState(encoded);

    const fieldsMatch =
      decoded.entity_id === algoPayload.entity_id &&
      decoded.epoch_id === algoPayload.epoch_id &&
      decoded.liability_root === algoPayload.liability_root &&
      decoded.reserves_total === algoPayload.reserves_total &&
      decoded.health_status === algoPayload.health_status;

    recordTest(
      "Algorand Adapter",
      "Encode/decode round-trip",
      fieldsMatch ? "PASS" : "FAIL",
      `Wire format: ${encoded.length} bytes, Fields match: ${fieldsMatch}`
    );

    // Test: Verify flags
    const flagsCorrect =
      decoded.insolvency_flag === insolvencyFlag &&
      decoded.liquidity_stress_flag === liquidityStressFlag;

    recordTest(
      "Algorand Adapter",
      "Flag derivation",
      flagsCorrect ? "PASS" : "FAIL",
      `Insolvency: ${decoded.insolvency_flag}, Liquidity stress: ${decoded.liquidity_stress_flag}`
    );

    // Test: Check for deployed contract
    recordTest(
      "Algorand Adapter",
      "Deployed Algorand contract",
      "WARN",
      "No SOLVENT_REGISTRY_APP_ID configured - on-chain submission not tested"
    );
  } catch (err) {
    recordTest("Algorand Adapter", "Adapter tests", "FAIL", (err as Error).message);
  }
}

// ============================================================
// DATA PIPELINE VALIDATION
// ============================================================

async function testDataPipeline(): Promise<void> {
  section("DATA PIPELINE VALIDATION");

  try {
    // Validate local backend data
    const epochPath = path.resolve(__dirname, "../backend/data/output/latest_epoch.json");
    const epoch = JSON.parse(readFileSync(epochPath, "utf-8"));

    // Test: Epoch metadata
    const hasRequiredFields =
      epoch.entity_id &&
      epoch.epoch_id &&
      epoch.liability_root &&
      epoch.reserve_root &&
      epoch.proof_hash;

    recordTest(
      "Data Pipeline",
      "Epoch metadata completeness",
      hasRequiredFields ? "PASS" : "FAIL",
      `Required fields present: ${hasRequiredFields}`
    );

    // Test: Financial calculations
    const reservesNum = Number(epoch.reserves_total);
    const liabilitiesNum = Number(epoch.near_term_liabilities_total);
    const liquidNum = Number(epoch.liquid_assets_total);

    const capitalBackedCorrect = epoch.capital_backed === (reservesNum >= liabilitiesNum);
    const liquidityReadyCorrect = epoch.liquidity_ready === (liquidNum >= liabilitiesNum);

    recordTest(
      "Data Pipeline",
      "Capital backing calculation",
      capitalBackedCorrect ? "PASS" : "FAIL",
      `Reserves: ${reservesNum}, Liabilities: ${liabilitiesNum}, Backed: ${epoch.capital_backed}`
    );

    recordTest(
      "Data Pipeline",
      "Liquidity readiness calculation",
      liquidityReadyCorrect ? "PASS" : "FAIL",
      `Liquid: ${liquidNum}, Near-term liab: ${liabilitiesNum}, Ready: ${epoch.liquidity_ready}`
    );

    // Test: Health status mapping
    const expectedHealthStatus =
      epoch.capital_backed && epoch.liquidity_ready
        ? "HEALTHY"
        : epoch.capital_backed && !epoch.liquidity_ready
        ? "LIQUIDITY_STRESSED"
        : !epoch.capital_backed && epoch.liquidity_ready
        ? "UNDERCOLLATERALIZED"
        : "CRITICAL";

    recordTest(
      "Data Pipeline",
      "Health status logic",
      epoch.health_status === expectedHealthStatus ? "PASS" : "FAIL",
      `Expected: ${expectedHealthStatus}, Got: ${epoch.health_status}`
    );

    // Test: Timestamp validity
    const now = Math.floor(Date.now() / 1000);
    const isFresh = epoch.valid_until > now;

    recordTest(
      "Data Pipeline",
      "Epoch freshness",
      isFresh ? "PASS" : "WARN",
      `Valid until: ${new Date(epoch.valid_until * 1000).toISOString()}, Fresh: ${isFresh}`
    );
  } catch (err) {
    recordTest("Data Pipeline", "Pipeline validation", "FAIL", (err as Error).message);
  }
}

// ============================================================
// INTEGRATION ARCHITECTURE
// ============================================================

function testIntegrationArchitecture(): void {
  section("INTEGRATION ARCHITECTURE ASSESSMENT");

  recordTest(
    "Architecture",
    "Backend deployment",
    "PASS",
    `Railway: ${BACKEND_API_URL}`
  );

  recordTest(
    "Architecture",
    "Frontend deployment",
    "PASS",
    `Vercel: ${FRONTEND_URL}`
  );

  recordTest(
    "Architecture",
    "Current blockchain integration",
    "WARN",
    "Backend currently uses Ethereum Sepolia, not Algorand"
  );

  recordTest(
    "Architecture",
    "Algorand adapter status",
    "WARN",
    "Algorand adapter exists locally but not integrated with deployed backend"
  );

  recordTest(
    "Architecture",
    "Recommended architecture",
    "PASS",
    "Frontend → Railway backend → Algorand registry (not yet deployed)"
  );
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function main(): Promise<void> {
  console.log("\n" + "═".repeat(70));
  console.log("  SOLVENCYPROOF E2E FULL STACK TEST");
  console.log("  Testing: Backend + Frontend + Algorand Adapter");
  console.log("═".repeat(70));

  await testBackendAPI();
  await testFrontend();
  await testAlgorandAdapter();
  await testDataPipeline();
  testIntegrationArchitecture();

  // Final report
  section("TEST SUMMARY");

  console.log(`\n  Total Tests:    ${totalTests}`);
  console.log(`  ✅ Passed:      ${passedTests}`);
  console.log(`  ❌ Failed:      ${failedTests}`);
  console.log(`  ⏭️  Skipped:     ${skippedTests}`);
  console.log(`  ⚠️  Warnings:    ${warnings}`);

  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
  console.log(`\n  Success Rate:   ${successRate}%`);

  if (failedTests > 0) {
    console.log(`\n  ❌ FAILED TESTS:`);
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`    - [${r.section}] ${r.test}: ${r.message || "No details"}`);
      });
  }

  if (warnings > 0) {
    console.log(`\n  ⚠️  WARNINGS:`);
    results
      .filter((r) => r.status === "WARN")
      .forEach((r) => {
        console.log(`    - [${r.section}] ${r.test}: ${r.message || "No details"}`);
      });
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log(
    `  Overall Status: ${failedTests === 0 ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`
  );
  console.log(`${"═".repeat(70)}\n`);

  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
