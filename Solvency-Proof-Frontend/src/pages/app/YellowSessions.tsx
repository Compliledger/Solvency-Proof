import { useState, useEffect } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useSolvencyProof } from "@/hooks/useSolvencyProof";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { Link } from "react-router-dom";
import {
    Zap,
    Users,
    Plus,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Edit3,
    Trash2,
    Save,
    RefreshCw,
} from "lucide-react";

interface Session {
    id: string;
    status: string;
    participants: string[];
    allocations: Record<string, string>;
    createdAt?: string;
}

export default function YellowSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [newSessionName, setNewSessionName] = useState("Demo Session");
    const [editingAllocations, setEditingAllocations] = useState<Record<string, string>>({});
    const [newUserId, setNewUserId] = useState("");
    const [newUserBalance, setNewUserBalance] = useState("");

    const { getYellowStatus, getYellowSessions, createYellowSession, updateAllocations, loading, error } = useSolvencyProof();

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const res = await getYellowSessions();
            setSessions(res.sessions || []);
            if (res.sessions?.length > 0 && !selectedSession) {
                setSelectedSession(res.sessions[0]);
                setEditingAllocations(res.sessions[0].allocations || {});
            }
        } catch (err) {
            console.error("[YellowSessions] Failed to fetch sessions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleCreateSession = async () => {
        setIsCreating(true);
        try {
            const res = await createYellowSession(["0x0000000000000000000000000000000000000000"]);
            if (res.session) {
                setSessions(prev => [...prev, res.session]);
                setSelectedSession(res.session);
                setEditingAllocations(res.session.allocations || {});
            }
            await fetchSessions();
        } catch (err) {
            console.error("[YellowSessions] Failed to create session:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveAllocations = async () => {
        if (!selectedSession) return;
        setIsSaving(true);
        try {
            await updateAllocations(selectedSession.id, editingAllocations);
            await fetchSessions();
        } catch (err) {
            console.error("[YellowSessions] Failed to save allocations:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddUser = () => {
        if (!newUserId.trim() || !newUserBalance.trim()) return;
        setEditingAllocations(prev => ({
            ...prev,
            [newUserId]: newUserBalance
        }));
        setNewUserId("");
        setNewUserBalance("");
    };

    const handleRemoveUser = (userId: string) => {
        setEditingAllocations(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
        });
    };

    const handleUpdateBalance = (userId: string, balance: string) => {
        setEditingAllocations(prev => ({
            ...prev,
            [userId]: balance
        }));
    };

    const totalLiabilities = Object.values(editingAllocations).reduce((sum, bal) => {
        return sum + (parseInt(bal) || 0);
    }, 0);

    if (isLoading) {
        return (
            <PortalLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <Loader2 size={48} className="animate-spin mx-auto text-yellow-500" />
                        <p className="text-muted-foreground">Loading Yellow Network sessions...</p>
                    </div>
                </div>
            </PortalLayout>
        );
    }

    return (
        <PortalLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <Zap size={24} className="text-yellow-500" />
                            </div>
                            Yellow Network - State Channels
                        </h1>
                        <p className="text-muted-foreground mt-1">Instant balance updates with zero gas fees</p>
                    </div>
                    <button
                        onClick={fetchSessions}
                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Why State Channels */}
                <SpotlightCard spotlightColor="rgba(234, 179, 8, 0.1)" className="bg-card/80 border-border">
                    <div className="p-6">
                        <h3 className="font-medium mb-3">Why State Channels?</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <Zap size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                                Update user balances <span className="text-yellow-500 font-medium">INSTANTLY</span> (no blockchain tx)
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                                <span className="text-success font-medium">ZERO</span> gas fees for balance changes
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                                Only settle on-chain when generating proof
                            </li>
                        </ul>
                    </div>
                </SpotlightCard>

                {/* Create Session */}
                <SpotlightCard spotlightColor="rgba(234, 179, 8, 0.1)" className="bg-card/80 border-border">
                    <div className="p-6">
                        <h3 className="font-medium mb-4">Create New Session</h3>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                placeholder="Session Name"
                                className="flex-1 px-4 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                            />
                            <button
                                onClick={handleCreateSession}
                                disabled={isCreating}
                                className="btn-primary bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50"
                            >
                                {isCreating ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Plus size={16} />
                                )}
                                Create Session
                            </button>
                        </div>
                    </div>
                </SpotlightCard>

                {/* Sessions List */}
                {sessions.length > 0 && (
                    <div>
                        <h3 className="font-medium mb-4">Active Sessions</h3>
                        <div className="grid gap-4">
                            {sessions.map((session) => (
                                <SpotlightCard
                                    key={session.id}
                                    spotlightColor="rgba(234, 179, 8, 0.1)"
                                    className={`bg-card/80 border-border cursor-pointer transition-all ${
                                        selectedSession?.id === session.id ? "ring-2 ring-yellow-500/50" : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedSession(session);
                                        setEditingAllocations(session.allocations || {});
                                    }}
                                >
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                                <Users size={18} className="text-yellow-500" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-sm">{session.id}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Status: <span className="text-success">🟢 {session.status}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {Object.keys(session.allocations || {}).length} participants
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {Object.values(session.allocations || {}).reduce((s, v) => s + (parseInt(v) || 0), 0).toLocaleString()} units
                                            </p>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* Session Detail - Live Balance Editor */}
                {selectedSession && (
                    <SpotlightCard spotlightColor="rgba(234, 179, 8, 0.15)" className="bg-card/95 border-border">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-medium flex items-center gap-2">
                                    <Zap size={18} className="text-yellow-500" />
                                    Live Balance Editor (No Gas Required!)
                                </h3>
                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                    Session: {selectedSession.id.slice(0, 20)}...
                                </span>
                            </div>

                            {/* Allocations Table */}
                            <div className="rounded-xl border border-border overflow-hidden mb-6">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-secondary/30 border-b border-border">
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">User</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Balance</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(editingAllocations).map(([userId, balance]) => (
                                            <tr key={userId} className="border-b border-border/50 last:border-0">
                                                <td className="px-4 py-3 font-medium">{userId}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={balance}
                                                        onChange={(e) => handleUpdateBalance(userId, e.target.value)}
                                                        className="w-full text-right px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleRemoveUser(userId)}
                                                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {Object.keys(editingAllocations).length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                                    No users yet. Add some below!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add New User */}
                            <div className="p-4 rounded-xl bg-secondary/30 border border-border mb-6">
                                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <Plus size={16} />
                                    Add New User
                                </p>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newUserId}
                                        onChange={(e) => setNewUserId(e.target.value)}
                                        placeholder="User ID (e.g., dave)"
                                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                                    />
                                    <input
                                        type="text"
                                        value={newUserBalance}
                                        onChange={(e) => setNewUserBalance(e.target.value)}
                                        placeholder="Balance (e.g., 100000)"
                                        className="w-32 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                                    />
                                    <button
                                        onClick={handleAddUser}
                                        disabled={!newUserId.trim() || !newUserBalance.trim()}
                                        className="btn-secondary disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Liabilities</p>
                                        <p className="font-display text-2xl font-semibold">{totalLiabilities.toLocaleString()} units</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Last Update</p>
                                        <p className="text-sm text-success">Just now (no tx needed!)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleSaveAllocations}
                                    disabled={isSaving}
                                    className="btn-secondary"
                                >
                                    {isSaving ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    Save Changes
                                </button>
                                <Link to="/liabilities" className="btn-primary">
                                    Build Merkle Tree
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </SpotlightCard>
                )}

                {sessions.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No sessions yet. Create one to get started!</p>
                    </div>
                )}
            </div>
        </PortalLayout>
    );
}
