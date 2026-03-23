/**
 * UserVerification — Epoch-Aware Inclusion Verification
 *
 * Verifies whether a user's balance is included in the liability Merkle tree
 * for a specific epoch.  Users can optionally specify an epoch ID; if omitted
 * the backend uses the latest available epoch.
 */
import { useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { verifyUserInclusion } from "@/services/solvencyService";
import type { InclusionResult } from "@/types/solvency";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import {
    Shield,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Trash2,
    Copy,
    Check,
    Info,
    Search,
    Hash,
} from "lucide-react";

export default function UserVerification() {
    const [userId, setUserId] = useState("");
    const [epochId, setEpochId] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<InclusionResult | null>(null);
    const [copied, setCopied] = useState(false);

    const handleVerify = async () => {
        if (!userId.trim()) return;
        setIsVerifying(true);
        setResult(null);
        const res = await verifyUserInclusion(userId.trim(), epochId.trim() || undefined);
        setResult(res);
        setIsVerifying(false);
    };

    const handleClear = () => {
        setUserId("");
        setEpochId("");
        setResult(null);
    };

    const handleCopyResult = () => {
        if (!result) return;
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <PortalLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-2 animate-fade-in">
                    <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <Shield size={28} className="text-purple-500" />
                        </div>
                        Verify Inclusion
                    </h1>
                    <p className="text-muted-foreground">
                        Confirm that your balance is included in a specific epoch's liability Merkle tree —
                        without revealing any other user's data.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Main Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <SpotlightCard
                            spotlightColor="rgba(147, 51, 234, 0.1)"
                            className="bg-card/80 border-border animate-fade-in"
                        >
                            <div className="p-6 space-y-4">
                                <h2 className="font-display font-medium flex items-center gap-2">
                                    <Search size={18} className="text-purple-500" />
                                    Verification Details
                                </h2>

                                {/* User ID */}
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                                        User ID <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                        placeholder="e.g. alice, user-123"
                                        className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                                    />
                                </div>

                                {/* Epoch ID (optional) */}
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                                        Epoch ID <span className="text-muted-foreground font-normal">(optional — leave blank for latest)</span>
                                    </label>
                                    <div className="relative">
                                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={epochId}
                                            onChange={(e) => setEpochId(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                            placeholder="e.g. 7, epoch-2024-01"
                                            className="w-full h-11 pl-9 pr-4 rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        onClick={handleVerify}
                                        disabled={!userId.trim() || isVerifying}
                                        className="flex-1 btn-primary justify-center h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isVerifying ? (
                                            <><RefreshCw size={16} className="animate-spin" /> Verifying…</>
                                        ) : (
                                            <><Shield size={16} /> Verify Inclusion</>
                                        )}
                                    </button>
                                    <button onClick={handleClear} className="btn-secondary h-11">
                                        <Trash2 size={16} />
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </SpotlightCard>

                        {/* Result Panel */}
                        {result && (
                            <SpotlightCard
                                spotlightColor={result.success ? "rgba(74, 222, 128, 0.15)" : "rgba(239, 68, 68, 0.15)"}
                                className={`border-2 animate-fade-in ${
                                    result.success
                                        ? "border-success/50 bg-success/5"
                                        : "border-destructive/50 bg-destructive/5"
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.success ? "bg-success/20" : "bg-destructive/20"}`}>
                                            {result.success
                                                ? <CheckCircle2 size={24} className="text-success" />
                                                : <XCircle size={24} className="text-destructive" />}
                                        </div>
                                        <div>
                                            <h3 className={`font-display text-xl font-semibold ${result.success ? "text-success" : "text-destructive"}`}>
                                                {result.success ? "✓ VERIFIED!" : "✗ Not Found"}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {result.success
                                                    ? "Your balance is included in the solvency proof."
                                                    : result.error ?? "User not found in the Merkle tree."}
                                            </p>
                                        </div>
                                    </div>

                                    {result.success && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">User</p>
                                                    <p className="font-mono font-medium">{result.user_id}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Epoch</p>
                                                    <p className="font-mono font-medium">#{result.epoch_id || "latest"}</p>
                                                </div>
                                                {result.balance != null && (
                                                    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
                                                        <p className="font-semibold text-success">{result.balance.toLocaleString()} units</p>
                                                    </div>
                                                )}
                                                {result.liability_root && (
                                                    <div className="p-3 rounded-lg bg-secondary/30 border border-border col-span-2">
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Liability Root</p>
                                                        <p className="font-mono text-xs break-all">{result.liability_root}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {result.proof && result.proof.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Merkle Proof</p>
                                                    <div className="font-mono text-xs bg-secondary/30 p-3 rounded-lg max-h-36 overflow-auto border border-border space-y-0.5">
                                                        {result.proof.map((p, i) => (
                                                            <div key={i} className="truncate">{p}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-5">
                                        <button onClick={handleCopyResult} className="flex-1 btn-secondary text-sm justify-center">
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            {copied ? "Copied!" : "Copy Result"}
                                        </button>
                                        <button onClick={handleClear} className="btn-secondary text-sm">
                                            Verify Another
                                        </button>
                                    </div>
                                </div>
                            </SpotlightCard>
                        )}
                    </div>

                    {/* Right Column — Info */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="rounded-xl border border-border bg-card/50 p-5 animate-fade-in">
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={15} className="text-purple-500" />
                                <h3 className="font-medium text-sm">How Inclusion Verification Works</h3>
                            </div>
                            <ul className="space-y-2.5 text-sm text-muted-foreground">
                                <li className="flex gap-2">
                                    <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                                    <span>The backend builds a Merkle tree from all user liabilities for each epoch.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                                    <span>Your balance is hashed into a leaf — no other user's data is revealed.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                                    <span>The Merkle root is anchored on Algorand as part of the epoch's proof hash.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                                    <span>You can verify inclusion against any historical epoch by specifying its ID.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-xl border border-border bg-secondary/20 p-5 animate-fade-in">
                            <h4 className="font-medium text-sm mb-2">Sample User IDs</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                Try verifying these demo users (requires data in the backend):
                            </p>
                            <div className="space-y-1.5">
                                {["alice", "bob", "charlie", "dave"].map((user) => (
                                    <button
                                        key={user}
                                        onClick={() => { setUserId(user); setResult(null); }}
                                        className="w-full p-2.5 rounded-lg bg-secondary/50 border border-border hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left"
                                    >
                                        <span className="font-mono text-sm">{user}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
