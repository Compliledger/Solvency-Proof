# Algorand Solvent Registry

Phase 2 of the SolvencyProof project — on-chain state registry for canonical solvency epochs.

---

## Architectural Role

This module is a **state registry**, not a computation layer.

```
SolvencyProof Backend
  → toAlgorandSolventRegistryPayload()
  → SolventRegistryClient.submitEpoch()
  → Algorand Solvent Registry (on-chain)
  → Public Verifiers / compliledger-algorand-adapter
```

The backend evaluates solvency and produces a canonical epoch object.  
This module stores that object on-chain and makes it queryable.

---

## Directory Structure

```
algorand/
├── contracts/
│   └── solvent_registry.py   # PyTeal ABI smart contract (TEAL v8)
├── client/
│   └── registry_client.ts    # TypeScript client (algosdk)
├── types/
│   └── registry.ts           # Shared types, enums, and payload helpers
├── tests/
│   ├── test_solvent_registry.py  # Python/pytest tests
│   └── registry.test.ts          # TypeScript/Vitest tests
├── requirements.txt
├── package.json
└── tsconfig.json
```

---

## Storage Layout

Each entity's state is stored in two **box** types:

| Purpose        | Box key                                  |
|---|---|
| Latest state   | `entity:{entity_id}:latest`              |
| Epoch record   | `entity:{entity_id}:epoch:{epoch_id}`    |

### Box value wire format

All values are big-endian:

```
[uint16: len(entity_id)]           [entity_id bytes]
[uint16: len(epoch_id)]            [epoch_id bytes]
[uint16: len(liability_root)]      [liability_root bytes]
[uint16: len(reserve_root)]        [reserve_root bytes]
[uint16: len(reserve_snapshot_hash)][reserve_snapshot_hash bytes]
[uint16: len(proof_hash)]          [proof_hash bytes]
[uint64: reserves_total]           (micro-units, ×10⁶)
[uint64: liquid_assets_total]      (micro-units)
[uint64: near_term_liabilities]    (micro-units)
[uint8:  capital_backed]           0 or 1
[uint8:  liquidity_ready]          0 or 1
[uint8:  health_status]            0–5 (see enum below)
[uint64: timestamp]                Unix seconds
[uint64: valid_until]              Unix seconds
[uint8:  insolvency_flag]          0 or 1
[uint8:  liquidity_stress_flag]    0 or 1
```

---

## Health Status Enum

| Value | Name                  | Meaning                                          |
|---|---|---|
| 0     | UNKNOWN               | Not yet evaluated                                |
| 1     | HEALTHY               | Capital backing + liquidity readiness both OK    |
| 2     | LIQUIDITY_STRESSED    | Capital backing OK, liquid assets insufficient   |
| 3     | UNDERCOLLATERALIZED   | Reserves below total liabilities                 |
| 4     | CRITICAL              | Both capital backing and liquidity have failed   |
| 5     | EXPIRED               | valid_until window has passed                    |

---

## Contract Methods

| Method                               | Description                                        |
|---|---|
| `submit_epoch(...)`                  | Store a new epoch; enforce uniqueness; set flags   |
| `get_latest_state(entity_id)`        | Return latest encoded state bytes                  |
| `get_epoch_record(entity_id, epoch)` | Return historical epoch record bytes               |
| `is_healthy(entity_id)`              | Returns bool (HEALTHY + not expired)               |
| `get_health_status(entity_id)`       | Returns numeric HealthStatus (EXPIRED if past window) |

---

## Quick Start

### TypeScript

```bash
cd algorand
npm install
npm test          # 46 tests
npm run typecheck
```

```typescript
import { toAlgorandSolventRegistryPayload, SolventRegistryClient } from "./client/registry_client.js";
import { HealthStatus } from "./types/registry.js";

// Convert backend epoch object → on-chain payload
const payload = toAlgorandSolventRegistryPayload(canonicalEpoch);

// Submit to registry
const client = new SolventRegistryClient({ nodeUrl: "...", appId: 12345n, signer, senderAddress });
await client.submitEpoch(payload);

// Query
const state = await client.getLatestState("entity-001");
const healthy = await client.isHealthy("entity-001");
```

### Python (contract)

```bash
cd algorand
pip install -r requirements.txt
python contracts/solvent_registry.py          # compile and print TEAL
pytest tests/test_solvent_registry.py -v      # 36 tests
```

---

## Example Payload

```typescript
// Canonical epoch object (backend output)
const epoch = {
  entity_id: "entity-001",
  epoch_id: "epoch-2026-03-23T18:00:00Z",
  liability_root: "0xabc123...",
  reserve_root: "0xdef456...",
  reserve_snapshot_hash: "0x789abc...",
  proof_hash: "0x112233...",
  reserves_total: 12500000.00,        // USD float
  liquid_assets_total: 3000000.00,
  near_term_liabilities_total: 2500000.00,
  capital_backed: true,
  liquidity_ready: true,
  health_status: "HEALTHY",           // string → converted to 1
  timestamp: "2026-03-23T18:00:00Z",  // ISO → Unix seconds
  valid_until: "2026-03-24T18:00:00Z",
};

// Transformed payload (ready for the contract)
const payload = toAlgorandSolventRegistryPayload(epoch);
// payload.health_status    → 1  (HealthStatus.HEALTHY)
// payload.reserves_total   → 12_500_000_000_000n  (×10⁶)
// payload.timestamp        → 1742752800n  (Unix seconds)
```
