# 🛡️ SolvencyProof: Zero-Knowledge Proof of Reserves

> **Cryptographic proof that your exchange is solvent. Privacy-preserving. On-chain verified. Trustless.**

[![Deployed](https://img.shields.io/badge/Status-Live-success)](https://solvency-proof-production.up.railway.app)
[![Protocol](https://img.shields.io/badge/Type-ZK%20Solvency-purple)](./SolvencyProff_Core-Backend/backend/API.md)
[![Contracts](https://img.shields.io/badge/Contracts-Sepolia-blue)](https://sepolia.etherscan.io/address/0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d)
[![Circuits](https://img.shields.io/badge/ZK-Groth16-orange)](./SolvencyProff_Core-Backend/circuits/solvency.circom)


**Quick Links:**
- 🔗 [Live Backend API](https://solvency-proof-production.up.railway.app/health) - Health check responding
- 📜 [Registry Contract on Etherscan](https://sepolia.etherscan.io/address/0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d) - Verified proofs on-chain
- 🔐 [Verifier Contract on Etherscan](https://sepolia.etherscan.io/address/0x5e22F8cB0CfbC0df5F2251009674E1266E1D2DD6) - Groth16 ZK verifier
- 💻 [Frontend App](./Solvency-Proof-Frontend) - React dashboard with real-time verification
- 📊 [API Documentation](./SolvencyProff_Core-Backend/backend/API.md) - Complete endpoint reference

---

## � HackMoney 2026 - Yellow Network Prize Track

This project is submitted for the **Yellow Network $15,000 Prize** at [ETHGlobal HackMoney 2026](https://ethglobal.com).

### How We Qualify

| Requirement | Our Implementation |
|-------------|-------------------|
| **Use Yellow SDK / Nitrolite Protocol** | ✅ Integrated Yellow Network state channels for session-based balance management |
| **Off-chain Transaction Logic** | ✅ Instant, gasless balance updates between on-chain checkpoints |
| **Smart Contract Settlement** | ✅ Final balances settled on-chain via SolvencyProofRegistry contract |
| **Working Prototype** | ✅ Fully deployed backend, frontend, and smart contracts |
| **Demo Video** | ✅ Included in submission |

### Why Yellow Network is Perfect for Solvency Proofs

- **Session-Based Logic**: Users deposit once, make unlimited off-chain balance updates (deposits, withdrawals, trades), then settle on-chain
- **Gas-Free Updates**: Liability changes happen instantly without blockchain transactions
- **Web2 Speed, Web3 Security**: User balances update in real-time while smart contracts protect funds
- **Multi-Chain Ready**: Works with all EVM chains for cross-chain reserve verification

### Yellow Network Integration Points

1. **`/api/yellow/sessions`** - Create and manage state channel sessions
2. **`/api/yellow/sessions/:id/participants`** - Add users with balances to sessions
3. **`/api/yellow/sessions/:id/close`** - Finalize session and settle on-chain
4. **Real-time liability tracking** - Update Merkle tree commitments without gas fees

---

## �🏆 What Makes SolvencyProof Unique

| Feature | Traditional Audit | SolvencyProof | Benefit |
|---------|-------------------|---------------|---------|
| **Privacy** | Exposes all balances | Zero-knowledge proofs | Users stay private |
| **Frequency** | Quarterly/Annual | Real-time, on-demand | Always current |
| **Trust** | Trust the auditor | Cryptographic verification | Trustless |
| **Verification** | PDF reports | On-chain, anyone can verify | Transparent |
| **Cost** | $100K+ per audit | Gas fees only | 1000x cheaper |

---

## ✅ What We Built (Achievements)

### **🚀 Fully Deployed & Live**
- ✅ **SolvencyProofRegistry Contract** on Sepolia: [`0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d`](https://sepolia.etherscan.io/address/0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d)
- ✅ **Groth16Verifier Contract** on Sepolia: [`0x5e22F8cB0CfbC0df5F2251009674E1266E1D2DD6`](https://sepolia.etherscan.io/address/0x5e22F8cB0CfbC0df5F2251009674E1266E1D2DD6)
- ✅ **Backend API** on Railway: [Live Health Check](https://solvency-proof-production.up.railway.app/health) - All 21 endpoints operational
- ✅ **Frontend Dashboard** with React + TailwindCSS: Complete verification portal

### **🔗 Core Integrations**
- ✅ **Circom ZK Circuits**: Groth16 solvency proof generation ([solvency.circom](./SolvencyProff_Core-Backend/circuits/solvency.circom))
- ✅ **Yellow Network State Channels**: Off-chain balance management with instant updates
- ✅ **Merkle Tree Commitments**: Privacy-preserving liability aggregation
- ✅ **On-chain Verification**: Smart contract validates ZK proofs cryptographically

### **💡 Novel Innovation**
- ✅ **Privacy-Preserving Solvency**: Prove reserves > liabilities WITHOUT revealing individual balances
- ✅ **User Inclusion Proofs**: Any user can verify their balance is included (Merkle proof)
- ✅ **Real-time State Channels**: Update liabilities instantly via Yellow Network (zero gas)
- ✅ **Epoch-Based History**: Full audit trail of all verified proofs on-chain

### **📊 Technical Completeness**
- ✅ 21 API endpoints fully functional
- ✅ ZK circuit compiled and tested
- ✅ Smart contracts deployed and verified
- ✅ Frontend with authentication, caching, and real-time updates
- ✅ Comprehensive test suite

---

## 🎯 The Problem: Exchange Trust Crisis

**After FTX, Celsius, and countless exchange collapses, users have ONE question:**

### "Does this exchange actually have my money?"

### The Current Reality:
- **$20B+ lost** in exchange collapses (FTX alone: $8B)
- **No real-time verification** - monthly "attestations" are meaningless
- **Privacy violations** - traditional audits expose user data
- **Costly and slow** - $100K+ and months for each audit
- **Trust-based** - "just believe us" doesn't work anymore

### Why Existing Solutions Fail:

| Approach | Problem |
|----------|---------|
| **Merkle Trees only** | Doesn't prove reserves exist |
| **PoR attestations** | Point-in-time, easily manipulated |
| **Full transparency** | Exposes competitive data & user privacy |
| **Third-party audits** | Slow, expensive, trust the auditor |

---

## 💡 The Solution: Zero-Knowledge Proof of Solvency

**SolvencyProof combines three cryptographic primitives into a complete solution:**

### The Three Pillars:

```
1. LIABILITIES (Merkle Tree)
   └── Commit to ALL user balances with single hash
   └── Users can verify inclusion privately
   └── Total is hidden but provable

2. RESERVES (On-chain Scan)
   └── Real ETH balances from blockchain
   └── Publicly verifiable addresses
   └── No trust required

3. ZK PROOF (Groth16)
   └── Proves: reserves >= liabilities
   └── Reveals: NOTHING about individual balances
   └── Verified: On-chain by smart contract
```

### The Protocol Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLVENCY PROOF PROTOCOL                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    YELLOW    │    │   MERKLE     │    │   RESERVE    │      │
│  │   NETWORK    │───▶│    TREE      │    │   SCANNER    │      │
│  │  (Sessions)  │    │  (Commit)    │    │  (On-chain)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              ZK PROOF GENERATOR                      │       │
│  │         (Groth16 Solvency Circuit)                  │       │
│  │                                                      │       │
│  │   INPUT: liabilitiesRoot, reservesTotal, epochId    │       │
│  │   OUTPUT: isSolvent (1 or 0)                        │       │
│  └─────────────────────────────────────────────────────┘       │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           SMART CONTRACT VERIFICATION                │       │
│  │         (SolvencyProofRegistry.sol)                 │       │
│  │                                                      │       │
│  │   • Verifies Groth16 proof on-chain                 │       │
│  │   • Stores epoch data permanently                   │       │
│  │   • Emits SolvencyProved event                      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why This is Revolutionary:
- ✅ **Privacy**: Individual balances NEVER revealed
- ✅ **Trustless**: Math, not auditors
- ✅ **Real-time**: Generate proofs on-demand
- ✅ **Cheap**: ~$5 gas vs $100K audit
- ✅ **Verifiable**: Anyone can check on-chain

---

## 🎬 User Flow

```
Connect Wallet → Create Session → Add Users → Build Tree → Scan Reserves → Generate Proof → Submit On-Chain
    (Login)        (Yellow)        (Instant)    (Merkle)      (ETH)         (ZK)           (Verified!)
```

**Detailed Flow:**

1. **Login** - Authenticate to access the verification portal
2. **Yellow Sessions** - Create state channel for instant balance updates
3. **Add Participants** - Add users with their balances (off-chain, instant)
4. **Build Merkle Tree** - Commit all liabilities to single hash
5. **Scan Reserves** - Query on-chain ETH balances of reserve addresses
6. **Generate ZK Proof** - Prove reserves >= liabilities without revealing amounts
7. **Submit On-Chain** - Smart contract verifies and stores proof permanently
8. **Anyone Verifies** - Public can check solvency status on Etherscan

---

## ✅ Protocol Implementation Status

| Component | Status | Description | Proof |
|-----------|--------|-------------|-------|
| **ZK Solvency Circuit** | ✅ Complete | Groth16 proof of reserves >= liabilities | [solvency.circom](./SolvencyProff_Core-Backend/circuits/solvency.circom) |
| **Merkle Tree Builder** | ✅ Complete | Privacy-preserving liability commitment | [liabilities-builder.ts](./SolvencyProff_Core-Backend/backend/src/liabilities-builder.ts) |
| **Reserve Scanner** | ✅ Complete | On-chain ETH balance verification | [reserves-scanner.ts](./SolvencyProff_Core-Backend/backend/src/reserves-scanner.ts) |
| **Yellow Network** | ✅ Complete | State channels for instant updates | [API /api/yellow/*](./SolvencyProff_Core-Backend/backend/API.md#yellow-network-session-endpoints) |
| **Smart Contracts** | ✅ Deployed | On-chain proof verification | [Etherscan](https://sepolia.etherscan.io/address/0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d) |
| **Backend API** | ✅ Live | 21 endpoints, Railway hosted | [API Health](https://solvency-proof-production.up.railway.app/health) |
| **Frontend Portal** | ✅ Complete | React dashboard with auth | [Frontend](./Solvency-Proof-Frontend) |
| **User Inclusion Proofs** | ✅ Complete | Merkle proofs for individual users | [GET /api/liabilities/verify/:userId](./SolvencyProff_Core-Backend/backend/API.md#get-apiliabilitiesverifyuserid) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Dashboard  │ │   Yellow    │ │ Liabilities │ │   Proof     │        │
│  │   /verify   │ │  /yellow    │ │ /liabilities│ │   /proof    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│         │              │               │               │                 │
│         └──────────────┼───────────────┼───────────────┘                 │
│                        ▼               ▼                                 │
│              ┌─────────────────────────────────────┐                    │
│              │    useSolvencyProof() Hook          │                    │
│              │    (API client with caching)        │                    │
│              └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTPS
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         API Server                               │    │
│  │  /health  /api/liabilities  /api/reserves  /api/proof  /api/yellow│   │
│  └─────────────────────────────────────────────────────────────────┘    │
│         │              │               │               │                 │
│         ▼              ▼               ▼               ▼                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│  │  Merkle   │  │  Reserve  │  │    ZK     │  │  Yellow   │            │
│  │  Builder  │  │  Scanner  │  │  Prover   │  │  Sessions │            │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ JSON-RPC
┌─────────────────────────────────────────────────────────────────────────┐
│                     ETHEREUM SEPOLIA BLOCKCHAIN                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │   Groth16Verifier.sol       │  │  SolvencyProofRegistry.sol  │      │
│  │   0x5e22F8...E1D2DD6        │  │  0x7a9f15...b708aB33d       │      │
│  │                             │  │                             │      │
│  │   • verifyProof()           │  │   • submitProof()           │      │
│  │   • Validates ZK proofs     │◀─│   • getProof()              │      │
│  │                             │  │   • getEpochCount()         │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Live API Demo

**Copy-paste these commands to verify the system works:**

```bash
# 1. Health Check
curl -s "https://solvency-proof-production.up.railway.app/health" | jq

# 2. Get Current Liabilities (Merkle Root)
curl -s "https://solvency-proof-production.up.railway.app/api/liabilities" | jq

# 3. Get Reserve Balances
curl -s "https://solvency-proof-production.up.railway.app/api/reserves" | jq

# 4. Get Deployed Contract Addresses
curl -s "https://solvency-proof-production.up.railway.app/api/contracts" | jq

# 5. Get Epoch Count (Number of Verified Proofs)
curl -s "https://solvency-proof-production.up.railway.app/api/contracts/epoch-count" | jq

# 6. Get Yellow Network Sessions
curl -s "https://solvency-proof-production.up.railway.app/api/yellow/sessions" | jq
```

**Expected Output:**
- ✅ `status: "ok"` - Backend healthy
- ✅ `root: "0x..."` - Liabilities committed
- ✅ `addresses: [...]` - Reserve addresses with ETH balances
- ✅ `epochCount: N` - Number of on-chain proofs

---

## 💻 Core Code

### **ZK Solvency Circuit** (Circom):
```circom
template Solvency() {
    // Public inputs
    signal input liabilitiesRoot;
    signal input reservesTotal;
    signal input epochId;
    
    // Private inputs (hidden!)
    signal input liabilitiesTotal;
    
    // Output: 1 = solvent, 0 = insolvent
    signal output isSolvent;
    
    // Core constraint: reserves >= liabilities
    component gte = GreaterEqThan(252);
    gte.in[0] <== reservesTotal;
    gte.in[1] <== liabilitiesTotal;
    
    isSolvent <== gte.out;
    isSolvent === 1; // Proof fails if not solvent!
}
```

[→ View full circuit](./SolvencyProff_Core-Backend/circuits/solvency.circom)

### **Smart Contract Verification** (Solidity):
```solidity
function submitProof(
    bytes32 epochId,
    bytes32 liabilitiesRoot,
    uint256 reservesTotal,
    uint256[2] calldata _pA,
    uint256[2][2] calldata _pB,
    uint256[2] calldata _pC,
    uint256[4] calldata _pubSignals
) external {
    // Validate public signals
    require(_pubSignals[0] == 1, "Proof shows insolvency");
    require(_pubSignals[2] == reservesTotal, "Reserves mismatch");

    // Verify ZK proof on-chain
    bool valid = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
    require(valid, "Invalid proof");

    // Store verified proof permanently
    proofs[epochId] = SolvencyProof({...});
    emit SolvencyProved(epochId, liabilitiesRoot, reservesTotal, ...);
}
```

[→ View full contract](./SolvencyProff_Core-Backend/contracts/contracts/SolvencyProofRegistry.sol)

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Blockchain**: Viem (Ethereum interactions)
- **ZK**: Circom 2.1.6, SnarkJS, Groth16
- **State Channels**: Yellow Network / Nitrolite
- **Hosting**: Railway

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **State**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Components**: Radix UI primitives

### Smart Contracts
- **Language**: Solidity 0.8.24
- **Framework**: Hardhat
- **Network**: Ethereum Sepolia
- **Verification**: Groth16Verifier (auto-generated from circuit)

### ZK Circuits
- **Language**: Circom 2.1.6
- **Proving System**: Groth16
- **Curve**: BN128
- **Libraries**: circomlib

---

## 🚀 Deployed Contracts

### Ethereum Sepolia (Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **SolvencyProofRegistry** | [`0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d`](https://sepolia.etherscan.io/address/0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d) | Stores verified solvency proofs |
| **Groth16Verifier** | [`0x5e22F8cB0CfbC0df5F2251009674E1266E1D2DD6`](https://sepolia.etherscan.io/address/0x5e22F8cB0CfbC0df5F2251009674E1266E1D2DD6) | Verifies ZK proofs on-chain |

### Backend API

| Service | URL | Status |
|---------|-----|--------|
| **Production API** | [solvency-proof-production.up.railway.app](https://solvency-proof-production.up.railway.app) | ✅ Live |
| **Health Endpoint** | [/health](https://solvency-proof-production.up.railway.app/health) | ✅ Responding |

---

## 🏆 Why This Protocol Wins

### Novel Technical Contribution:
- ❌ **NOT** just another Merkle tree
- ❌ **NOT** just a proof-of-reserves attestation
- ❌ **NOT** centralized auditor trust
- ✅ **IS** a complete ZK solvency protocol with privacy guarantees

### The Innovation Stack:

| Layer | Innovation | Impact |
|-------|------------|--------|
| **Privacy** | ZK proofs hide individual balances | Users stay anonymous |
| **State Channels** | Yellow Network for instant updates | No gas for balance changes |
| **Merkle Commitments** | Single hash for all liabilities | Efficient on-chain storage |
| **On-chain Verification** | Smart contract validates proofs | Trustless, anyone can verify |
| **User Inclusion** | Individual Merkle proofs | Users verify their own balance |

### Market Timing:
- ✅ Post-FTX world demands proof of reserves
- ✅ Privacy regulations require data protection
- ✅ ZK technology is now production-ready
- ✅ L2s make on-chain verification affordable

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📄 [API Documentation](./SolvencyProff_Core-Backend/backend/API.md) | Complete endpoint reference (21 endpoints) |
| 🔐 [Enterprise Audit Guide](./SolvencyProff_Core-Backend/ENTERPRISE_AUDIT.md) | Security and audit information |
| ⚡ [ZK Circuit](./SolvencyProff_Core-Backend/circuits/solvency.circom) | Groth16 solvency proof circuit |
| 📜 [Smart Contracts](./SolvencyProff_Core-Backend/contracts/contracts/) | Solidity source code |
| 🎨 [Frontend](./Solvency-Proof-Frontend/) | React dashboard source |

---

## 💡 For Developers: How It Works

### 1. Liability Commitment (Merkle Tree)

```
User Balances → Hash Each → Build Tree → Single Root
   alice: 1000        │          │            │
   bob: 2000     ─────┼──────────┼────────────┼───▶ 0x60700382e80fbacd...
   carol: 1500        │          │            │
```

- Each user balance is hashed with their ID
- Merkle tree aggregates all hashes
- Root commits to ALL balances with single 32-byte value
- Users can prove inclusion without revealing others

### 2. Reserve Verification (On-chain Scan)

```
Reserve Addresses → Query Blockchain → Sum Balances
   0xABC...              │                  │
   0xDEF...    ──────────┼──────────────────┼───▶ 0.355 ETH
   0x123...              │                  │
```

- Exchange provides list of reserve addresses
- Backend queries actual on-chain ETH balances
- Sum is publicly verifiable by anyone

### 3. ZK Proof Generation

```
Private: liabilitiesTotal (hidden)
Public: liabilitiesRoot, reservesTotal, epochId
                    │
                    ▼
            ┌───────────────┐
            │  ZK Circuit   │
            │  reserves >=  │
            │  liabilities  │
            └───────────────┘
                    │
                    ▼
            Proof: {pA, pB, pC}
            Output: isSolvent = 1
```

- Prover knows actual liability total (private)
- Circuit proves reserves >= liabilities
- Output reveals ONLY solvency status, not amounts

### 4. On-chain Verification

```solidity
// Smart contract verifies proof
bool valid = verifier.verifyProof(pA, pB, pC, pubSignals);
require(valid, "Invalid proof");
require(pubSignals[0] == 1, "Not solvent");

// Store permanently
proofs[epochId] = SolvencyProof{...};
emit SolvencyProved(epochId, ...);
```

- Anyone can verify on Etherscan
- Proof is permanent and immutable
- Full audit trail of all epochs

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Circom 2.1.6 (for circuit development)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/Solvency-Proof.git
cd Solvency-Proof

# Backend
cd SolvencyProff_Core-Backend/backend
pnpm install
pnpm dev

# Frontend (new terminal)
cd Solvency-Proof-Frontend
pnpm install
pnpm dev

# Smart Contracts
cd SolvencyProff_Core-Backend/contracts
pnpm install
npx hardhat compile
npx hardhat test
```

### Environment Variables

```bash
# Backend (.env)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...
PORT=3001

# Frontend (.env)
VITE_API_URL=https://solvency-proof-production.up.railway.app
```

### Running Tests

```bash
# Backend tests
cd SolvencyProff_Core-Backend/backend
pnpm test

# Contract tests
cd SolvencyProff_Core-Backend/contracts
npx hardhat test

# Frontend tests
cd Solvency-Proof-Frontend
pnpm test
```

### Deployment

```bash
# Backend to Railway
cd SolvencyProff_Core-Backend/backend
railway up

# Frontend to Vercel
cd Solvency-Proof-Frontend
vercel deploy
```

---

## 📂 Project Structure

```
Solvency-Proof/
├── Solvency-Proof-Frontend/          # React Frontend
│   ├── src/
│   │   ├── components/               # UI components (shadcn/ui)
│   │   ├── contexts/                 # Auth context
│   │   ├── hooks/                    # useSolvencyProof API hook
│   │   ├── pages/                    # Route pages
│   │   │   └── app/                  # Dashboard, Liabilities, Reserves, etc.
│   │   └── lib/                      # Utilities and constants
│   ├── package.json
│   └── vite.config.ts
│
├── SolvencyProff_Core-Backend/       # Backend + Contracts + Circuits
│   ├── backend/
│   │   ├── src/
│   │   │   ├── api/                  # Express server
│   │   │   ├── liabilities-builder.ts
│   │   │   ├── reserves-scanner.ts
│   │   │   ├── solvency-prover.ts
│   │   │   └── submit-proof.ts
│   │   └── API.md                    # Endpoint documentation
│   │
│   ├── circuits/
│   │   ├── solvency.circom           # ZK solvency circuit
│   │   └── scripts/                  # Compilation scripts
│   │
│   ├── contracts/
│   │   ├── contracts/
│   │   │   ├── Groth16Verifier.sol   # Auto-generated verifier
│   │   │   └── SolvencyProofRegistry.sol
│   │   ├── scripts/                  # Deployment scripts
│   │   └── test/                     # Contract tests
│   │
│   └── data/                         # Sample data files
│
└── README.md                         # This file
```

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ by the SolvencyProof Team**

[GitHub](https://github.com/your-org/Solvency-Proof) | [Live API](https://solvency-proof-production.up.railway.app) | [Etherscan](https://sepolia.etherscan.io/address/0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d)
