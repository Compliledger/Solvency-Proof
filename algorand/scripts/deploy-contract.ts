/**
 * algorand/scripts/deploy-contract.ts
 *
 * Deploys the SolventRegistry PyTeal smart contract to Algorand.
 *
 * Prerequisites:
 *   - ALGO_MNEMONIC environment variable (25-word mnemonic for deployer account)
 *   - ALGORAND_NODE_URL (default: Algorand testnet)
 *   - ALGORAND_INDEXER_URL (default: Algorand testnet indexer)
 *   - Deployer account must have sufficient ALGO balance for:
 *     - Contract creation (~0.1 ALGO)
 *     - Box storage MBR (~0.1 ALGO per box)
 *
 * Usage:
 *   # Deploy to testnet (default)
 *   ALGO_MNEMONIC="your 25 word mnemonic here" npx tsx scripts/deploy-contract.ts
 *
 *   # Deploy to mainnet
 *   ALGO_MNEMONIC="..." ALGORAND_NODE_URL=https://mainnet-api.algonode.cloud npx tsx scripts/deploy-contract.ts
 *
 * Output:
 *   - APP_ID printed to console
 *   - Deployment details saved to: deployment.json
 */

import algosdk from "algosdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const ALGO_MNEMONIC = process.env.ALGO_MNEMONIC;
const ALGORAND_NODE_URL = process.env.ALGORAND_NODE_URL || "https://testnet-api.algonode.cloud";
const ALGORAND_NODE_TOKEN = process.env.ALGORAND_NODE_TOKEN || "";
const ALGORAND_NODE_PORT = process.env.ALGORAND_NODE_PORT || "";

if (!ALGO_MNEMONIC) {
  console.error("❌ Error: ALGO_MNEMONIC environment variable not set");
  console.error("   Export your 25-word mnemonic:");
  console.error('   export ALGO_MNEMONIC="word1 word2 ... word25"');
  process.exit(1);
}

// ============================================================
// ALGORAND CLIENT SETUP
// ============================================================

const algodClient = new algosdk.Algodv2(
  ALGORAND_NODE_TOKEN,
  ALGORAND_NODE_URL,
  ALGORAND_NODE_PORT
);

const deployerAccount = algosdk.mnemonicToSecretKey(ALGO_MNEMONIC);

console.log("\n" + "═".repeat(60));
console.log("  Algorand SolventRegistry Contract Deployment");
console.log("═".repeat(60));
console.log(`  Network:        ${ALGORAND_NODE_URL}`);
console.log(`  Deployer:       ${deployerAccount.addr}`);

// ============================================================
// CHECK ACCOUNT BALANCE
// ============================================================

async function checkBalance(): Promise<void> {
  const accountInfo = await algodClient.accountInformation(deployerAccount.addr).do();
  const balance = accountInfo.amount / 1_000_000; // Convert microALGOs to ALGOs
  
  console.log(`  Balance:        ${balance.toFixed(6)} ALGO`);
  
  if (balance < 0.5) {
    console.error("\n❌ Error: Insufficient balance for deployment");
    console.error("   Minimum required: ~0.5 ALGO (contract creation + box MBR)");
    console.error("   Fund your account at: https://bank.testnet.algorand.network/");
    process.exit(1);
  }
}

// ============================================================
// LOAD COMPILED CONTRACT
// ============================================================

function loadCompiledContract(): { approval: Uint8Array; clear: Uint8Array } {
  const contractsDir = path.resolve(__dirname, "../contracts");
  const approvalPath = path.join(contractsDir, "solvent_registry_approval.teal.bin");
  const clearPath = path.join(contractsDir, "solvent_registry_clear.teal.bin");

  if (!existsSync(approvalPath) || !existsSync(clearPath)) {
    console.error("\n❌ Error: Compiled contract binaries not found");
    console.error("   Expected files:");
    console.error(`     - ${approvalPath}`);
    console.error(`     - ${clearPath}`);
    console.error("\n   Compile the PyTeal contract first:");
    console.error("     cd algorand/contracts");
    console.error("     python3 compile.py");
    process.exit(1);
  }

  return {
    approval: new Uint8Array(readFileSync(approvalPath)),
    clear: new Uint8Array(readFileSync(clearPath)),
  };
}

