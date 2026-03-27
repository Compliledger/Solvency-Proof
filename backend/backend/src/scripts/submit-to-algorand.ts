/**
 * backend/src/scripts/submit-to-algorand.ts
 *
 * Submits the latest epoch to Algorand SolventRegistry contract.
 *
 * Prerequisites:
 *   - SOLVENT_REGISTRY_APP_ID environment variable
 *   - ALGO_MNEMONIC environment variable
 *   - latest_epoch.json exists in data/output/
 *
 * Usage:
 *   npx tsx src/scripts/submit-to-algorand.ts
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import algosdk from "algosdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import Algorand adapter functions
import {
  toAlgorandSolventRegistryPayload,
  encodeState,
  makeLatestBoxKey,
  makeEpochBoxKey,
} from "../../../../algorand/client/registry_client.js";

// ============================================================
// CONFIGURATION
// ============================================================

const SOLVENT_REGISTRY_APP_ID = process.env.SOLVENT_REGISTRY_APP_ID;
const ALGO_MNEMONIC = process.env.ALGO_MNEMONIC;
const ALGORAND_NODE_URL = process.env.ALGORAND_NODE_URL || "https://testnet-api.algonode.cloud";
const ALGORAND_NODE_TOKEN = process.env.ALGORAND_NODE_TOKEN || "";
const ALGORAND_NODE_PORT = process.env.ALGORAND_NODE_PORT || "";

if (!SOLVENT_REGISTRY_APP_ID) {
  console.error("❌ Error: SOLVENT_REGISTRY_APP_ID not set");
  console.error("   Deploy contract first: npx tsx algorand/scripts/deploy-contract.ts");
  process.exit(1);
}

if (!ALGO_MNEMONIC) {
  console.error("❌ Error: ALGO_MNEMONIC not set");
  console.error('   Export your mnemonic: export ALGO_MNEMONIC="word1 word2 ... word25"');
  process.exit(1);
}

const algodClient = new algosdk.Algodv2(
  ALGORAND_NODE_TOKEN,
  ALGORAND_NODE_URL,
  ALGORAND_NODE_PORT
);

const signerAccount = algosdk.mnemonicToSecretKey(ALGO_MNEMONIC);

// ============================================================
// LOAD EPOCH DATA
// ============================================================

function loadLatestEpoch() {
  const epochPath = path.resolve(__dirname, "../../../data/output/latest_epoch.json");
  const rawEpoch = JSON.parse(readFileSync(epochPath, "utf-8"));

  // Convert to canonical format expected by Algorand adapter
  return {
    entity_id: rawEpoch.entity_id,
    epoch_id: String(rawEpoch.epoch_id),
    liability_root: rawEpoch.liability_root,
    reserve_root: rawEpoch.reserve_root,
    reserve_snapshot_hash: rawEpoch.reserve_snapshot_hash,
    proof_hash: rawEpoch.proof_hash,
    reserves_total: Number(rawEpoch.reserves_total),
    total_liabilities: Number(rawEpoch.near_term_liabilities_total),
    near_term_liabilities_total: Number(rawEpoch.near_term_liabilities_total),
    liquid_assets_total: Number(rawEpoch.liquid_assets_total),
    capital_backed: rawEpoch.capital_backed,
    liquidity_ready: rawEpoch.liquidity_ready,
    health_status: rawEpoch.health_status,
    timestamp: new Date(rawEpoch.timestamp * 1000).toISOString(),
    valid_until: new Date(rawEpoch.valid_until * 1000).toISOString(),
    adapter_version: rawEpoch.adapter_version || "algorand-adapter-v1",
    source_type: "backend" as const,
  };
}

// ============================================================
// SUBMIT EPOCH TO ALGORAND
// ============================================================

async function submitEpoch() {
  console.log("\n" + "═".repeat(60));
  console.log("  Algorand Epoch Submission");
  console.log("═".repeat(60));

  const canonicalEpoch = loadLatestEpoch();
  console.log(`  Entity ID:      ${canonicalEpoch.entity_id}`);
  console.log(`  Epoch ID:       ${canonicalEpoch.epoch_id}`);
  console.log(`  Health Status:  ${canonicalEpoch.health_status}`);
  console.log(`  Network:        ${ALGORAND_NODE_URL}`);
  console.log(`  App ID:         ${SOLVENT_REGISTRY_APP_ID}`);

  // Convert to Algorand payload
  const algoPayload = toAlgorandSolventRegistryPayload(canonicalEpoch);
  const insolvencyFlag = !algoPayload.capital_backed;
  const liquidityStressFlag = !algoPayload.liquidity_ready;

  // Encode state for box storage
  const encodedState = encodeState(algoPayload, insolvencyFlag, liquidityStressFlag);
  console.log(`  Encoded Size:   ${encodedState.length} bytes`);

  // Generate box keys
  const latestBoxKey = makeLatestBoxKey(algoPayload.entity_id);
  const epochBoxKey = makeEpochBoxKey(algoPayload.entity_id, algoPayload.epoch_id);

  console.log("\n" + "─".repeat(60));
  console.log("  Submitting to Algorand...");
  console.log("─".repeat(60));

  const params = await algodClient.getTransactionParams().do();
  const appId = Number(SOLVENT_REGISTRY_APP_ID);

  // Calculate box MBR (Minimum Balance Requirement)
  const boxMBR = 2500 + 400 * encodedState.length; // 2500 base + 400 per byte

  // Create application call transaction
  const txn = algosdk.makeApplicationCallTxnFromObject({
    from: signerAccount.addr,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new TextEncoder().encode("submit_epoch"), // Method selector
      encodedState, // Encoded epoch state
    ],
    boxes: [
      { appIndex: appId, name: latestBoxKey },
      { appIndex: appId, name: epochBoxKey },
    ],
    suggestedParams: {
      ...params,
      fee: 2000, // Increased fee for box operations
      flatFee: true,
    },
  });

  // Fund contract for box storage if needed
  const appAddress = algosdk.getApplicationAddress(appId);
  const appAccountInfo = await algodClient.accountInformation(appAddress).do();
  const currentBalance = appAccountInfo.amount;
  const requiredBalance = appAccountInfo["min-balance"] + boxMBR * 2; // 2 boxes

  if (currentBalance < requiredBalance) {
    console.log(`  Funding contract for box storage...`);
    const fundAmount = requiredBalance - currentBalance + 100_000; // Extra buffer

    const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: signerAccount.addr,
      to: appAddress,
      amount: fundAmount,
      suggestedParams: params,
    });

    const signedFundTxn = fundTxn.signTxn(signerAccount.sk);
    const fundResult = await algodClient.sendRawTransaction(signedFundTxn).do();
    await algosdk.waitForConfirmation(algodClient, fundResult.txId, 4);
    console.log(`  ✅ Contract funded with ${fundAmount / 1_000_000} ALGO`);
  }

  // Sign and submit the application call
  const signedTxn = txn.signTxn(signerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

  console.log(`  Transaction ID: ${txId}`);
  console.log("  Waiting for confirmation...");

  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  const confirmedRound = confirmedTxn["confirmed-round"];

  console.log(`\n  ✅ Epoch submitted successfully!`);
  console.log(`  Confirmed Round: ${confirmedRound}`);
  console.log(`  Explorer:        https://testnet.explorer.perawallet.app/tx/${txId}`);

  // Save submission result
  const submissionResult = {
    success: true,
    tx_id: txId,
    confirmed_round: confirmedRound,
    app_id: SOLVENT_REGISTRY_APP_ID,
    entity_id: canonicalEpoch.entity_id,
    epoch_id: canonicalEpoch.epoch_id,
    health_status: canonicalEpoch.health_status,
    submitted_at: new Date().toISOString(),
    network: ALGORAND_NODE_URL.includes("testnet") ? "testnet" : "mainnet",
  };

  const outputPath = path.resolve(__dirname, "../../../data/output/algorand_submission.json");
  writeFileSync(outputPath, JSON.stringify(submissionResult, null, 2));
  console.log(`\n  ✅ Submission result saved to: algorand_submission.json`);

  console.log("\n" + "═".repeat(60) + "\n");

  return submissionResult;
}

// ============================================================
// MAIN
// ============================================================

submitEpoch().catch((err) => {
  console.error("\n❌ Submission failed:", err);
  process.exit(1);
});
