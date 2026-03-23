import { Shield, TrendingUp } from 'lucide-react';
import SpotlightCard from '@/components/reactbits/SpotlightCard';

interface CapitalStateCardProps {
    reservesTotal: number;
    totalLiabilities: number;
    capitalBacked: boolean;
    className?: string;
}

function formatAmount(n: number): string {
    if (!n || isNaN(n)) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n.toFixed(2);
}

export function CapitalStateCard({ reservesTotal, totalLiabilities, capitalBacked, className = '' }: CapitalStateCardProps) {
    const ratio = totalLiabilities > 0 ? (reservesTotal / totalLiabilities) * 100 : 0;
    const color = capitalBacked ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return (
        <SpotlightCard spotlightColor={color} className={`bg-card/80 border-border ${className}`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${capitalBacked ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <Shield size={20} className={capitalBacked ? 'text-green-500' : 'text-red-500'} />
                        </div>
                        <span className="font-medium text-sm">Capital Backing</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${capitalBacked ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {capitalBacked ? 'BACKED' : 'UNCOVERED'}
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reserves</span>
                        <span className="font-mono font-medium">{formatAmount(reservesTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Liabilities</span>
                        <span className="font-mono font-medium">{formatAmount(totalLiabilities)}</span>
                    </div>
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Coverage Ratio</span>
                            <span className={capitalBacked ? 'text-green-500' : 'text-red-500'}>{ratio.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary">
                            <div
                                className={`h-full rounded-full transition-all ${capitalBacked ? 'bg-green-500' : 'bg-red-500'}`}
                                // Cap ratio display at 200% (÷2 so 100% backing = 50% bar width,
                                // leaving room to show excess coverage visually).
                                style={{ width: `${Math.min(ratio, 200) / 2}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                    <TrendingUp size={12} />
                    <span>Ratio = Reserves / Total Liabilities</span>
                </div>
            </div>
        </SpotlightCard>
    );
}
