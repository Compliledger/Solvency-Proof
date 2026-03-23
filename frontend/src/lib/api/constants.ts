// SolvencyProof API Constants
// Architecture: backend → Algorand registry → frontend visibility

export const API_BASE_URL = 'https://solvency-proof-production.up.railway.app';

export const API_ENDPOINTS = {
    // Health
    HEALTH: '/health',

    // Epoch state (backend-computed, Algorand-anchored)
    EPOCH_LATEST: '/api/epoch/latest',
    EPOCH_BY_ID: '/api/epoch',
    EPOCH_HISTORY: '/api/epoch/history',
    EPOCH_REFRESH: '/api/epoch/refresh',
    EPOCH_SUBMIT: '/api/epoch/submit',

    // Registry (Algorand)
    REGISTRY: '/api/registry',

    // Liabilities
    LIABILITIES: '/api/liabilities',
    BUILD_MERKLE: '/api/liabilities/build',
    VERIFY_INCLUSION: '/api/liabilities/verify',

    // Reserves
    RESERVES: '/api/reserves',
    SCAN_RESERVES: '/api/reserves/scan',
    RESERVE_ADDRESSES: '/api/reserves/addresses',

    // Yellow Network
    YELLOW_STATUS: '/api/yellow/status',
    YELLOW_SESSIONS: '/api/yellow/sessions',
    YELLOW_SESSION: '/api/yellow/session',
};

// Algorand explorer helper (Pera Wallet explorer — MainNet by default)
export const ALGORAND_EXPLORER_BASE_URL = 'https://explorer.perawallet.app';

// ---------------------------------------------------------------------------
// Legacy shims — kept so existing pages still compile.
// New code should use the Algorand helpers above and the service layer.
// ---------------------------------------------------------------------------

/** @deprecated Use the Algorand registry instead. */
export const CONTRACTS = {
    REGISTRY: '0x7a9f15BCD95FDD20cf31A480f37CAA9b708aB33d',
    VERIFIER: '0x5e22F8cB0CfbC0df5F2251009674E1266E1D2DD6',
} as const;

const ETHERSCAN_BASE_URL = 'https://sepolia.etherscan.io';

/** @deprecated */
export function getEtherscanTxUrl(txHash: string): string {
    return `${ETHERSCAN_BASE_URL}/tx/${txHash}`;
}

/** @deprecated */
export function getEtherscanAddressUrl(address: string): string {
    return `${ETHERSCAN_BASE_URL}/address/${address}`;
}

/** @deprecated */
export function getEtherscanBlockUrl(blockNumber: number): string {
    return `${ETHERSCAN_BASE_URL}/block/${blockNumber}`;
}

export function getAlgorandTxUrl(txId: string): string {
    return `${ALGORAND_EXPLORER_BASE_URL}/tx/${txId}`;
}

export function getAlgorandAppUrl(appId: string): string {
    return `${ALGORAND_EXPLORER_BASE_URL}/application/${appId}`;
}

export function getAlgorandAddressUrl(address: string): string {
    return `${ALGORAND_EXPLORER_BASE_URL}/address/${address}`;
}