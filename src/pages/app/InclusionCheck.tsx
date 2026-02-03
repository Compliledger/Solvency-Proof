import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
    mockReports,
    sampleInclusionProofs,
    MockReportRepository,
    MockInclusionVerifier,
    formatCurrency,
    formatRatio,
    formatShortDate,
    truncateHash,
    type InclusionProof,
    type VerificationResult
} from "@/lib/mock/portalData";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import {
    Shield,
    Upload,
    FileJson,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Download,
    RefreshCw,
    Trash2,
    Copy,
    Check,
    ChevronDown,
    Info
} from "lucide-react";

function GlowDot({ color = "bg-success" }: { color?: string }) {
    return (
        <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isVerified = status === "VERIFIED";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            isVerified
                ? "bg-success/10 text-success"
                : "bg-yellow-500/10 text-yellow-500"
        }`}>
            <GlowDot color={isVerified ? "bg-success" : "bg-yellow-500"} />
            {status}
        </span>
    );
}

export default function InclusionCheck() {
    const [searchParams] = useSearchParams();
    const initialReportId = searchParams.get('reportId') || mockReports[0]?.reportId || "";

    const [selectedReportId, setSelectedReportId] = useState(initialReportId);
    const [proofInput, setProofInput] = useState("");
    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const selectedReport = MockReportRepository.get(selectedReportId);

    // Update selected report when URL param changes
    useEffect(() => {
        const reportId = searchParams.get('reportId');
        if (reportId && mockReports.find(r => r.reportId === reportId)) {
            setSelectedReportId(reportId);
        }
    }, [searchParams]);

    const parseProofJson = (input: string): InclusionProof | null => {
        try {
            const parsed = JSON.parse(input);
            // Map snake_case to camelCase if needed
            return {
                reportId: parsed.report_id || parsed.reportId,
                userId: parsed.user_id || parsed.userId,
                amount: String(parsed.amount),
                leafHash: parsed.leaf_hash || parsed.leafHash,
                proof: parsed.proof,
                pathIndices: parsed.path_indices || parsed.pathIndices,
                issuedAt: parsed.issued_at || parsed.issuedAt
            };
        } catch {
            return null;
        }
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        setParseError(null);
        setResult(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Parse proof
        const proof = parseProofJson(proofInput);
        if (!proof && proofInput.trim()) {
            setParseError("Invalid JSON format. Please check your proof structure.");
            setIsVerifying(false);
            return;
        }

        // Run verification
        const verificationResult = MockInclusionVerifier.verify(
            selectedReportId,
            proof,
            userId,
            amount
        );

        setResult(verificationResult);
        setIsVerifying(false);
    };

    const handleLoadSampleProof = () => {
        const sample = sampleInclusionProofs.find(p => p.reportId === selectedReportId)
            || sampleInclusionProofs[0];

        setProofInput(JSON.stringify({
            report_id: sample.reportId,
            user_id: sample.userId,
            amount: sample.amount,
            leaf_hash: sample.leafHash,
            proof: sample.proof,
            path_indices: sample.pathIndices,
            issued_at: sample.issuedAt
        }, null, 2));

        setUserId(sample.userId);
        setAmount(sample.amount);
        setParseError(null);
        setResult(null);
    };

    const handleClear = () => {
        setProofInput("");
        setUserId("");
        setAmount("");
        setResult(null);
        setParseError(null);
    };

    const handleCopyResult = () => {
        if (result) {
            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <PortalLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-2 animate-fade-in">
                    <h1 className="font-display text-3xl font-semibold">Inclusion Check</h1>
                    <p className="text-muted-foreground">
                        Verify your account was included in a solvency report's liabilities commitment.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Main Form */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Step 1: Select Report */}
                        <div className="rounded-xl border border-border bg-card/50 p-6 animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-medium text-accent-cream">1</div>
                                <h2 className="font-display font-medium">Select Report</h2>
                            </div>

                            <select
                                value={selectedReportId}
                                onChange={(e) => {
                                    setSelectedReportId(e.target.value);
                                    setResult(null);
                                }}
                                className="w-full h-12 px-4 rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                            >
                                {mockReports.map((report) => (
                                    <option key={report.reportId} value={report.reportId}>
                                        {report.reportId} — {report.status} — {formatShortDate(report.publishedAt)}
                                    </option>
                                ))}
                            </select>

                            {/* Report Summary Chip */}
                            {selectedReport && (
                                <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={selectedReport.status} />
                                        <span className="text-sm">
                                            Coverage: <span className="font-semibold text-accent-cream">{formatRatio(selectedReport.coverageRatio)}</span>
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatShortDate(selectedReport.publishedAt)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Provide Proof */}
                        <div className="rounded-xl border border-border bg-card/50 p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-medium text-accent-cream">2</div>
                                    <h2 className="font-display font-medium">Provide Proof</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleLoadSampleProof}
                                        className="text-xs text-accent hover:underline flex items-center gap-1"
                                    >
                                        <FileJson size={12} />
                                        Use sample proof
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Upload or Paste */}
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                                        Inclusion Proof JSON
                                    </label>
                                    <textarea
                                        value={proofInput}
                                        onChange={(e) => {
                                            setProofInput(e.target.value);
                                            setParseError(null);
                                        }}
                                        placeholder='{"report_id": "...", "user_id": "...", "amount": "...", "proof": [...], "leaf_hash": "..."}'
                                        className={`w-full h-40 p-4 rounded-lg border bg-secondary/30 text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all resize-none ${
                                            parseError ? 'border-destructive' : 'border-border focus:border-accent/50'
                                        }`}
                                    />
                                    {parseError && (
                                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {parseError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Identity & Amount */}
                        <div className="rounded-xl border border-border bg-card/50 p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-medium text-accent-cream">3</div>
                                <h2 className="font-display font-medium">Identity & Amount</h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                                        User ID
                                    </label>
                                    <input
                                        type="text"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        placeholder="user_48291"
                                        className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                                        Amount
                                    </label>
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="2450.00"
                                        className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
                            <button
                                onClick={handleVerify}
                                disabled={!proofInput || !userId || !amount || isVerifying}
                                className="flex-1 btn-primary justify-center h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifying ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={16} />
                                        Verify Inclusion
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleClear}
                                className="btn-secondary h-12"
                            >
                                <Trash2 size={16} />
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Result & Info */}
                    <div className="lg:col-span-5 space-y-6">
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
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            result.success ? "bg-success/20" : "bg-destructive/20"
                                        }`}>
                                            {result.success ? (
                                                <CheckCircle2 size={24} className="text-success" />
                                            ) : (
                                                <XCircle size={24} className="text-destructive" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={`font-display text-xl font-semibold ${
                                                result.success ? "text-success" : "text-destructive"
                                            }`}>
                                                {result.success ? "✓ Included" : "✗ Not Included"}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {result.message}
                                            </p>
                                        </div>
                                    </div>

                                    {result.success && (
                                        <div className="space-y-3 pt-4 border-t border-border/50">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Report ID</span>
                                                <span className="font-mono">{result.matchedReportId}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Root Hash</span>
                                                <span className="font-mono text-xs">{truncateHash(result.matchedRootHash || "", 8)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Amount</span>
                                                <span className="font-semibold text-success">${result.matchedAmount}</span>
                                            </div>
                                        </div>
                                    )}

                                    {!result.success && result.errorCode && (
                                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <p className="text-xs font-mono text-destructive">
                                                Error: {result.errorCode}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-6">
                                        <button
                                            onClick={handleCopyResult}
                                            className="flex-1 btn-secondary text-sm justify-center"
                                        >
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            {copied ? "Copied!" : "Download result"}
                                        </button>
                                        <button
                                            onClick={handleClear}
                                            className="btn-secondary text-sm"
                                        >
                                            Verify another
                                        </button>
                                    </div>
                                </div>
                            </SpotlightCard>
                        )}

                        {/* Sample Data Info */}
                        <div className="rounded-xl border border-border bg-card/50 p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Info size={16} className="text-accent-cream" />
                                <h3 className="font-medium">Test Data Available</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Use these sample credentials to test the verification:
                            </p>
                            <div className="space-y-3">
                                {sampleInclusionProofs.slice(0, 3).map((proof, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-xs"
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className="text-muted-foreground">User:</span>
                                            <span className="font-mono">{proof.userId}</span>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-muted-foreground">Amount:</span>
                                            <span className="font-mono">${proof.amount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Report:</span>
                                            <span className="font-mono text-[10px]">{proof.reportId.slice(-12)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleLoadSampleProof}
                                className="w-full mt-4 btn-secondary text-sm justify-center"
                            >
                                <FileJson size={14} />
                                Load Sample Proof
                            </button>
                        </div>

                        {/* How it works */}
                        <div className="rounded-xl border border-border bg-secondary/20 p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
                            <h4 className="font-medium mb-3">How inclusion verification works</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex gap-2">
                                    <span className="text-accent-cream">1.</span>
                                    Each report contains a Merkle tree commitment of all user liabilities.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-accent-cream">2.</span>
                                    Your inclusion proof demonstrates your balance was part of this commitment.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-accent-cream">3.</span>
                                    Verification happens locally—no data is sent to any server.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
