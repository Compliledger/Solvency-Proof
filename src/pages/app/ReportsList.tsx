import { useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
    mockReports,
    MockReportRepository,
    formatCurrency,
    formatRatio,
    formatShortDate
} from "@/lib/mock/portalData";
import { Link } from "react-router-dom";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import {
    Search,
    Filter,
    Download,
    ExternalLink,
    ChevronDown,
    Calendar,
    TrendingUp,
    X
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

export default function ReportsList() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [minRatio, setMinRatio] = useState<number>(0);
    const [maxRatio, setMaxRatio] = useState<number>(2);
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const filtered = MockReportRepository.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery,
        minRatio: minRatio > 0 ? minRatio : undefined,
        maxRatio: maxRatio < 2 ? maxRatio : undefined
    });

    const selectedReportData = selectedReport
        ? mockReports.find(r => r.reportId === selectedReport)
        : null;

    const clearFilters = () => {
        setStatusFilter("all");
        setSearchQuery("");
        setMinRatio(0);
        setMaxRatio(2);
    };

    const hasActiveFilters = statusFilter !== "all" || searchQuery || minRatio > 0 || maxRatio < 2;

    return (
        <PortalLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 animate-fade-in">
                    <div className="space-y-1">
                        <h1 className="font-display text-3xl font-semibold">All Proofs</h1>
                        <p className="text-muted-foreground">
                            Browse verified solvency proofs across all epochs.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search Epoch ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 w-56 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                                showFilters || hasActiveFilters
                                    ? "border-accent/50 bg-accent/10 text-foreground"
                                    : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Filter size={16} />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-accent" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border bg-card/50 animate-fade-in">
                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                            >
                                <option value="all">All Status</option>
                                <option value="VERIFIED">Verified</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        {/* Coverage Ratio Range */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Min Coverage</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="2"
                                value={minRatio}
                                onChange={(e) => setMinRatio(parseFloat(e.target.value) || 0)}
                                className="w-24 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Coverage</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="2"
                                value={maxRatio}
                                onChange={(e) => setMaxRatio(parseFloat(e.target.value) || 2)}
                                className="w-24 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={14} />
                                Clear filters
                            </button>
                        )}

                        <div className="flex-1" />

                        <p className="text-sm text-muted-foreground">
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex gap-6">
                    {/* Table */}
                    <div className="flex-1">
                        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/30">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Report ID</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Coverage</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Reserves</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Liabilities</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Published</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((report) => (
                                        <tr
                                            key={report.reportId}
                                            className={`border-b border-border/50 last:border-0 transition-colors cursor-pointer ${
                                                selectedReport === report.reportId
                                                    ? "bg-accent/5"
                                                    : "hover:bg-secondary/20"
                                            }`}
                                            onClick={() => setSelectedReport(
                                                selectedReport === report.reportId ? null : report.reportId
                                            )}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm">{report.reportId}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={report.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${
                                                    report.coverageRatio >= 1 ? "text-accent-cream" : "text-destructive"
                                                }`}>
                                                    {formatRatio(report.coverageRatio)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-success">{formatCurrency(report.reservesTotal)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground">{formatCurrency(report.liabilitiesTotal)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground">{formatShortDate(report.publishedAt)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Link
                                                        to={`/proofs/${report.reportId}`}
                                                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                                                        title="View Report"
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

                            {filtered.length === 0 && (
                                <div className="px-6 py-12 text-center">
                                    <p className="text-muted-foreground">No reports match your filters.</p>
                                    <button
                                        onClick={clearFilters}
                                        className="mt-2 text-sm text-accent hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Panel Preview */}
                    {selectedReportData && (
                        <div className="w-80 shrink-0 animate-fade-in">
                            <SpotlightCard
                                spotlightColor="rgba(236, 223, 204, 0.1)"
                                className="bg-card/90 border-border sticky top-24"
                            >
                                <div className="p-6 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preview</p>
                                            <h3 className="font-display font-medium mt-1">{selectedReportData.reportId}</h3>
                                        </div>
                                        <button
                                            onClick={() => setSelectedReport(null)}
                                            className="p-1 rounded hover:bg-secondary/50 text-muted-foreground"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Coverage Ratio</p>
                                            <p className="text-3xl font-bold text-accent-cream">{formatRatio(selectedReportData.coverageRatio)}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reserves</p>
                                                <p className="text-sm font-medium text-success">{formatCurrency(selectedReportData.reservesTotal)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Liabilities</p>
                                                <p className="text-sm font-medium">{formatCurrency(selectedReportData.liabilitiesTotal)}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                                            <StatusBadge status={selectedReportData.status} />
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Published</p>
                                            <p className="text-sm flex items-center gap-2">
                                                <Calendar size={14} className="text-muted-foreground" />
                                                {formatShortDate(selectedReportData.publishedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/proofs/${selectedReportData.reportId}`}
                                        className="btn-primary w-full justify-center"
                                    >
                                        View Full Report
                                    </Link>
                                </div>
                            </SpotlightCard>
                        </div>
                    )}
                </div>
            </div>
        </PortalLayout>
    );
}
