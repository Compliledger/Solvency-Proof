import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
    mockReports,
    MockReportRepository,
    MockArtifactRepository,
    getArtifactsForReport,
    formatCurrency,
    formatRatio,
    formatDate,
    formatShortDate,
    truncateHash
} from "@/lib/mock/portalData";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import {
    Download,
    Copy,
    ExternalLink,
    Shield,
    ChevronDown,
    ChevronUp,
    FileText,
    Code,
    Calendar,
    Hash,
    ArrowLeft,
    ArrowRight,
    Check,
    Eye
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
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            isVerified
                ? "bg-success/10 text-success border border-success/20"
                : status === "PENDING"
                ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
        }`}>
            <GlowDot color={isVerified ? "bg-success" : status === "PENDING" ? "bg-yellow-500" : "bg-destructive"} />
            {status}
        </span>
    );
}

function CopyButton({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-accent/30 hover:bg-secondary/30 transition-all text-sm"
        >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            {copied ? "Copied!" : label}
        </button>
    );
}

export default function ReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [showInputs, setShowInputs] = useState(false);
    const [showJsonModal, setShowJsonModal] = useState<string | null>(null);

    const report = MockReportRepository.get(id || "") || mockReports[0];
    const artifacts = getArtifactsForReport(report.reportId);
    const surplus = parseFloat(report.reservesTotal) - parseFloat(report.liabilitiesTotal);

    const handleDownloadArtifact = (artifactType: string, fileName: string) => {
        const content = MockArtifactRepository.download(report.reportId, artifactType);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <PortalLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
                    <Link to="/verify" className="hover:text-foreground transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/proofs" className="hover:text-foreground transition-colors">Proofs</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">{report.reportId}</span>
                </nav>

                {/* Section 1: Verification Summary Header */}
                <SpotlightCard
                    spotlightColor="rgba(74, 222, 128, 0.1)"
                    className="bg-card/95 border-border animate-fade-in-up"
                >
                    <div className="p-8">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Verification Report</p>
                                <h1 className="font-display text-2xl font-semibold">{report.reportId}</h1>
                                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Published {formatDate(report.publishedAt)}
                                </p>
                            </div>
                            <StatusBadge status={report.status} />
                        </div>

                        <div className="grid gap-8 lg:grid-cols-12 mb-8">
                            {/* Big Coverage Ratio */}
                            <div className="lg:col-span-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Coverage Ratio</p>
                                <p className="font-display text-5xl font-bold text-accent-cream">{formatRatio(report.coverageRatio)}</p>
                            </div>

                            {/* Totals */}
                            <div className="lg:col-span-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Reserves</p>
                                <p className="font-display text-2xl font-semibold text-success">{formatCurrency(report.reservesTotal)}</p>
                            </div>

                            <div className="lg:col-span-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Liabilities</p>
                                <p className="font-display text-2xl font-semibold">{formatCurrency(report.liabilitiesTotal)}</p>
                            </div>

                            <div className="lg:col-span-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Surplus</p>
                                <p className="font-display text-2xl font-semibold text-success">+{formatCurrency(surplus.toString())}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleDownloadArtifact('report', report.artifacts.report)}
                                className="btn-primary"
                            >
                                <Download size={16} />
                                Download Artifacts
                            </button>
                            <Link
                                to={`/inclusion?reportId=${report.reportId}`}
                                className="btn-secondary"
                            >
                                <Shield size={16} />
                                Verify Inclusion
                            </Link>
                            <CopyButton text={window.location.href} label="Copy Report Link" />
                            <CopyButton text={report.liabilitiesRoot} label="Copy Root Hash" />
                        </div>
                    </div>
                </SpotlightCard>

                {/* Section 2: Verification Statement */}
                <div className="rounded-xl border border-border bg-card/50 p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <h2 className="font-display text-lg font-medium mb-4">Verification Statement</h2>
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                        <p className="text-sm leading-relaxed">
                            This report attests that at epoch <code className="px-1.5 py-0.5 rounded bg-secondary text-accent-cream font-mono text-xs">{report.reportId}</code>,
                            total reserves were ≥ total liabilities.
                        </p>
                        <p className="text-sm text-muted-foreground mt-3">
                            Verification method: <span className="text-foreground">{report.verificationMethod.replace(/_/g, ' ')}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Network: <span className="text-foreground">{report.network}</span>
                        </p>
                    </div>
                </div>

                {/* Section 3: Report Inputs (Collapsible) */}
                <div className="rounded-xl border border-border bg-card/50 overflow-hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <button
                        onClick={() => setShowInputs(!showInputs)}
                        className="w-full flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors"
                    >
                        <h2 className="font-display text-lg font-medium">Report Inputs</h2>
                        {showInputs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showInputs && (
                        <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Liabilities Root</p>
                                    <code className="block p-3 rounded-lg bg-secondary/30 text-xs font-mono text-muted-foreground break-all">
                                        {report.liabilitiesRoot}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Epoch ID</p>
                                    <code className="block p-3 rounded-lg bg-secondary/30 text-xs font-mono text-muted-foreground">
                                        {report.reportId}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Reserves Total</p>
                                    <code className="block p-3 rounded-lg bg-secondary/30 text-xs font-mono text-muted-foreground">
                                        {report.reservesTotal}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Liabilities Total</p>
                                    <code className="block p-3 rounded-lg bg-secondary/30 text-xs font-mono text-muted-foreground">
                                        {report.liabilitiesTotal}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Epoch Timestamp</p>
                                    <code className="block p-3 rounded-lg bg-secondary/30 text-xs font-mono text-muted-foreground">
                                        {report.epochTimestamp}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                                    <p className="p-3 rounded-lg bg-secondary/30 text-sm text-muted-foreground">
                                        {report.notes || "No notes"}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowJsonModal('report')}
                                className="flex items-center gap-2 text-sm text-accent hover:underline"
                            >
                                <Code size={14} />
                                View Full JSON
                            </button>
                        </div>
                    )}
                </div>

                {/* Section 4: Artifacts Download Center */}
                <div className="rounded-xl border border-border bg-card/50 p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <h2 className="font-display text-lg font-medium mb-6">Artifacts</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {artifacts.map((artifact) => (
                            <div
                                key={artifact.name}
                                className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20 hover:border-accent/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <FileText size={20} className="text-accent-cream" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{artifact.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {artifact.size} • {truncateHash(artifact.hash, 6)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowJsonModal(artifact.type)}
                                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                                        title="View"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadArtifact(artifact.type, artifact.name)}
                                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 5: Report History / Navigation */}
                <div className="rounded-xl border border-border bg-card/50 p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
                    <h2 className="font-display text-lg font-medium mb-6">Report History</h2>

                    <div className="flex items-center justify-between mb-6">
                        {report.previousReportId ? (
                            <Link
                                to={`/proofs/${report.previousReportId}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Previous: {report.previousReportId}
                            </Link>
                        ) : (
                            <span className="text-sm text-muted-foreground/50">No previous report</span>
                        )}

                        {report.nextReportId ? (
                            <Link
                                to={`/proofs/${report.nextReportId}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Next: {report.nextReportId}
                                <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <span className="text-sm text-muted-foreground/50">Latest report</span>
                        )}
                    </div>

                    {/* Mini table of recent reports */}
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-secondary/30">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Report</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Coverage</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Published</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockReports.slice(0, 5).map((r) => (
                                    <tr
                                        key={r.reportId}
                                        className={`border-t border-border/50 ${r.reportId === report.reportId ? 'bg-accent/5' : 'hover:bg-secondary/20'} transition-colors`}
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/proofs/${r.reportId}`}
                                                className={`font-mono text-sm ${r.reportId === report.reportId ? 'text-accent-cream font-medium' : 'hover:text-accent'}`}
                                            >
                                                {r.reportId}
                                                {r.reportId === report.reportId && <span className="ml-2 text-xs">(current)</span>}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-accent-cream">{formatRatio(r.coverageRatio)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatShortDate(r.publishedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* JSON Modal */}
                {showJsonModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowJsonModal(null)}>
                        <div
                            className="w-full max-w-2xl max-h-[80vh] m-4 rounded-xl border border-border bg-card overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h3 className="font-medium">View JSON: {showJsonModal}</h3>
                                <button
                                    onClick={() => setShowJsonModal(null)}
                                    className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[60vh]">
                                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                                    {MockArtifactRepository.download(report.reportId, showJsonModal)}
                                </pre>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t border-border">
                                <button
                                    onClick={() => handleDownloadArtifact(showJsonModal, `${showJsonModal}-${report.reportId}.json`)}
                                    className="btn-primary text-sm"
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PortalLayout>
    );
}
