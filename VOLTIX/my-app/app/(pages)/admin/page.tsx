'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS — inline SVGs
   ═══════════════════════════════════════════════════════════════════════════ */
const ZapIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const LockIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const MailIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);
const EyeIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const EyeOffIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);
const ShieldIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const AlertIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING PARTICLES — ambient background
   ═══════════════════════════════════════════════════════════════════════════ */
const FloatingParticles = () => {
    const particles = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 8,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-green-400/20"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        animation: `admin-float ${p.duration}s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminLoginPage() {
    const router = useRouter();
    const emailRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(true);

    // ── Check if already logged in ──────────────────────────────────────
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('voltix_admin_token');
            if (token) {
                try {
                    const res = await fetch('/api/admin-auth/verify', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    if (data.success) {
                        router.replace('/admin/panel');
                        return;
                    }
                } catch {
                    // Token invalid, continue to login
                }
                localStorage.removeItem('voltix_admin_token');
            }
            setChecking(false);
        };
        checkAuth();
    }, [router]);

    // ── Auto-focus email on load ────────────────────────────────────────
    useEffect(() => {
        if (!checking && emailRef.current) {
            emailRef.current.focus();
        }
    }, [checking]);

    // ── Handle login submission ─────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/admin-auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('voltix_admin_token', data.token);
                localStorage.setItem('voltix_admin_info', JSON.stringify(data.admin));

                // Small delay for visual feedback
                await new Promise(r => setTimeout(r, 500));
                router.replace('/admin/panel');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch {
            setError('Unable to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Checking auth state ─────────────────────────────────────────────
    if (checking) {
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
                        <span className="text-neutral-500 text-sm">Checking credentials...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center relative overflow-hidden">

            {/* ── Ambient glows ───────────────────────────────────────── */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-green-500/[0.05] blur-[150px] admin-animate-float" />
                <div className="absolute bottom-[-30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px] admin-animate-float" style={{ animationDelay: '3s' }} />
                <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] rounded-full bg-blue-500/[0.03] blur-[100px] admin-animate-float" style={{ animationDelay: '5s' }} />
            </div>

            <FloatingParticles />

            {/* ── Login card ──────────────────────────────────────────── */}
            <div className="w-full max-w-md mx-4 admin-animate-slide-up" style={{ opacity: 0 }}>

                {/* Brand header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-black mb-5 shadow-2xl shadow-green-500/30 mx-auto">
                        <ZapIcon size={28} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Voltix Admin</h1>
                    <p className="text-neutral-500 text-sm mt-1.5">Station Control Center · Secure Access</p>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden">

                    {/* Subtle top glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-green-500/10 blur-xl" />

                    {/* Security badge */}
                    <div className="flex items-center gap-2 justify-center mb-6">
                        <div className="flex items-center gap-1.5 text-green-400/70 bg-green-500/[0.08] border border-green-500/[0.15] rounded-full px-3 py-1.5">
                            <ShieldIcon size={13} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Encrypted Session</span>
                        </div>
                    </div>

                    {/* Error alert */}
                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-500/[0.08] border border-red-500/[0.2] rounded-xl px-4 py-3 mb-5 admin-animate-slide-up" style={{ opacity: 0 }}>
                            <span className="text-red-400 shrink-0"><AlertIcon /></span>
                            <span className="text-red-300 text-sm">{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Email field */}
                        <div className="space-y-2">
                            <label htmlFor="admin-email" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                Admin Email
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-green-400 transition-colors">
                                    <MailIcon size={16} />
                                </div>
                                <input
                                    ref={emailRef}
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@voltix.com"
                                    autoComplete="email"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-700 outline-none focus:border-green-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-green-500/20 transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label htmlFor="admin-password" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-green-400 transition-colors">
                                    <LockIcon size={16} />
                                </div>
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    autoComplete="current-password"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-neutral-700 outline-none focus:border-green-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-green-500/20 transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2.5 font-semibold text-sm py-4 rounded-xl transition-all duration-500 relative overflow-hidden ${loading
                                ? 'bg-green-500/20 text-green-400 cursor-wait'
                                : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 hover:from-green-400 hover:via-emerald-400 hover:to-green-300 text-black shadow-[0_8px_32px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] active:scale-[0.98]'
                                }`}
                        >
                            {/* Shimmer effect */}
                            {!loading && (
                                <div
                                    className="absolute inset-0 admin-animate-shimmer opacity-20"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2.5">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                                        </svg>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <LockIcon size={15} />
                                        Sign In to Admin Panel
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer hint */}
                    <div className="mt-6 pt-5 border-t border-white/[0.06]">
                        <p className="text-center text-neutral-700 text-[11px] leading-relaxed">
                            Access restricted to authorized station operators only.
                            <br />
                            <span className="text-neutral-600">Contact system admin if you need access.</span>
                        </p>
                    </div>
                </div>

                {/* Bottom branding */}
                <p className="text-center text-neutral-800 text-[11px] mt-6 tracking-wide">
                    Voltix Admin · Encrypted · Secure Access
                </p>
            </div>
        </div>
    );
}
