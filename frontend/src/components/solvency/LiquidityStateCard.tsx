import { Droplets, AlertTriangle } from 'lucide-react';
import SpotlightCard from '@/components/reactbits/SpotlightCard';

interface LiquidityStateCardProps {
    liquidAssetsTotal: number;
    nearTermLiabilitiesTotal: number;
    liquidityReady: boolean;
    className?: string;
}

function formatAmount(n: number): string {
    if (!n || isNaN(n)) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n.toFixed(2);
}

export function LiquidityStateCard({
    liquidAssetsTotal,
    nearTermLiabilitiesTotal,
    liquidityReady,
    className = '',
}: LiquidityStateCardProps) {
    const ratio = nearTermLiabilitiesTotal > 0
        ? (liquidAssetsTotal / nearTermLiabilitiesTotal) * 100
        : 0;
    const color = liquidityReady ? 'rgba(147, 51, 234, 0.1)' : 'rgba(234, 179, 8, 0.1)';

    return (
        <SpotlightCard spotlightColor={color} className={`bg-card/80 border-border ${className}`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${liquidityReady ? 'bg-purple-500/10' : 'bg-yellow-500/10'}`}>
                            {liquidityReady
                                ? <Droplets size={20} className="text-purple-500" />
                                : <AlertTriangle size={20} className="text-yellow-500" />}
                        </div>
                        <span className="font-medium text-sm">Liquidity Readiness</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${liquidityReady ? 'bg-purple-500/10 text-purple-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {liquidityReady ? 'READY' : 'STRESSED'}
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Liquid Assets</span>
                        <span className="font-mono font-medium">{formatAmount(liquidAssetsTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Near-term Liabilities</span>
                        <span className="font-mono font-medium">{formatAmount(nearTermLiabilitiesTotal)}</span>
                    </div>
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Liquidity Ratio</span>
                            <span className={liquidityReady ? 'text-purple-500' : 'text-yellow-500'}>{ratio.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary">
                            <div
                                className={`h-full rounded-full transition-all ${liquidityReady ? 'bg-purple-500' : 'bg-yellow-500'}`}
                                // Cap ratio display at 200% (÷2 so 100% liquidity = 50% bar width,
                                // leaving room to show excess liquidity visually).
                                style={{ width: `${Math.min(ratio, 200) / 2}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                    <Droplets size={12} />
                    <span>Ratio = Liquid Assets / Near-term Liabilities</span>
                </div>
            </div>
        </SpotlightCard>
    );
}
