import { Clock, AlertCircle } from 'lucide-react';

interface FreshnessIndicatorProps {
    timestamp: string;
    validUntil: string;
    className?: string;
}

function formatRelative(iso: string): string {
    if (!iso) return 'Unknown';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return 'In the future';
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function formatUntil(iso: string): string {
    if (!iso) return 'Unknown';
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `Expires in ${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `Expires in ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Expires in ${hours}h`;
    return `Expires in ${Math.floor(hours / 24)}d`;
}

export function FreshnessIndicator({ timestamp, validUntil, className = '' }: FreshnessIndicatorProps) {
    const isExpired = validUntil && new Date(validUntil).getTime() < Date.now();
    return (
        <div className={`flex items-center gap-3 text-sm ${className}`}>
            <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={14} />
                {formatRelative(timestamp)}
            </span>
            <span
                className={`flex items-center gap-1 ${
                    isExpired ? 'text-red-500' : 'text-green-500'
                }`}
            >
                {isExpired && <AlertCircle size={14} />}
                {formatUntil(validUntil)}
            </span>
        </div>
    );
}
