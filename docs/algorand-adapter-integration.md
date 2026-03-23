# Algorand Adapter Integration

This document describes how SolvencyProof integrates with the external
**compliledger-algorand-adapter** repository, which acts as the chain-facing
layer for all Algorand state registry interactions.

---

## Architectural Overview

```
Customer Systems
      │
      ▼
  Connector Layer (CSV / JSON parsers)
      │
      ▼
  Commitment & Evaluation Engine
  (liability tree, reserve snapshot, health evaluation, proof hash)
      │
      ▼
  Canonical SolvencyEpochObject          ← SolvencyProof is source of truth
      │
      ▼
  toAlgorandSolventRegistryPayload()     ← backend/algorand/adapter_payload.ts
      │
      ▼
  AlgorandAdapterPayload (hand-off)
      │
      ▼
  IAlgorandAdapterClient                 ← backend/algorand/adapter_client.ts
      │
      ▼
  compliledger-algorand-adapter          ← external shared repo (chain layer)
      │
      ▼
  Algorand Solvent Registry (on-chain)
      │
      ▼
  Public Verifiers
```

---

## Separation of Concerns

| Layer | Responsibility |
|---|---|
| **SolvencyProof backend** | Compute solvency state, produce canonical epoch objects |
| **`adapter_payload.ts`** | Map canonical epoch → `AlgorandAdapterPayload` (serialise amounts as strings) |
| **`adapter_client.ts`** | Define the `IAlgorandAdapterClient` interface; provide stub until real adapter is available |
| **compliledger-algorand-adapter** | Build Algorand transactions, sign, broadcast, query on-chain state |

> **Rule:** Algorand SDK code (`algosdk`) must never be imported inside
> SolvencyProof. All Algorand transaction-building lives exclusively in the
> adapter repository.

---

## Integration Files

### `backend/backend/src/algorand/adapter_types.ts`

Defines the shared TypeScript types used across the adapter integration layer:

| Type | Purpose |
|---|---|
| `AlgorandAdapterPayload` | Canonical payload handed from SolvencyProof to the adapter |
| `SubmitEpochResult` | Response returned after a successful on-chain submission |
| `EpochHistoryEntry` | A single entry in an entity's on-chain epoch history |
| `VerifyStoredRecordResult` | Result of verifying an on-chain record against an expected payload |

### `backend/backend/src/algorand/adapter_payload.ts`

Contains the mapper function that converts a `SolvencyEpochObject` into an
`AlgorandAdapterPayload`:

```typescript
import { toAlgorandSolventRegistryPayload } from "./algorand/adapter_payload.js";

const payload = toAlgorandSolventRegistryPayload(epochObject);
```

Transformations applied:
- `reserves_total`, `liquid_assets_total`, `near_term_liabilities_total` — converted from `number` to decimal `string` to avoid floating-point loss during JSON serialisation
- All other fields are passed through unchanged

### `backend/backend/src/algorand/adapter_client.ts`

Defines `IAlgorandAdapterClient` — the interface contract that the real adapter
must satisfy — along with a no-op stub (`AlgorandAdapterStub`) used while the
external package is not yet integrated.

```typescript
import { createAlgorandAdapterClient } from "./algorand/adapter_client.js";

const client = createAlgorandAdapterClient();

// Submit an epoch payload to the on-chain registry
const result = await client.submitEpoch(payload);

// Query the latest on-chain state for an entity
const latest = await client.getLatestState("compliledger-entity-01");

// Retrieve the full epoch history for an entity
const history = await client.getEpochHistory("compliledger-entity-01");

// Verify that a specific on-chain record matches the expected payload
const verification = await client.verifyStoredRecord("compliledger-entity-01", epochId);
```

---

## Integrating the Real Adapter

When the `@compliledger/algorand-adapter` package is published and ready:

1. Install the package:
   ```sh
   npm install @compliledger/algorand-adapter
   ```

2. Update `createAlgorandAdapterClient()` in `adapter_client.ts` to import and
   instantiate the real client:
   ```typescript
   import { createAlgorandAdapterClient as createRealClient }
     from "@compliledger/algorand-adapter";

   export function createAlgorandAdapterClient(): IAlgorandAdapterClient {
     if (process.env.ALGORAND_ADAPTER_ENABLED === "true") {
       return createRealClient({
         appId: BigInt(process.env.ALGORAND_APP_ID ?? "0"),
         nodeUrl: process.env.ALGORAND_NODE_URL ?? "",
         // signer: ...
       });
     }
     return new AlgorandAdapterStub();
   }
   ```

3. Set the environment variable to enable the real adapter:
   ```sh
   ALGORAND_ADAPTER_ENABLED=true
   ALGORAND_APP_ID=<deployed_app_id>
   ALGORAND_NODE_URL=https://testnet-api.algonode.cloud
   ```

4. Remove `AlgorandAdapterStub` once the real client is verified in staging.

---

## Existing Algorand Module (`/algorand/`)

The top-level `algorand/` directory contains the Phase 2 on-chain registry
components that will be consumed by the shared adapter:

| File | Purpose |
|---|---|
| `algorand/contracts/solvent_registry.py` | PyTeal ABI smart contract (TEAL v8) |
| `algorand/client/registry_client.ts` | TypeScript client wrapping the contract (used by the adapter) |
| `algorand/types/registry.ts` | Shared on-chain types, enums, box key helpers |

These components belong to the chain layer and are **not** imported into
SolvencyProof's backend. The adapter is the bridge between this module and
the canonical SolvencyProof epoch data.
