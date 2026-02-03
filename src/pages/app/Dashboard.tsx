import { useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
    mockReports,
    dashboardStats,
    formatCurrency,
    formatRatio,
    formatDate,
    formatShortDate
} from "@/lib/mock/portalData";
import { Link, useNavigate } from "react-router-dom";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import Counter from "@/components/reactbits/Counter";
import {
    TrendingUp,
    Shield,
    Clock,
    Search,
    Download,
    ExternalLink,
    CheckCircle2,
    ArrowRight,
    Calendar,
    Hash
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
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

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedReportIndex, setSelectedReportIndex] = useState(0);

    const latestReport = mockReports[selectedReportIndex];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const found = mockReports.find(r =>
                r.reportId.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (found) {
                navigate(`/proofs/${found.reportId}`);
            }
        }
    };

    return (
        <PortalLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-in">
                    <div className="space-y-1">
                        <h1 className="font-display text-3xl font-semibold">
                            Latest Verified Proof
                        </h1>
                        <p className="text-muted-foreground">
                            Cryptographic proof that reserves exceed liabilities
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search Epoch ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 w-64 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                            />
                        </form>

                        {/* Quick Actions */}
                        <Link
                            to="/inclusion"
                            className="btn-primary text-sm"
                        >
                            <Shield size={16} />
                            Verify Inclusion
                        </Link>
                        <Link
                            to="/proofs"
                            className="btn-secondary text-sm"
                        >
                            All Proofs
                        </Link>
                    </div>
                </div>

                {/* Primary Widget: Latest Verified Report */}
                <SpotlightCard
                    spotlightColor="rgba(74, 222, 128, 0.1)"
                    className="bg-card/95 border-border animate-fade-in-up"
                >
                    <div className="p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Latest Verified Report</p>
                                <h2 className="font-display text-xl font-medium">{latestReport.reportId}</h2>
                            </div>
                            <StatusBadge status={latestReport.status} />
                        </div>

                        <div className="grid gap-8 lg:grid-cols-12">
                            {/* Big Coverage Ratio */}
                            <div className="lg:col-span-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Coverage Ratio</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-display text-6xl font-bold text-accent-cream">
                                        <Counter
                                            value={Math.round(latestReport.coverageRatio * 100)}
                                            fontSize={64}
                                            gradientFrom="transparent"
                                            gradientTo="transparent"
                                        />
                                    </span>
                                    <span className="text-3xl text-muted-foreground">%</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {formatRatio(latestReport.coverageRatio)} reserves to liabilities
                                </p>
                            </div>

                            {/* Totals */}
                            <div className="lg:col-span-4 space-y-6">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Reserves</p>
                                    <p className="font-display text-2xl font-semibold text-success">
                                        {formatCurrency(latestReport.reservesTotal)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Liabilities</p>
                                    <p className="font-display text-2xl font-semibold">
                                        {formatCurrency(latestReport.liabilitiesTotal)}
                                    </p>
                                </div>
                            </div>

                            {/* Meta & Actions */}
                            <div className="lg:col-span-4 space-y-6">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Published</p>
                                    <p className="font-display text-lg font-medium flex items-center gap-2">
                                        <Calendar size={16} className="text-muted-foreground" />
                                        {formatDate(latestReport.publishedAt)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Link
                                        to={`/proofs/${latestReport.reportId}`}
                                        className="btn-primary justify-center"
                                    >
                                        View Proof Details
                                        <ArrowRight size={16} />
                                    </Link>
                                    <button className="btn-secondary justify-center text-sm">
                                        <Download size={14} />
                                        Download Summary (PDF)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SpotlightCard>

                {/* Report Timeline / Trend Strip */}
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Report History</p>
                    <div className="flex items-center gap-2">
                        {mockReports.slice(0, 6).map((report, idx) => (
                            <button
                                key={report.reportId}
                                onClick={() => setSelectedReportIndex(idx)}
                                className={`flex-1 p-4 rounded-xl border transition-all duration-200 ${
                                    idx === selectedReportIndex
                                        ? "border-accent/50 bg-accent/10 shadow-sm"
                                        : "border-border bg-card/50 hover:border-accent/30 hover:bg-secondary/50"
                                }`}
                            >
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-accent-cream">
                                        {formatRatio(report.coverageRatio)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {formatShortDate(report.publishedAt)}
                                    </p>
                                    <div className="flex justify-center mt-2">
                                        <GlowDot color={report.status === "VERIFIED" ? "bg-success" : "bg-yellow-500"} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Verification Highlights */}
                <div className="grid gap-4 md:grid-cols-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <SpotlightCard
                        spotlightColor="rgba(74, 222, 128, 0.08)"
                        className="bg-card/80 border-border"
                    >
                        <div className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <CheckCircle2 size={24} className="text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{dashboardStats.reportsVerified30d}</p>
                                <p className="text-xs text-muted-foreground">Reports verified (30d)</p>
                            </div>
                        </div>
                    </SpotlightCard>

                    <SpotlightCard
                        spotlightColor="rgba(236, 223, 204, 0.08)"
                        className="bg-card/80 border-border"
                    >
                        <div className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                <TrendingUp size={24} className="text-accent-cream" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatRatio(dashboardStats.averageCoverageRatio)}</p>
                                <p className="text-xs text-muted-foreground">Average coverage ratio</p>
                            </div>
                        </div>
                    </SpotlightCard>

                    <SpotlightCard
                        spotlightColor="rgba(224, 224, 224, 0.08)"
                        className="bg-card/80 border-border"
                    >
                        <div className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                                <Clock size={24} className="text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{formatShortDate(dashboardStats.lastPublishedAt)}</p>
                                <p className="text-xs text-muted-foreground">Last published</p>
                            </div>
                        </div>
                    </SpotlightCard>
                </div>

                {/* Recent Reports Table Preview */}
                <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-lg font-medium">Recent Proofs</h2>
                        <Link to="/proofs" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                            View all
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Report ID</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Coverage</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Published</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockReports.slice(0, 5).map((report, idx) => (
                                    <tr
                                        key={report.reportId}
                                        className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm">{report.reportId}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={report.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-accent-cream">{formatRatio(report.coverageRatio)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-muted-foreground">{formatShortDate(report.publishedAt)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/proofs/${report.reportId}`}
                                                    className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                                                    title="View Proof"
                                                >
                                                    <ExternalLink size={16} />
                                                </Link>
                                                <button
                                                    className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                                                    title="Download Artifacts"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
