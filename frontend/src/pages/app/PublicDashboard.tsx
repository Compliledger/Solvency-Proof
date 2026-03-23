/**
 * PublicDashboard — Public Solvency State Explorer
 *
 * Displays the latest solvency state, freshness, historical epochs,
 * proof hashes, and registry metadata for a given entity.
 *
 * No auth required — this is a public transparency page.
 */
import { useState, useEffect, useCallback } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
    fetchLatestEpochState,
    fetchEpochHistory,
    fetchEpochById,
    fetchRegistryMetadata,
} from "@/services/solvencyService";
import type { EpochState, EpochSummary, RegistryMetadata } from "@/types/solvency";
import {
    HealthStatusBadge,
    FreshnessIndicator,
    CapitalStateCard,
    LiquidityStateCard,
    EpochHistoryTable,
    RegistryMetadataCard,
} from "@/components/solvency";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import {
    Shield,
    Loader2,
    RefreshCw,
    Search,
    Hash,
    ArrowLeft,
    AlertTriangle,
} from "lucide-react";

export default function PublicDashboard() {
    const [entityId, setEntityId] = useState("");
    const [activeEntityId, setActiveEntityId] = useState<string | undefined>(undefined);
    const [latestEpoch, setLatestEpoch] = useState<EpochState | null>(null);
    const [selectedEpoch, setSelectedEpoch] = useState<EpochState | null>(null);
    const [history, setHistory] = useState<EpochSummary[]>([]);
    const [registry, setRegistry] = useState<RegistryMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEpoch, setIsLoadingEpoch] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (eid?: string) => {
        setIsLoading(true);
        setError(null);
        setSelectedEpoch(null);
        try {
            const [epochRes, historyRes, regRes] = await Promise.allSettled([
                fetchLatestEpochState(eid),
                fetchEpochHistory(eid, 20),
                fetchRegistryMetadata(eid),
            ]);
            if (epochRes.status === "fulfilled") setLatestEpoch(epochRes.value);
            else setError("Could not load latest epoch state.");
            if (historyRes.status === "fulfilled") setHistory(historyRes.value);
            if (regRes.status === "fulfilled") setRegistry(regRes.value);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(activeEntityId);
    }, [loadData, activeEntityId]);

    const handleSearch = () => {
        const trimmed = entityId.trim() || undefined;
        setActiveEntityId(trimmed);
    };

    const handleSelectEpoch = async (epochId: string) => {
        setIsLoadingEpoch(true);
        try {
            const epoch = await fetchEpochById(epochId);
            setSelectedEpoch(epoch);
        } catch {
            setSelectedEpoch(null);
        } finally {
            setIsLoadingEpoch(false);
        }
    };

    const displayedEpoch = selectedEpoch ?? latestEpoch;

    if (isLoading) {
        return (
            <PortalLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <Loader2 size={48} className="animate-spin mx-auto text-accent" />
                        <p className="text-muted-foreground">Loading solvency state…</p>
                    </div>
                </div>
            </PortalLayout>
        );
    }

    return (
        <PortalLayout>
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                    <div>
                        <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
                            <Shield size={28} className="text-success" />
                            Solvency State Explorer
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Public view of verified solvency epochs anchored on Algorand.
                        </p>
                    </div>
                    <button
                        onClick={() => loadData(activeEntityId)}
                        className="btn-secondary"
                        disabled={isLoading}
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Entity search */}
                <div className="flex gap-2 animate-fade-in">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={entityId}
                            onChange={(e) => setEntityId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Filter by entity ID (leave blank for default)"
                            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                        />
                    </div>
                    <button onClick={handleSearch} className="btn-secondary">
                        Search
                    </button>
                </div>

                {error && (
                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-sm">
                        <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Epoch detail */}
                {displayedEpoch && (
                    <>
                        {selectedEpoch && (
                            <button
                                onClick={() => setSelectedEpoch(null)}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Back to latest epoch
                            </button>
                        )}

                        <SpotlightCard spotlightColor="rgba(74, 222, 128, 0.1)" className="bg-card/80 border-border animate-fade-in">
                            <div className="p-6 space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-display text-lg font-semibold">
                                        Epoch #{displayedEpoch.epoch_id}
                                        {selectedEpoch ? "" : " (Latest)"}
                                    </span>
                                    <HealthStatusBadge status={displayedEpoch.health_status} />
                                    {displayedEpoch.entity_id && (
                                        <span className="text-xs text-muted-foreground">
                                            Entity: <span className="font-mono">{displayedEpoch.entity_id}</span>
                                        </span>
                                    )}
                                </div>

                                {isLoadingEpoch ? (
                                    <Loader2 size={18} className="animate-spin text-accent" />
                                ) : (
                                    <FreshnessIndicator
                                        timestamp={displayedEpoch.timestamp}
                                        validUntil={displayedEpoch.valid_until}
                                    />
                                )}

                                {/* Hashes */}
                                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                                    {[
                                        { label: "Proof Hash", value: displayedEpoch.proof_hash },
                                        { label: "Liability Root", value: displayedEpoch.liability_root },
                                        { label: "Reserve Root", value: displayedEpoch.reserve_root },
                                        { label: "Reserve Snapshot Hash", value: displayedEpoch.reserve_snapshot_hash },
                                    ].map(({ label, value }) =>
                                        value ? (
                                            <div key={label} className="p-3 rounded-lg bg-secondary/20 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                                                <p className="font-mono text-xs break-all">{value}</p>
                                            </div>
                                        ) : null,
                                    )}
                                </div>
                            </div>
                        </SpotlightCard>

                        {/* Capital & Liquidity */}
                        <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
                            <CapitalStateCard
                                reservesTotal={displayedEpoch.reserves_total}
                                totalLiabilities={displayedEpoch.total_liabilities}
                                capitalBacked={displayedEpoch.capital_backed}
                            />
                            <LiquidityStateCard
                                liquidAssetsTotal={displayedEpoch.liquid_assets_total}
                                nearTermLiabilitiesTotal={displayedEpoch.near_term_liabilities_total}
                                liquidityReady={displayedEpoch.liquidity_ready}
                            />
                        </div>
                    </>
                )}

                {/* Epoch history */}
                <div className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                        <Hash size={16} className="text-muted-foreground" />
                        <h2 className="font-medium">Epoch History</h2>
                        <span className="text-xs text-muted-foreground">({history.length} epochs)</span>
                    </div>
                    <EpochHistoryTable
                        epochs={history}
                        onSelectEpoch={handleSelectEpoch}
                        selectedEpochId={selectedEpoch?.epoch_id}
                    />
                </div>

                {/* Registry metadata */}
                <div className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                        <Hash size={16} className="text-muted-foreground" />
                        <h2 className="font-medium">Registry Metadata</h2>
                    </div>
                    <RegistryMetadataCard registry={registry} />
                </div>
            </div>
        </PortalLayout>
    );
}
