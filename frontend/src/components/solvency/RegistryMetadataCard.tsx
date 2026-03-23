import { Link2, Hash, Calendar } from 'lucide-react';
import type { RegistryMetadata } from '@/types/solvency';

interface RegistryMetadataCardProps {
    registry: RegistryMetadata | null;
    className?: string;
}

function truncate(s: string, n = 14): string {
    if (!s) return '—';
    if (s.length <= n) return s;
    return `${s.slice(0, n)}…`;
}

function formatDate(iso: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export function RegistryMetadataCard({ registry, className = '' }: RegistryMetadataCardProps) {
    if (!registry) {
        return (
            <div className={`rounded-xl border border-border bg-card/50 p-5 text-sm text-muted-foreground ${className}`}>
                Registry metadata unavailable.
            </div>
        );
    }

    return (
        <div className={`rounded-xl border border-border bg-card/50 p-5 space-y-3 ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                <Link2 size={15} className="text-accent" />
                <span className="text-sm font-medium">Algorand Registry</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Entity ID</p>
                    <p className="font-mono font-medium">{registry.entity_id || '—'}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Total Epochs</p>
                    <p className="font-semibold">{registry.epoch_count ?? '—'}</p>
                </div>
                {registry.algorand_app_id && (
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">App ID</p>
                        <span className="flex items-center gap-1 font-mono text-accent">
                            <Hash size={12} />
                            {registry.algorand_app_id}
                        </span>
                    </div>
                )}
                {registry.algorand_address && (
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Address</p>
                        <span className="font-mono text-xs">{truncate(registry.algorand_address, 16)}</span>
                    </div>
                )}
                <div className="col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Last Updated</p>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {formatDate(registry.last_updated)}
                    </span>
                </div>
            </div>
        </div>
    );
}
