'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStationData, setStationData, StationData, DEFAULT_DATA } from '@/lib/stationStore';
import { connectSocket } from '@/app/config/socket';

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS — inline SVGs to avoid extra deps
   ═══════════════════════════════════════════════════════════════════════════ */
const ZapIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const BatteryIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="18" height="11" rx="2" /><path d="M22 11v3" />
        <path d="M6 11v2" /><path d="M10 11v2" /><path d="M14 11v2" />
    </svg>
);
const PackageIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
);
const QueueIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const StationIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-4V4a2 2 0 0 0-4 0v6H6l6 10 6-10z" />
    </svg>
);
const EyeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const CheckCircle = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
const UploadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);
const ActivityIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);
const LogOutIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
const TerminalIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE CLOCK
   ═══════════════════════════════════════════════════════════════════════════ */
const LiveClock = () => {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <div className="text-right">
            <p className="font-mono text-xs text-neutral-300 tabular-nums">{time}</p>
            <p className="text-[10px] text-neutral-600">{date}</p>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CIRCULAR GAUGE — battery health
   ═══════════════════════════════════════════════════════════════════════════ */
const CircularGauge = ({ value, color, size = 140 }: { value: number; color: string; size?: number }) => {
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="10" fill="none"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-700"
                    style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tabular-nums" style={{ color }}>{value}</span>
                <span className="text-[10px] text-neutral-500 -mt-0.5">percent</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   STEPPER CONTROL — +/- buttons
   ═══════════════════════════════════════════════════════════════════════════ */
const Stepper = ({
    value, onChange, min, max, color,
}: { value: number; onChange: (v: number) => void; min: number; max: number; color: string }) => (
    <div className="flex items-center gap-3">
        <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold text-lg flex items-center justify-center transition-all active:scale-90 hover:border-white/20"
        >−</button>
        <span className="text-4xl font-bold tabular-nums w-20 text-center transition-all duration-300" style={{ color }}>{value}</span>
        <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold text-lg flex items-center justify-center transition-all active:scale-90 hover:border-white/20"
        >+</button>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM TOGGLE — animated on/off
   ═══════════════════════════════════════════════════════════════════════════ */
const PremiumToggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
        onClick={onToggle}
        className={`relative w-[72px] h-9 rounded-full transition-all duration-500 focus:outline-none shrink-0 ${active
            ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.4)]'
            : 'bg-neutral-800 border border-white/10'
            }`}
    >
        {/* Glow ring when active */}
        {active && <span className="absolute inset-0 rounded-full admin-animate-pulse-ring bg-green-500/20" />}
        <span
            className={`absolute top-[4px] w-[28px] h-[28px] rounded-full shadow-lg transition-all duration-500 flex items-center justify-center text-[11px] ${active
                ? 'left-[40px] bg-white'
                : 'left-[4px] bg-neutral-600'
                }`}
        >
            {active ? '⚡' : '⛔'}
        </span>
    </button>
);

/* ═══════════════════════════════════════════════════════════════════════════
   QUEUE VISUALIZATION — animated people dots
   ═══════════════════════════════════════════════════════════════════════════ */
const QueueVisual = ({ count, maxVisible = 12 }: { count: number; maxVisible?: number }) => {
    const dots = Math.min(count, maxVisible);
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {Array.from({ length: dots }).map((_, i) => (
                <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-purple-500/80 admin-animate-slide-up"
                    style={{
                        animationDelay: `${i * 60}ms`,
                        opacity: 0,
                        boxShadow: '0 0 8px rgba(168,85,247,0.4)',
                    }}
                />
            ))}
            {count > maxVisible && (
                <span className="text-[10px] text-purple-400 ml-1 self-center font-medium">
                    +{count - maxVisible}
                </span>
            )}
            {count === 0 && (
                <span className="text-xs text-neutral-700 italic">No one waiting</span>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CONTROL CARD — glass wrapper
   ═══════════════════════════════════════════════════════════════════════════ */
const ControlCard = ({
    icon, label, glow, delay = 0, children,
}: { icon: React.ReactNode; label: string; glow: string; delay?: number; children: React.ReactNode }) => (
    <div
        className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-sm p-6 flex flex-col gap-5 relative overflow-hidden group hover:border-white/[0.14] transition-all duration-500 admin-animate-slide-up"
        style={{
            boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.04), 0 0 80px -20px ${glow}15`,
            animationDelay: `${delay}ms`,
            opacity: 0,
        }}
    >
        {/* Ambient corner glow */}
        <div
            className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
            style={{ backgroundColor: glow }}
        />
        <div
            className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700 pointer-events-none"
            style={{ backgroundColor: glow }}
        />

        {/* Header */}
        <div className="flex items-center gap-3 relative z-10">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${glow}15`, color: glow, boxShadow: `0 0 20px ${glow}15` }}
            >
                {icon}
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">{label}</span>
        </div>

        {/* Content */}
        <div className="relative z-10">{children}</div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   SHIMMER BAR — animated gradient skeleton
   ═══════════════════════════════════════════════════════════════════════════ */
const ShimmerBar = ({ percent, color }: { percent: number; color: string }) => (
    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
            className="h-full rounded-full transition-all duration-700 relative"
            style={{
                width: `${percent}%`,
                background: `linear-gradient(90deg, ${color}cc, ${color}, ${color}cc)`,
                boxShadow: `0 0 12px ${color}40`,
            }}
        >
            <div
                className="absolute inset-0 rounded-full admin-animate-shimmer"
                style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)` }}
            />
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   ⚡ MAIN ADMIN PANEL (PROTECTED)
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminPanelPage() {
    const router = useRouter();
    const [form, setForm] = useState<StationData>(DEFAULT_DATA);
    const [saved, setSaved] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [pulse, setPulse] = useState(false);
    const [saving, setSaving] = useState(false);
    const [adminInfo, setAdminInfo] = useState<{ name: string; email: string } | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [selectedStationId, setSelectedStationId] = useState("NEAR-001");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [ocppLogs, setOcppLogs] = useState<any[]>([]);
    const [hardwareConnected, setHardwareConnected] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // ── Auth guard — redirect to login if not authenticated ─────────────
    useEffect(() => {
        const verifyAdmin = async () => {
            const token = localStorage.getItem('voltix_admin_token');
            if (!token) {
                router.replace('/admin');
                return;
            }

            try {
                const res = await fetch('/api/admin-auth/verify', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!data.success) {
                    localStorage.removeItem('voltix_admin_token');
                    localStorage.removeItem('voltix_admin_info');
                    router.replace('/admin');
                    return;
                }
                setAdminInfo(data.admin);
            } catch {
                localStorage.removeItem('voltix_admin_token');
                localStorage.removeItem('voltix_admin_info');
                router.replace('/admin');
                return;
            }

            setAuthChecked(true);
        };
        verifyAdmin();
    }, [router]);

    useEffect(() => {
        if (authChecked) {
            getStationData(selectedStationId).then(setForm);
        }
    }, [authChecked, selectedStationId]);

    // ── Listen for OCPP logs & Hardware telemetry ─────────────────────────
    useEffect(() => {
        if (!authChecked) return;
        const socket = connectSocket();

        const handleOcppLog = (log: any) => {
            if (log.stationId === selectedStationId) {
                setHardwareConnected(true);
                setOcppLogs((prev) => [...prev.slice(-49), log]);
                setTimeout(() => {
                    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };

        const handleMetricsUpdate = (data: any) => {
            if (data.stationId === selectedStationId && data.health && data.health.batteryLevel) {
                setForm((prev) => ({
                    ...prev,
                    batteryPercentage: Math.round(Number(data.health.batteryLevel)),
                }));
            }
        };

        socket.on("ocpp-log", handleOcppLog);
        socket.on("station-metrics-update", handleMetricsUpdate);

        return () => {
            socket.off("ocpp-log", handleOcppLog);
            socket.off("station-metrics-update", handleMetricsUpdate);
        };
    }, [authChecked, selectedStationId]);

    // Clear logs when station changes
    useEffect(() => {
        setOcppLogs([]);
        setHardwareConnected(false);
    }, [selectedStationId]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        await setStationData(selectedStationId, { ...form, lastUpdatedBy: `Admin · ${now}` });
        setSaving(false);
        setLastSavedAt(now);
        setSaved(true);
        setPulse(true);
        setTimeout(() => setSaved(false), 3000);
        setTimeout(() => setPulse(false), 600);
    }, [form, selectedStationId]);

    const handleLogout = () => {
        localStorage.removeItem('voltix_admin_token');
        localStorage.removeItem('voltix_admin_info');
        // Also call backend logout
        fetch('/api/admin-auth/logout', { method: 'POST' }).catch(() => { });
        router.replace('/admin');
    };

    const set = <K extends keyof StationData>(key: K, value: StationData[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const batteryColor = form.batteryPercentage >= 60 ? '#22c55e' : form.batteryPercentage >= 30 ? '#f59e0b' : '#ef4444';
    const batteryLabel = form.batteryPercentage >= 60 ? 'Healthy' : form.batteryPercentage >= 30 ? 'Moderate' : 'Critical';
    const queueColor = form.queueCount === 0 ? '#22c55e' : form.queueCount <= 5 ? '#a855f7' : '#ef4444';

    // ── Loading state while checking auth ───────────────────────────────
    if (!authChecked) {
        return (
            <div className="min-h-screen bg-[#050507] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-black animate-pulse shadow-lg shadow-green-500/30">
                        <ZapIcon size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                        </svg>
                        <span className="text-neutral-500 text-sm">Verifying admin access...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] text-white flex flex-col relative">

            {/* ── Animated mesh background ────────────────────────────────────── */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-green-500/[0.04] blur-[120px] admin-animate-float" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-[100px] admin-animate-float" style={{ animationDelay: '3s' }} />
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-500/[0.03] blur-[80px] admin-animate-float" style={{ animationDelay: '5s' }} />
            </div>

            {/* ── Logout confirmation modal ───────────────────────────────────── */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm admin-animate-slide-up" style={{ opacity: 0 }}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
                            <LogOutIcon size={22} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Sign Out?</h3>
                        <p className="text-neutral-500 text-sm mb-6">You will need to authenticate again to access the admin panel.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-semibold transition-all"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Top nav bar ────────────────────────────────────────────────── */}
            <header className="border-b border-white/[0.06] bg-[#050507]/70 backdrop-blur-2xl px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3.5">
                    {/* Logo */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-black shadow-lg shadow-green-500/25">
                        <ZapIcon size={15} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[15px] tracking-tight">Voltix</span>
                        <span className="text-neutral-700">/</span>
                        <span className="text-neutral-400 text-sm font-medium">Admin Panel</span>
                    </div>
                    <span className="ml-1 text-[9px] font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-[0.2em]">
                        Operator
                    </span>
                </div>

                <div className="flex items-center gap-5">
                    {/* Admin info */}
                    {adminInfo && (
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center text-green-400 text-[11px] font-bold border border-green-500/20">
                                {adminInfo.name?.charAt(0) || 'A'}
                            </div>
                            <span className="text-xs text-neutral-500">{adminInfo.email}</span>
                        </div>
                    )}
                    <LiveClock />
                    {/* Logout button */}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-1.5 text-neutral-600 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/[0.08] border border-transparent hover:border-red-500/[0.15]"
                        title="Sign Out"
                    >
                        <LogOutIcon size={14} />
                        <span className="text-[11px] font-medium hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* ── Body ────────────────────────────────────────────────────────── */}
            <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">

                {/* Page title */}
                <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="flex items-center gap-1.5 text-green-400">
                                <ActivityIcon />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Live</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-neutral-700" />
                            <select
                                value={selectedStationId}
                                onChange={(e) => setSelectedStationId(e.target.value)}
                                className="bg-[#111] border border-white/10 text-white rounded-md text-xs px-2 py-1 outline-none font-bold"
                            >
                                <option value="NEAR-001">Station NEAR-001</option>
                                <option value="NEAR-002">Station NEAR-002</option>
                                <option value="NEAR-003">Station NEAR-003</option>
                                <option value="NEAR-004">Station NEAR-004</option>
                                <option value="NEAR-005">Station NEAR-005</option>
                            </select>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Station Control Center</h1>
                        <p className="text-neutral-600 text-sm mt-1.5">
                            Configure live EV station data · changes reflect instantly on user dashboard
                        </p>
                    </div>
                    {lastSavedAt && (
                        <div className="flex items-center gap-2.5 text-xs bg-green-500/[0.05] border border-green-500/[0.15] rounded-xl px-4 py-2.5 admin-animate-slide-up">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                            </span>
                            <span className="text-neutral-500">Last synced:</span>
                            <span className="text-green-400 font-medium">{lastSavedAt}</span>
                        </div>
                    )}
                </div>

                {/* ── Live preview strip ──────────────────────────────────────── */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm px-6 py-4 mb-8 flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${form.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">Preview</span>
                    </div>

                    <div className="flex flex-wrap gap-5 items-center">
                        {/* Battery */}
                        <div className="flex items-center gap-2">
                            <div style={{ color: batteryColor }}><BatteryIcon size={16} /></div>
                            <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${form.batteryPercentage}%`, backgroundColor: batteryColor }} />
                            </div>
                            <span className="text-sm font-bold tabular-nums" style={{ color: batteryColor }}>{form.batteryPercentage}%</span>
                        </div>
                        <div className="w-px h-4 bg-white/10 hidden sm:block" />
                        {/* Batteries */}
                        <div className="flex items-center gap-1.5 text-blue-400">
                            <PackageIcon size={15} />
                            <span className="text-sm font-bold">{form.batteriesAvailable}</span>
                            <span className="text-xs text-neutral-600">batteries</span>
                        </div>
                        <div className="w-px h-4 bg-white/10 hidden sm:block" />
                        {/* Queue */}
                        <div className="flex items-center gap-1.5" style={{ color: queueColor }}>
                            <QueueIcon size={15} />
                            <span className="text-sm font-bold">{form.queueCount}</span>
                            <span className="text-xs text-neutral-600">in queue</span>
                        </div>
                        <div className="w-px h-4 bg-white/10 hidden sm:block" />
                        {/* Status */}
                        <div className={`text-sm font-bold ${form.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {form.isActive ? '⚡ Online' : '⛔ Offline'}
                        </div>
                    </div>
                </div>

                {/* ── 2×2 control cards grid ─────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

                    {/* ─── Card 1 — Battery Health ─────────────────────────── */}
                    <ControlCard icon={<BatteryIcon />} label="Battery Health" glow={batteryColor} delay={0}>
                        <div className="flex items-center gap-6">
                            <CircularGauge value={form.batteryPercentage} color={batteryColor} />
                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                                            style={{ color: batteryColor, borderColor: `${batteryColor}30`, backgroundColor: `${batteryColor}10` }}
                                        >
                                            {batteryLabel}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-600 mt-1">
                                        Drag slider or tap +/− to adjust
                                    </p>
                                </div>
                                <Stepper value={form.batteryPercentage} onChange={v => set('batteryPercentage', v)} min={0} max={100} color={batteryColor} />
                            </div>
                        </div>
                        <div className="space-y-1.5 mt-1">
                            <input
                                type="range" min={0} max={100} step={1}
                                value={form.batteryPercentage}
                                onChange={e => set('batteryPercentage', Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer admin-range-slider"
                                style={{
                                    background: `linear-gradient(to right, ${batteryColor} 0%, ${batteryColor} ${form.batteryPercentage}%, rgba(255,255,255,0.06) ${form.batteryPercentage}%, rgba(255,255,255,0.06) 100%)`,
                                }}
                            />
                            <div className="flex justify-between text-[9px] text-neutral-700 font-medium">
                                <span>0% · Dead</span><span>100% · Full Charge</span>
                            </div>
                        </div>
                    </ControlCard>

                    {/* ─── Card 2 — Batteries Available ────────────────────── */}
                    <ControlCard icon={<PackageIcon />} label="Batteries Available" glow="#3b82f6" delay={100}>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="text-6xl font-bold tabular-nums text-blue-400 leading-none">{form.batteriesAvailable}</div>
                                <div className="text-[10px] text-neutral-600 mt-1 font-medium">of 50 capacity</div>
                            </div>
                            <div className="flex-1">
                                <Stepper value={form.batteriesAvailable} onChange={v => set('batteriesAvailable', v)} min={0} max={50} color="#3b82f6" />
                            </div>
                        </div>
                        {/* Visual battery blocks */}
                        <div className="flex gap-1 mt-1">
                            {Array.from({ length: 10 }).map((_, i) => {
                                const filled = form.batteriesAvailable / 50 * 10 > i;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 h-3 rounded-sm transition-all duration-500"
                                        style={{
                                            backgroundColor: filled ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                            boxShadow: filled ? '0 0 8px rgba(59,130,246,0.3)' : 'none',
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <div className="space-y-1.5 mt-3">
                            <input
                                type="range" min={0} max={50} step={1}
                                value={form.batteriesAvailable}
                                onChange={e => set('batteriesAvailable', Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer admin-range-slider"
                                style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(form.batteriesAvailable / 50) * 100}%, rgba(255,255,255,0.06) ${(form.batteriesAvailable / 50) * 100}%, rgba(255,255,255,0.06) 100%)`,
                                }}
                            />
                            <div className="flex justify-between text-[9px] text-neutral-700 font-medium">
                                <span>0 · Empty</span><span>50 · Full Stock</span>
                            </div>
                        </div>
                    </ControlCard>

                    {/* ─── Card 3 — People in Queue ────────────────────────── */}
                    <ControlCard icon={<QueueIcon />} label="People in Queue" glow="#a855f7" delay={200}>
                        <div className="flex items-center gap-6">
                            <div>
                                <div className="text-6xl font-bold tabular-nums leading-none" style={{ color: queueColor }}>{form.queueCount}</div>
                                <div className="text-[10px] text-neutral-600 mt-1 font-medium">
                                    {form.queueCount === 0 ? 'No wait time' : form.queueCount <= 5 ? '~5 min wait' : '~15+ min wait'}
                                </div>
                            </div>
                            <div className="flex-1">
                                <Stepper value={form.queueCount} onChange={v => set('queueCount', v)} min={0} max={100} color="#a855f7" />
                            </div>
                        </div>
                        <QueueVisual count={form.queueCount} />
                        <div className="space-y-1.5 mt-2">
                            <input
                                type="range" min={0} max={100} step={1}
                                value={form.queueCount}
                                onChange={e => set('queueCount', Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer admin-range-slider"
                                style={{
                                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${form.queueCount}%, rgba(255,255,255,0.06) ${form.queueCount}%, rgba(255,255,255,0.06) 100%)`,
                                }}
                            />
                            <div className="flex justify-between text-[9px] text-neutral-700 font-medium">
                                <span>0 · Clear</span><span>100 · Heavy</span>
                            </div>
                        </div>
                    </ControlCard>

                    {/* ─── Card 4 — Station Status ─────────────────────────── */}
                    <ControlCard
                        icon={<StationIcon />}
                        label="Station Status"
                        glow={form.isActive ? '#22c55e' : '#ef4444'}
                        delay={300}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-3xl font-bold ${form.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                    {form.isActive ? 'Online' : 'Offline'}
                                </p>
                                <p className="text-xs text-neutral-600 mt-1">
                                    {form.isActive ? 'Station is live & accepting users' : 'Station is down · users cannot swap'}
                                </p>
                            </div>
                            <PremiumToggle active={form.isActive} onToggle={() => set('isActive', !form.isActive)} />
                        </div>

                        {/* Status indicator */}
                        <div className={`flex items-center gap-2.5 text-xs rounded-xl px-4 py-3 mt-1 backdrop-blur-sm ${form.isActive
                            ? 'bg-green-500/[0.08] text-green-400 border border-green-500/[0.15]'
                            : 'bg-red-500/[0.08] text-red-400 border border-red-500/[0.15]'
                            }`}>
                            <span className="relative flex h-2 w-2 shrink-0">
                                {form.isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
                                <span className={`relative inline-flex h-2 w-2 rounded-full ${form.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                            </span>
                            {form.isActive
                                ? 'Broadcasting live — visible to all users on dashboard'
                                : 'Offline — station hidden from user dashboard'}
                        </div>

                        {/* Sub-stats */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                                { label: 'Uptime', value: '99.7%', color: '#22c55e' },
                                { label: 'Temp', value: '32°C', color: '#3b82f6' },
                                { label: 'Signal', value: 'Strong', color: '#a855f7' },
                            ].map(s => (
                                <div key={s.label} className="bg-white/[0.03] rounded-lg px-3 py-2 text-center border border-white/[0.04]">
                                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider">{s.label}</div>
                                    <div className="text-xs font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </ControlCard>
                </div>

                {/* ── LIVE OCPP TERMINAL (NEW) ─────────────────────────────────── */}
                <div className="mb-6 rounded-3xl border border-white/[0.07] bg-[#0A0A0C] flex flex-col relative overflow-hidden admin-animate-slide-up shadow-[0_4px_40px_rgba(0,0,0,0.5)]" style={{ animationDelay: '400ms' }}>
                    <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${hardwareConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <div className="flex items-center gap-2">
                                <TerminalIcon size={16} />
                                <span className="text-xs font-bold text-neutral-300 tracking-widest uppercase">Live Hardware Simulator Logs (OCPP 1.6J)</span>
                            </div>
                        </div>
                        <div className="text-[10px] text-green-400 font-mono tracking-wider bg-green-500/10 px-2 py-1 rounded">wss://{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:{process.env.NEXT_PUBLIC_BACKEND_URL ? new URL(process.env.NEXT_PUBLIC_BACKEND_URL).port || '443' : '5005'}/ocpp/{selectedStationId}</div>
                    </div>
                    {/* Console body */}
                    <div className="p-5 h-[280px] overflow-y-auto font-mono text-[11.5px] flex flex-col gap-2 relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="text-neutral-500 mb-2">
                            {'>'} Waiting for edge hardware websocket connection...
                        </div>
                        {ocppLogs.map((log, i) => (
                            <div key={i} className="flex gap-4 border-b border-white/[0.02] pb-2 last:border-0 hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2">
                                <span className="text-neutral-600 shrink-0 select-none">
                                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                                </span>
                                <span className={`shrink-0 font-bold ${log.direction === 'IN' ? 'text-blue-400' : 'text-purple-400'}`}>
                                    [{log.direction}]
                                </span>
                                <span className={`shrink-0 ${log.action === 'Heartbeat' ? 'text-neutral-400' : log.action === 'MeterValues' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {log.action.padEnd(20)}
                                </span>
                                <span className="text-neutral-400 break-all opacity-80">
                                    {JSON.stringify(log.payload)}
                                </span>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* ── Publish button ──────────────────────────────────────────── */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full flex items-center justify-center gap-3 font-semibold text-base py-5 rounded-2xl transition-all duration-500 relative overflow-hidden ${pulse ? 'scale-[0.98]' : 'scale-100'
                        } ${saved
                            ? 'bg-green-500/[0.08] text-green-400 border border-green-500/20'
                            : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 hover:from-green-400 hover:via-emerald-400 hover:to-green-300 text-black shadow-[0_8px_32px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)]'
                        } ${saving ? 'opacity-80 cursor-wait' : ''}`}
                >
                    {/* Shimmer overlay on hover */}
                    {!saved && !saving && (
                        <div className="absolute inset-0 admin-animate-shimmer opacity-20"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                        {saved ? (
                            <>
                                <CheckCircle />
                                Published! Dashboard updated.
                            </>
                        ) : saving ? (
                            <>
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                                </svg>
                                Syncing with server...
                            </>
                        ) : (
                            <>
                                <UploadIcon />
                                Publish to Live Dashboard
                            </>
                        )}
                    </span>
                </button>

                <p className="text-center text-neutral-800 text-[11px] mt-6 tracking-wide">
                    Voltix Admin · Synced with backend API · Real-time updates
                </p>
            </div>
        </div>
    );
}
