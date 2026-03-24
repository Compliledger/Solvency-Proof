// Algorand public state registry integration
//
// Algorand is the public state registry for SolvencyProof epoch states.
// This module provides read-only access to the on-chain Algorand registry.
//
// When the Algorand smart-contract registry is not yet deployed (ALGORAND_APP_ID
// is null), both read functions fall back to the SolvencyProof backend API so
// that callers can still obtain live epoch state during development.
//
// TODO: Replace the backend-fallback paths with real Algorand SDK / Indexer
//       calls once the Algorand contract address and ABI are finalised.
//       See the `algorand/` directory in this repo for contract details.

import type { SolvencyEpochState } from "../types";
import { API_BASE_URL } from "./constants";

// ---------------------------------------------------------------------------
// Registry configuration (update when Algorand contracts are deployed)
// ---------------------------------------------------------------------------

/** Algorand application ID for the SolvencyProof state registry. */
export const ALGORAND_APP_ID: number | null = null; // TODO: set after deployment

/** Algorand network to target ("mainnet" | "testnet" | "betanet"). */
export const ALGORAND_NETWORK = "testnet" as const;

/** Algorand Indexer base URL for the target network. */
export const ALGORAND_INDEXER_URL =
    ALGORAND_NETWORK === "mainnet"
        ? "https://mainnet-idx.algonode.cloud"
        : "https://testnet-idx.algonode.cloud";

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function backendFetch<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Public registry reads
// ---------------------------------------------------------------------------

/**
 * Fetch the latest canonical `SolvencyEpochState` for an entity from the
 * Algorand public state registry.
 *
 * Falls back to the SolvencyProof backend API when the Algorand registry is
 * not yet deployed (ALGORAND_APP_ID === null).
 *
 * @param entityId - entity whose latest epoch state is requested
 * @returns the latest epoch state, or `null` when not available.
 *
 * TODO: implement Algorand path using algosdk or the Algonode Indexer REST
 *       API once the Algorand contract is deployed and the state schema is
 *       finalised.
 */
export async function getRegistryLatest(
    entityId: string
): Promise<SolvencyEpochState | null> {
    if (ALGORAND_APP_ID !== null) {
        // TODO: implement real Algorand indexer call here
        return null;
    }
    // Backend fallback: use the epoch state stored by the SolvencyProof engine
    return backendFetch<SolvencyEpochState>(
        `/api/epoch/${encodeURIComponent(entityId)}`
    );
}

/**
 * Fetch a specific epoch state from the Algorand public state registry.
 *
 * Falls back to the SolvencyProof backend API when the Algorand registry is
 * not yet deployed (ALGORAND_APP_ID === null).
 *
 * @param entityId - entity identifier
 * @param epochId  - epoch number to retrieve
 * @returns the epoch state, or `null` when not available.
 *
 * TODO: implement Algorand path once contract is deployed.
 */
export async function getRegistryEpoch(
    entityId: string,
    epochId: number
): Promise<SolvencyEpochState | null> {
    if (ALGORAND_APP_ID !== null) {
        // TODO: implement real Algorand indexer call here
        return null;
    }
    // Backend fallback: use the epoch state stored by the SolvencyProof engine
    return backendFetch<SolvencyEpochState>(
        `/api/epoch/${encodeURIComponent(entityId)}?epochId=${epochId}`
    );
}

/**
 * Check whether the Algorand registry is reachable and configured.
 *
 * @returns `true` when the registry is available.
 */
export function isRegistryAvailable(): boolean {
    return ALGORAND_APP_ID !== null;
}
