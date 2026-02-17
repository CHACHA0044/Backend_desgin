import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import CardNav from '../common/CardNav';
/* ════════════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   Fix 1: mix-blend-mode:difference makes it always visible (white dot inverts
          to black on white bg, stays white on dark bg) — no theme dependency.
   Fix 2: lerp factor 0.35 (was 0.11) = much faster / responsive tracking.
   Fix 3: @media(pointer:fine) guard — hidden on touch/mobile automatically.
   ════════════════════════════════════════════════════════════════════════════ */
const CustomCursor = () => {
  const cursorRef = useRef(null);
  const pos   = useRef({ x: -100, y: -100 });
  const curr  = useRef({ x: -100, y: -100 });
  const raf   = useRef(null);

  useEffect(() => {
    // Only attach on pointer:fine (mouse) devices
    const mq = window.matchMedia('(pointer: fine)');
    if (!mq.matches) return;

    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const onOver = (e) => {
      if (e.target.closest('a, button, [role="button"]'))
        cursorRef.current?.classList.add('hovering');
    };
    const onOut = () => cursorRef.current?.classList.remove('hovering');

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover',  onOver);
    document.addEventListener('mouseout',   onOut);

    // lerp = 0.35 → fast & snappy, no perceived lag
    const LERP = 0.35;
    const tick = () => {
      curr.current.x += (pos.current.x - curr.current.x) * LERP;
      curr.current.y += (pos.current.y - curr.current.y) * LERP;
      if (cursorRef.current) {
        cursorRef.current.style.left = `${curr.current.x}px`;
        cursorRef.current.style.top  = `${curr.current.y}px`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover',  onOver);
      document.removeEventListener('mouseout',   onOut);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // mix-blend-mode:difference = single white dot, always visible on any bg
  return <div ref={cursorRef} className="custom-cursor" />;
};

/* ════════════════════════════════════════════════════════════════════════════
   CARD NAV
   Fix 4a: backdrop overlay (nav-backdrop) with blur + click-outside to close.
   Fix 4b: close on link click, close on backdrop click.
   ════════════════════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════════════════════
   NAV ITEMS
   ════════════════════════════════════════════════════════════════════════════ */
const getNavItems = (dark) => [
  {
    label: 'Navigate',
    bgColor: dark ? '#0e0e0e' : '#f2f2f2',
    textColor: dark ? '#fff' : '#000',
    links: [
      { label: 'Home',  to: '/',      ariaLabel: 'Home' },
      { label: 'About', to: '/about', ariaLabel: 'About' },
    ],
  },
  {
    label: 'Account',
    bgColor: dark ? '#141414' : '#eaeaea',
    textColor: dark ? '#fff' : '#000',
    links: [
      { label: 'Login',    to: '/login',    ariaLabel: 'Login' },
      { label: 'Register', to: '/register', ariaLabel: 'Register' },
    ],
  },
  {
    label: 'Dashboard',
    bgColor: dark ? '#1a1a1a' : '#e2e2e2',
    textColor: dark ? '#fff' : '#000',
    links: [
      { label: 'Tasks',   to: '/tasks', ariaLabel: 'Tasks' },
      { label: 'Profile', to: '/profile',   ariaLabel: 'Profile' },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ════════════════════════════════════════════════════════════════════════════ */
const Counter = ({ to, suffix = '' }) => {
  const [val, setVal]       = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.6 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame;
    const dur = 1400, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, to]);

  return <span ref={ref} className="stat-number">{val}{suffix}</span>;
};

/* ════════════════════════════════════════════════════════════════════════════
   TICKER
   ════════════════════════════════════════════════════════════════════════════ */
const WORDS = ['SCALABLE', 'SECURE', 'ROLE-BASED', 'JWT', 'REST API', 'FULL STACK', 'MODULAR', 'VERSIONED', 'VALIDATED'];
const Ticker = ({ dark }) => (
  <div className={`overflow-hidden border-y py-2.5 ${dark ? 'border-white/8' : 'border-black/8'}`}>
    <div
      className={`ticker-track flex shrink-0 gap-10 whitespace-nowrap ${dark ? 'text-white/20' : 'text-black/20'}`}
      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase' }}
    >
      {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((w, i) => (
        <span key={i} className="shrink-0">{w} ·</span>
      ))}
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   FEATURE CARD
   ════════════════════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: '🔐', title: 'JWT Auth',      desc: 'Token-based auth with refresh logic and role-based access for user and admin roles.' },
  { icon: '⚡', title: 'REST API',      desc: 'Versioned endpoints with proper status codes, validation middleware, and clean error handling.' },
  { icon: '🛡️', title: 'Sanitization', desc: 'Every request validated at middleware level. SQL injection and XSS mitigated by default.' },
  { icon: '🗄️', title: 'DB Schema',    desc: 'Clean relational schema with migrations. Postgres-ready, swappable for MongoDB.' },
  { icon: '📦', title: 'Modular',       desc: 'Scalable folder architecture — new modules plug in without touching existing code.' },
  { icon: '📡', title: 'Swagger Docs', desc: 'Auto-generated API docs at /api-docs. Test every endpoint without leaving your browser.' },
];

const FeatureCard = ({ icon, title, desc, delay, dark }) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`feature-card group relative overflow-hidden rounded-2xl border p-6 ${
      dark
        ? 'border-white/8 bg-white/[0.03] hover:border-white/15'
        : 'border-black/8 bg-black/[0.03] hover:border-black/15'
    }`}
  >
    <div className="mb-4 text-2xl leading-none">{icon}</div>
    <h3 className={`mb-2 text-sm font-semibold tracking-wide ${dark ? 'text-white' : 'text-black'}`}
        style={{ fontFamily: 'var(--font-mono)' }}>
      {title}
    </h3>
    <p className={`text-sm leading-relaxed ${dark ? 'text-white/45' : 'text-black/45'}`}>{desc}</p>
    <div className={`pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${dark ? 'bg-white/15' : 'bg-black/10'}`} />
  </motion.div>
);

/* ════════════════════════════════════════════════════════════════════════════
   HOME
   ════════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [dark,    setDark]    = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  /* ── Fix 3: smooth theme transition via class on <html> ──────────────── */
  useEffect(() => {
    const saved = localStorage.getItem('sbs-theme');
    if (saved) setDark(saved === 'dark');
  }, []);

  const toggleTheme = () => {
    // Add class → triggers CSS transitions on every element
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 520);
    setDark((d) => {
      localStorage.setItem('sbs-theme', !d ? 'dark' : 'light');
      return !d;
    });
  };

  /* ── Parallax hero ───────────────────────────────────────────────────── */
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1],    ['0%', '22%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const bg     = dark ? 'bg-black'      : 'bg-white';
  const text   = dark ? 'text-white'    : 'text-black';
  const border = dark ? 'border-white/8': 'border-black/8';
  const muted  = dark ? 'text-white/40' : 'text-black/40';

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${bg} ${text}`}>
      {/* Grain */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ── Backdrop blur overlay — click outside to close nav ─────────── */}
      <div
        className={`nav-backdrop ${navOpen ? 'active' : ''} ${navOpen && !dark ? 'light' : ''}`}
        onClick={() => window.__sbsCloseNav?.()}
        aria-hidden="true"
      />

      {/* Custom cursor — always white; mix-blend-mode handles visibility */}
      <CustomCursor />

      

      {/* ── Card Nav ────────────────────────────────────────────────────── */}
      <CardNav
        logoText="SBS"
        items={getNavItems(dark)}
        dark={dark}
        ease="power3.out"
        onOpenChange={setNavOpen}
        onToggleTheme={toggleTheme}
      />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        <div className={`pointer-events-none absolute inset-0 ${dark ? 'grid-bg-dark' : 'grid-bg'}`} aria-hidden="true" />
        <div className={`pointer-events-none absolute -top-32 left-1/3 h-80 w-80 rounded-full blur-3xl ${dark ? 'bg-white/4' : 'bg-black/4'}`} />
        <div className={`pointer-events-none absolute bottom-10 right-1/4 h-64 w-64 rounded-full blur-3xl ${dark ? 'bg-white/3' : 'bg-black/3'}`} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`badge mb-8 ${dark ? 'border-white/12 bg-white/5 text-white/40' : 'border-black/12 bg-black/5 text-black/40'}`}
          >
            <span className={`glow-dot ${dark ? 'bg-white/50' : 'bg-black/50'}`} />
            Secure Backend Infrastructure
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 max-w-3xl text-5xl font-extrabold leading-[1.06] tracking-tight sm:text-6xl md:text-[72px]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Scalable Backend
            <br />
            <em className={`not-italic ${dark ? 'text-white/30' : 'text-black/30'}`}>System</em>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-10 max-w-sm text-base leading-relaxed ${muted}`}
          >
           Backend infrastructure made simple — secure auth, role control, and scalable APIs out of the box.
          </motion.p>

          {/* CTAs */}
        <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-3 sm:flex-row"
        >

        {/* Reusable Button Style */}
        {[
            { to: "/register", label: "Register" },
            { to: "/login", label: "Sign In" },
            { to: "/about", label: "About" },
        ].map((btn, i) => (
            <Link
            key={i}
            to={btn.to}
            className={`
                group relative overflow-hidden
                w-44 text-center
                rounded-xl border
                px-7 py-3
                text-sm font-semibold tracking-widest uppercase
                transition-all duration-300
                ${dark
                ? "border-white/20 text-white"
                : "border-black/20 text-black"}
            `}
            style={{ fontFamily: "var(--font-mono)" }}
            >
            {/* Animated Background */}
            <span
                className={`
                absolute inset-0 scale-x-0 origin-left
                transition-transform duration-300
                group-hover:scale-x-100
                ${dark ? "bg-white" : "bg-black"}
                `}
            />

            {/* Text */}
            <span
                className={`
                relative z-10 transition-colors duration-300
                ${dark
                    ? "group-hover:text-black"
                    : "group-hover:text-white"}
                `}
            >
                {btn.label}
            </span>
            </Link>

        ))}

        </motion.div>

        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 ${muted}`}
        >
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-base"
          >↓</motion.span>
          <span className="mono-tag" style={{ opacity: 0.6 }}>scroll</span>
        </motion.div>
      </section>

      {/* ── Ticker ──────────────────────────────────────────────────────── */}
      <Ticker dark={dark} />

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-20">
        <div className={`pointer-events-none absolute inset-0 ${dark ? 'grid-bg-dark' : 'grid-bg'} opacity-40`} aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { value: 99,  suffix: '%', label: 'Uptime' },
            { value: 12,  suffix: '+', label: 'Endpoints' },
            { value: 3,   suffix: '',  label: 'Auth Roles' },
            { value: 256, suffix: 'b', label: 'AES Encrypt' },
          ].map(({ value, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border py-6 px-4 text-center ${dark ? 'border-white/8 bg-white/[0.025]' : 'border-black/8 bg-black/[0.025]'}`}
            >
              <span className="text-3xl"><Counter to={value} suffix={suffix} /></span>
              <span className="mono-tag" style={{ opacity: dark ? 0.3 : 0.35 }}>{label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mb-10 flex flex-col gap-2"
          >
            <span className="mono-tag">── Core Features</span>
            <h2
              className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Everything included,
              <br />
              <em className={`not-italic ${dark ? 'text-white/30' : 'text-black/30'}`}>nothing wasted.</em>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.07} dark={dark} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ───────────────────────────────────────────────────── */}
      <section className={`border-t ${border}`}>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-3xl font-extrabold tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to explore?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className={`max-w-xs text-sm leading-relaxed ${muted}`}
          >
            Register, log in, and manage resources through the protected dashboard.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Link
              to="/register"
              className={`btn-primary rounded-xl px-8 py-3 text-sm font-bold tracking-widest uppercase ${dark ? 'bg-white text-black' : 'bg-black text-white'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Register
            </Link>
            <Link
              to="/login"
              className={`rounded-xl border px-8 py-3 text-sm tracking-widest uppercase transition-opacity hover:opacity-60 ${dark ? 'border-white/15 text-white/55' : 'border-black/15 text-black/55'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Login
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className={`border-t px-6 py-8 ${border}`}>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 md:flex-row md:justify-between">
          <span className="mono-tag" style={{ opacity: dark ? 0.25 : 0.3 }}>SBS — Scalable Backend System © 2025</span>
          <div className="flex gap-6">
            {[{ label: 'About', to: '/about' }, { label: 'Login', to: '/login' }, { label: 'Register', to: '/register' }].map((l) => (
              <Link key={l.to} to={l.to} className="link-draw mono-tag transition-opacity hover:opacity-60" style={{ opacity: dark ? 0.3 : 0.35 }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}



