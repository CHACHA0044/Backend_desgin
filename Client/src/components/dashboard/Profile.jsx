import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import CardNav from '../../common/CardNav';
import { authAPI } from '../../api/Api';

/* ══════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ══════════════════════════════════════════════════════════════════════ */
const CustomCursor = () => {
  const cursorRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const curr = useRef({ x: -100, y: -100 });
  const raf = useRef(null);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    if (!mq.matches) return;
    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const onOver = (e) => { if (e.target.closest('a, button, [role="button"], input')) cursorRef.current?.classList.add('hovering'); };
    const onOut = () => cursorRef.current?.classList.remove('hovering');
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    const LERP = 0.35;
    const tick = () => {
      curr.current.x += (pos.current.x - curr.current.x) * LERP;
      curr.current.y += (pos.current.y - curr.current.y) * LERP;
      if (cursorRef.current) {
        cursorRef.current.style.left = `${curr.current.x}px`;
        cursorRef.current.style.top = `${curr.current.y}px`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf.current);
    };
  }, []);
  return <div ref={cursorRef} className="custom-cursor" />;
};

/* ══════════════════════════════════════════════════════════════════════
   CARD NAV
   ══════════════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════════════
   STAT CARD
   ══════════════════════════════════════════════════════════════════════ */
const StatCard = ({ value, label, dark, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-6 px-4 text-center ${dark ? 'border-white/8 bg-white/[0.025]' : 'border-black/8 bg-black/[0.025]'}`}
  >
    <span className="stat-number text-3xl">{value}</span>
    <span className="mono-tag" style={{ opacity: dark ? 0.3 : 0.35 }}>{label}</span>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════
   INFO ROW
   ══════════════════════════════════════════════════════════════════════ */
const InfoRow = ({ label, value, dark, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`flex flex-col gap-1 border-b py-4 sm:flex-row sm:items-center sm:justify-between ${dark ? 'border-white/6' : 'border-black/6'}`}
  >
    <span className={`text-xs tracking-widest uppercase ${dark ? 'text-white/35' : 'text-black/35'}`} style={{ fontFamily: 'var(--font-mono)' }}>{label}</span>
    <span className={`text-sm font-medium ${dark ? 'text-white/85' : 'text-black/85'}`} style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════
   PROFILE PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const navigate = useNavigate();

  /* Theme */
  const [dark, setDark] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { const s = localStorage.getItem('sbs-theme'); if (s) setDark(s === 'dark'); }, []);
  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 520);
    setDark(d => { localStorage.setItem('sbs-theme', !d ? 'dark' : 'light'); return !d; });
  };

  /* User data */
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ orders: 0, dishes: 0 });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        /* Try localStorage first for instant render */
        const cached = localStorage.getItem('sbs-user');
        if (cached) setUser(JSON.parse(cached));

        /* Then fetch fresh from /me */
        const { user: fresh } = await authAPI.me();
        setUser(fresh);
        localStorage.setItem('sbs-user', JSON.stringify(fresh));

        /* Fetch order/dish counts */
        const role = localStorage.getItem('sbs-role') || 'user';
        if (role === 'admin') {
          const [dishRes, orderRes] = await Promise.all([
            fetch('/api/v1/tasks/dishes', { headers: { Authorization: `Bearer ${localStorage.getItem('sbs-token')}` } }).then(r => r.json()),
            fetch('/api/v1/tasks/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('sbs-token')}` } }).then(r => r.json()),
          ]);
          setStats({ dishes: dishRes.dishes?.length ?? 0, orders: orderRes.orders?.length ?? 0 });
        } else {
          const orderRes = await fetch('/api/v1/tasks/orders/me', { headers: { Authorization: `Bearer ${localStorage.getItem('sbs-token')}` } }).then(r => r.json());
          setStats({ orders: orderRes.orders?.length ?? 0, dishes: 0 });
        }
      } catch {
        /* Token expired or invalid — redirect to login */
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authAPI.logout();
    } catch { /* ignore */ } finally {
      localStorage.removeItem('sbs-token');
      localStorage.removeItem('sbs-role');
      localStorage.removeItem('sbs-user');
      navigate('/login');
    }
  };

  /* Derived */
  const bg = dark ? 'bg-black' : 'bg-white';
  const text = dark ? 'text-white' : 'text-black';
  const muted = dark ? 'text-white/40' : 'text-black/40';
  const role = localStorage.getItem('sbs-role') || 'user';

  /* Member since — createdAt comes from /me response */
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  /* Initials avatar */
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${bg} ${text}`}>
      <div className="grain-overlay" aria-hidden="true" />

      <CustomCursor />
      <CardNav dark={dark} ease="power3.out" onOpenChange={setNavOpen} onToggleTheme={toggleTheme} />

      <main className="relative mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        <div className={`pointer-events-none fixed inset-0 ${dark ? 'grid-bg-dark' : 'grid-bg'} opacity-40`} aria-hidden="true" />

        {/* Glow blobs */}
        <div className={`pointer-events-none absolute top-1/4 right-1/3 h-64 w-64 rounded-full blur-3xl ${dark ? 'bg-white/3' : 'bg-black/3'}`} />

        {loading ? (
          /* ── Skeleton ── */
          <div className="relative z-10 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-14 rounded-2xl animate-pulse ${dark ? 'bg-white/5' : 'bg-black/5'}`} />
            ))}
          </div>
        ) : (
          <div className="relative z-10">

            {/* ── Page header ── */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-12">
              <span className="mono-tag">── Account</span>
              <h1 className="mt-1 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
                Your<br />
                <em className={`not-italic ${dark ? 'text-white/30' : 'text-black/30'}`}>profile.</em>
              </h1>
            </motion.div>

            {/* ── Avatar + name card ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`mb-8 flex items-center gap-5 rounded-2xl border p-6 ${dark ? 'border-white/8 bg-white/[0.025]' : 'border-black/8 bg-black/[0.025]'}`}
            >
              {/* Initials circle */}
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-xl font-bold ${dark ? 'border-white/15 bg-white/8 text-white' : 'border-black/15 bg-black/8 text-black'}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {initials}
              </div>

              <div className="min-w-0">
                <p className={`truncate text-xl font-extrabold ${dark ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'var(--font-display)' }}>{user?.name || '—'}</p>
                <p className={`truncate text-sm ${muted}`} style={{ fontFamily: 'var(--font-mono)' }}>{user?.email || '—'}</p>
              </div>

              {/* Role badge */}
              <div className="ml-auto shrink-0">
                <span
                  className={`rounded-xl border px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase ${role === 'admin'
                    ? (dark ? 'border-white/30 bg-white/10 text-white' : 'border-black/30 bg-black/10 text-black')
                    : (dark ? 'border-white/10 bg-white/[0.04] text-white/50' : 'border-black/10 bg-black/[0.04] text-black/50')
                    }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {role}
                </span>
              </div>
            </motion.div>

            {/* ── Stats ── */}
            <div className={`mb-8 grid gap-3 ${role === 'admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <StatCard value={stats.orders} label={role === 'admin' ? 'Total Orders' : 'Orders Placed'} dark={dark} delay={0.14} />
              {role === 'admin' && (
                <StatCard value={stats.dishes} label="Dishes Created" dark={dark} delay={0.20} />
              )}
            </div>

            {/* ── Info rows ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`mb-10 rounded-2xl border ${dark ? 'border-white/8' : 'border-black/8'} overflow-hidden`}
            >
              <div className={`px-5 py-3 ${dark ? 'border-b border-white/6 bg-white/[0.02]' : 'border-b border-black/6 bg-black/[0.02]'}`}>
                <span className="mono-tag">── Details</span>
              </div>
              <div className="px-5">
                <InfoRow label="Full Name" value={user?.name || '—'} dark={dark} delay={0.26} />
                <InfoRow label="Email" value={user?.email || '—'} dark={dark} delay={0.30} />
                <InfoRow label="Role" value={role} dark={dark} delay={0.34} />
                <InfoRow label="Member Since" value={memberSince} dark={dark} delay={0.38} />
                <InfoRow label="User ID" value={user?.id ? `…${String(user.id).slice(-8)}` : '—'} dark={dark} delay={0.42} />
              </div>
            </motion.div>

            {/* ── Actions ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              {/* Dashboard link */}
              <Link
                to="/dashboard"
                className={`group relative flex-1 overflow-hidden rounded-xl border px-5 py-3.5 text-center text-xs font-bold tracking-widest uppercase transition-all duration-300 ${dark ? 'border-white/20 text-white' : 'border-black/20 text-black'}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${dark ? 'bg-white' : 'bg-black'}`} />
                <span className={`relative z-10 transition-colors duration-300 ${dark ? 'group-hover:text-black' : 'group-hover:text-white'}`}>
                  → Dashboard
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={`flex-1 rounded-xl border px-5 py-3.5 text-xs font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-50 ${dark ? 'border-red-400/30 text-red-400/70 hover:bg-red-400/8 hover:text-red-400' : 'border-red-500/30 text-red-500/70 hover:bg-red-500/8 hover:text-red-500'}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {loggingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </motion.div>

          </div>
        )}
      </main>

      <footer className={`border-t px-6 py-6 ${dark ? 'border-white/8' : 'border-black/8'}`}>
        <div className="mx-auto flex max-w-2xl justify-center">
          <span className="mono-tag" style={{ opacity: dark ? 0.2 : 0.25 }}>SBS — Scalable Backend System © 2025</span>
        </div>
      </footer>
    </div>
  );
}