// ============================================================
// DEPLOY CONTRACT
// ============================================================

async function deployContract(): Promise<number> {
  console.log("\n" + "─".repeat(60));
  console.log("  Deploying Contract...");
  console.log("─".repeat(60));

  const { approval, clear } = loadCompiledContract();

  const params = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: deployerAccount.addr,
    suggestedParams: params,
    approvalProgram: approval,
    clearProgram: clear,
    numGlobalByteSlices: 0,
    numGlobalInts: 0,
    numLocalByteSlices: 0,
    numLocalInts: 0,
    extraPages: 3, // Increase available program space (4 pages total: 1 base + 3 extra = 8KB)
  });

  const signedTxn = txn.signTxn(deployerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

  console.log(`  Transaction ID: ${txId}`);
  console.log("  Waiting for confirmation...");

  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  const appId = confirmedTxn["application-index"];

  if (!appId) {
    throw new Error("Application ID not found in transaction confirmation");
  }

  console.log(`\n  ✅ Contract deployed successfully!`);
  console.log(`  Application ID: ${appId}`);

  return appId;
}

// ============================================================
// FUND CONTRACT FOR BOX STORAGE
// ============================================================

async function fundContractForBoxes(appId: number): Promise<void> {
  console.log("\n" + "─".repeat(60));
  console.log("  Funding Contract for Box Storage...");
  console.log("─".repeat(60));

  const appAddress = algosdk.getApplicationAddress(appId);
  const fundAmount = 500_000; // 0.5 ALGO for box MBR (covers ~2-3 boxes initially)

  const params = await algodClient.getTransactionParams().do();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: deployerAccount.addr,
    to: appAddress,
    amount: fundAmount,
    suggestedParams: params,
  });

  const signedTxn = txn.signTxn(deployerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

  console.log(`  Transaction ID: ${txId}`);
  console.log("  Waiting for confirmation...");

  await algosdk.waitForConfirmation(algodClient, txId, 4);

  console.log(`  ✅ Contract funded with ${fundAmount / 1_000_000} ALGO`);
  console.log(`  App Address:    ${appAddress}`);
}

// ============================================================
// SAVE DEPLOYMENT INFO
// ============================================================

function saveDeploymentInfo(appId: number): void {
  const deploymentInfo = {
    network: ALGORAND_NODE_URL.includes("testnet") ? "testnet" : "mainnet",
    app_id: appId,
    app_address: algosdk.getApplicationAddress(appId),
    deployer: deployerAccount.addr,
    deployed_at: new Date().toISOString(),
    node_url: ALGORAND_NODE_URL,
  };

  const outputPath = path.resolve(__dirname, "../deployment.json");
  writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n  ✅ Deployment info saved to: ${outputPath}`);
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  try {
    await checkBalance();

    const appId = await deployContract();
    await fundContractForBoxes(appId);
    saveDeploymentInfo(appId);

    console.log("\n" + "═".repeat(60));
    console.log("  DEPLOYMENT COMPLETE");
    console.log("═".repeat(60));
    console.log(`\n  📋 Application ID:  ${appId}`);
    console.log(`  🔗 Explorer:        https://testnet.explorer.perawallet.app/application/${appId}`);
    console.log(`\n  💡 Next Steps:`);
    console.log(`     1. Set environment variable:`);
    console.log(`        export SOLVENT_REGISTRY_APP_ID=${appId}`);
    console.log(`     2. Update backend configuration`);
    console.log(`     3. Test epoch submission:`);
    console.log(`        npx tsx scripts/submit-epoch.ts`);
    console.log("\n" + "═".repeat(60) + "\n");
  } catch (err) {
    console.error("\n❌ Deployment failed:", err);
    process.exit(1);
  }
}

main();
