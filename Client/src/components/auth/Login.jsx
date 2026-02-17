import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { authAPI } from '../../api/Api';

/* ══════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR — identical to Home.jsx
   ══════════════════════════════════════════════════════════════════════ */
const CustomCursor = () => {
  const cursorRef = useRef(null);
  const pos  = useRef({ x: -100, y: -100 });
  const curr = useRef({ x: -100, y: -100 });
  const raf  = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    if (!mq.matches) return;

    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const onOver = (e) => {
      if (e.target.closest('a, button, [role="button"], input'))
        cursorRef.current?.classList.add('hovering');
    };
    const onOut = () => cursorRef.current?.classList.remove('hovering');

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

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
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
};

/* ══════════════════════════════════════════════════════════════════════
   CARD NAV — identical to Home.jsx
   ══════════════════════════════════════════════════════════════════════ */
const CardNav = ({ logoText = 'SBS', items, ease = 'power3.out', dark = true, onOpenChange, onToggleTheme }) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded,      setIsExpanded]      = useState(false);
  const [scrolled,        setScrolled]        = useState(false);
  const navRef   = useRef(null);
  const cardsRef = useRef([]);
  const tlRef    = useRef(null);

  useEffect(() => { onOpenChange?.(isExpanded); }, [isExpanded, onOpenChange]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const calculateHeight = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const el = navEl.querySelector('.card-nav-content');
      if (el) {
        const prev = { visibility: el.style.visibility, pointerEvents: el.style.pointerEvents, position: el.style.position, height: el.style.height };
        Object.assign(el.style, { visibility: 'visible', pointerEvents: 'auto', position: 'static', height: 'auto' });
        el.offsetHeight;
        const result = 56 + el.scrollHeight + 16;
        Object.assign(el.style, prev);
        return result;
      }
    }
    return 250;
  }, []);

  const createTimeline = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 56, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 40, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.35, ease, stagger: 0.07 }, '-=0.15');
    return tl;
  }, [ease, calculateHeight]);

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); tlRef.current = null; };
  }, [createTimeline]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      tlRef.current.kill();
      const newTl = createTimeline();
      if (newTl) {
        if (isExpanded) newTl.progress(1);
        tlRef.current = newTl;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded, createTimeline]);

  const closeNav = useCallback(() => {
    const tl = tlRef.current;
    if (!tl || !isExpanded) return;
    setIsHamburgerOpen(false);
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
    tl.reverse();
  }, [isExpanded]);

  useEffect(() => {
    window.__sbsCloseNav = closeNav;
    return () => { window.__sbsCloseNav = null; };
  }, [closeNav]);

  const openNav = () => {
    const tl = tlRef.current;
    if (!tl || isExpanded) return;
    setIsHamburgerOpen(true);
    setIsExpanded(true);
    tl.play(0);
  };

  const toggleMenu = () => isExpanded ? closeNav() : openNav();
  const setCardRef = (i) => (el) => { if (el) cardsRef.current[i] = el; };

  const themeClass = dark ? 'card-nav-dark' : 'card-nav-light';
  const textColor  = dark ? '#fff' : '#000';

  return (
    <div className="card-nav-container">
      <nav ref={navRef} className={`card-nav ${themeClass} ${isExpanded ? 'open' : ''} ${scrolled ? 'scrolled' : ''}`}>
        <div className="card-nav-top">
          {/* Theme toggle — LEFT */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTheme(); }}
            aria-label="Toggle theme"
            style={{ color: textColor }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-opacity hover:opacity-60"
          >
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
              {dark ? '○' : '●'}
            </span>
          </button>

          {/* Logo — CENTER */}
          <div className="logo-container">
            <Link to="/" className="card-nav-logo-text" style={{ color: textColor }} tabIndex={-1} onClick={closeNav}>
              {logoText}
            </Link>
          </div>

          {/* Hamburger — RIGHT */}
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleMenu()}
            style={{ color: textColor }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="nav-card" ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}>
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <Link key={`${lnk.label}-${i}`} className="nav-card-link" to={lnk.to || '#'}
                    aria-label={lnk.ariaLabel} style={{ color: item.textColor }} onClick={closeNav}>
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   NAV ITEMS
   ══════════════════════════════════════════════════════════════════════ */
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
      { label: 'Tasks',   to: '/dashboard', ariaLabel: 'Dashboard' },
      { label: 'Profile', to: '/profile',   ariaLabel: 'Profile' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════
   VALIDATION
   ══════════════════════════════════════════════════════════════════════ */
const validate = ({ email, password }) => {
  const errs = {};
  if (!email.trim())
    errs.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errs.email = 'Enter a valid email address.';

  if (!password)
    errs.password = 'Password is required.';
  else if (password.length < 6)
    errs.password = 'Password must be at least 6 characters.';

  return errs;
};

/* ══════════════════════════════════════════════════════════════════════
   INPUT FIELD
   ══════════════════════════════════════════════════════════════════════ */
const Field = ({ id, label, type = 'text', value, onChange, onBlur, error, dark, placeholder, rightSlot }) => {
  const borderColor = error
    ? (dark ? 'border-red-400/60'  : 'border-red-500/70')
    : (dark ? 'border-white/12'    : 'border-black/12');
  const focusRing = error
    ? 'focus-within:border-red-400/80'
    : (dark ? 'focus-within:border-white/35' : 'focus-within:border-black/35');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1.5"
    >
      <label
        htmlFor={id}
        className={`text-xs tracking-widest uppercase ${dark ? 'text-white/40' : 'text-black/40'}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </label>

      <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${borderColor} ${focusRing} bg-transparent`}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={id}
          className={`w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:opacity-30
            ${dark ? 'text-white' : 'text-black'}`}
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
        />
        {rightSlot && <div className="pr-3">{rightSlot}</div>}
      </div>

      {/* Inline error message */}
      <motion.div
        initial={false}
        animate={error ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="min-h-[16px]"
      >
        {error && (
          <span
            className="text-xs text-red-400"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
          >
            {error}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate();

  /* Theme — synced with Home via localStorage */
  const [dark,    setDark]    = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sbs-theme');
    if (saved) setDark(saved === 'dark');
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 520);
    setDark((d) => {
      localStorage.setItem('sbs-theme', !d ? 'dark' : 'light');
      return !d;
    });
  };

  /* Form state */
  const [fields,  setFields]  = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [showPw,  setShowPw]  = useState(false);
  const [status,  setStatus]  = useState('idle'); // idle | loading | success | error
  const [apiMsg,  setApiMsg]  = useState('');

  /* Validate on every keystroke for touched fields */
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;
    const errs = validate(fields);
    const relevantErrs = {};
    Object.keys(touched).forEach((k) => { if (errs[k]) relevantErrs[k] = errs[k]; });
    setErrors(relevantErrs);
  }, [fields, touched]);

  const handleChange = (field) => (e) =>
    setFields((f) => ({ ...f, [field]: e.target.value }));

  const handleBlur = (field) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

const handleSubmit = async (e) => {
  e.preventDefault();
  setTouched({ email: true, password: true });
  const errs = validate(fields);
  if (Object.keys(errs).length > 0) { setErrors(errs); return; }

  setStatus('loading');
  setApiMsg('');

  try {
    const data = await authAPI.login({
      email:    fields.email,
      password: fields.password,
    });
    localStorage.setItem('sbs-token', data.token);
    localStorage.setItem('sbs-role',  data.user.role);
    localStorage.setItem('sbs-user',  JSON.stringify(data.user));
    setStatus('success');
    setTimeout(() => navigate('/dashboard'), 600);
  } catch (err) {
    setStatus('error');
    setApiMsg(err.message || 'Invalid credentials. Please try again.');
  }
};

  /* Derived */
  const bg    = dark ? 'bg-black'      : 'bg-white';
  const text  = dark ? 'text-white'    : 'text-black';
  const muted = dark ? 'text-white/40' : 'text-black/40';

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${bg} ${text}`}>
      {/* Grain */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Backdrop */}
      <div
        className={`nav-backdrop ${navOpen ? 'active' : ''} ${navOpen && !dark ? 'light' : ''}`}
        onClick={() => window.__sbsCloseNav?.()}
        aria-hidden="true"
      />

      <CustomCursor />

      {/* Nav */}
      <CardNav
        logoText="SBS"
        items={getNavItems(dark)}
        dark={dark}
        ease="power3.out"
        onOpenChange={setNavOpen}
        onToggleTheme={toggleTheme}
      />

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-16">
        {/* Animated grid bg */}
        <div className={`pointer-events-none fixed inset-0 ${dark ? 'grid-bg-dark' : 'grid-bg'}`} aria-hidden="true" />

        {/* Glow blobs */}
        <div className={`pointer-events-none absolute top-1/3 left-1/4 h-72 w-72 rounded-full blur-3xl ${dark ? 'bg-white/3' : 'bg-black/3'}`} />
        <div className={`pointer-events-none absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full blur-3xl ${dark ? 'bg-white/2' : 'bg-black/2'}`} />

        <div className="relative z-10 w-full max-w-sm">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 flex flex-col gap-2"
          >
            <span className={`mono-tag`}>── Sign In</span>
            <h1
              className="text-4xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Welcome<br />
              <em className={`not-italic ${dark ? 'text-white/30' : 'text-black/30'}`}>back.</em>
            </h1>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Field
                id="email"
                label="Email"
                type="email"
                value={fields.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email}
                dark={dark}
                placeholder="you@example.com"
              />
            </motion.div>

            {/* Password */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative" // Added relative to anchor the button
            >
            <Field
                id="password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={fields.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                dark={dark}
                placeholder="Password"
            />
            
            <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className={`absolute right-4 top-[38px] z-20 text-[10px] font-bold transition-opacity hover:opacity-100 ${muted}`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
            >
                {showPw ? 'HIDE' : 'SHOW'}
            </button>
            </motion.div>

            {/* Forgot password 
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex justify-end -mt-1"
            >
              <Link
                to="/forgot-password"
                className={`link-draw text-xs tracking-widest uppercase transition-opacity hover:opacity-60 ${muted}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Forgot password?
              </Link>
            </motion.div>*/}

            {/* API error / success banner */}
            {(apiMsg || status === 'success') && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border px-4 py-3 text-xs mt-1 ${
                  status === 'success'
                    ? (dark ? 'border-white/20 bg-white/5 text-white/70' : 'border-black/20 bg-black/5 text-black/70')
                    : (dark ? 'border-red-400/30 bg-red-400/5 text-red-400' : 'border-red-500/30 bg-red-500/5 text-red-600')
                }`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
              >
                {status === 'success' ? '✓ Signed in — redirecting…' : `✕ ${apiMsg}`}
              </motion.div>
            )}

            {/* Submit button — same fill-animation style as Home */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4"
            >
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={`
                  group relative w-full overflow-hidden
                  rounded-xl border
                  px-7 py-3.5
                  text-sm font-semibold tracking-widest uppercase
                  transition-all duration-300
                  disabled:opacity-50 disabled:pointer-events-none
                  ${dark ? 'border-white/20 text-white' : 'border-black/20 text-black'}
                `}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {/* Fill sweep */}
                <span
                  className={`
                    absolute inset-0 origin-left scale-x-0
                    transition-transform duration-300
                    group-hover:scale-x-100
                    ${dark ? 'bg-white' : 'bg-black'}
                  `}
                />
                {/* Label */}
                <span className={`relative z-10 transition-colors duration-300 ${dark ? 'group-hover:text-black' : 'group-hover:text-white'}`}>
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingDots dark={dark} />
                    </span>
                  ) : status === 'success' ? '✓ Signed In' : 'Sign In'}
                </span>
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="my-8 divider"
          />

          {/* Register link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className={`text-center text-xs ${muted}`}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              className={`link-draw transition-opacity hover:opacity-80 ${dark ? 'text-white/70' : 'text-black/70'}`}
            >
              Register
            </Link>
          </motion.p>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t px-6 py-6 ${dark ? 'border-white/8' : 'border-black/8'}`}>
        <div className="mx-auto flex max-w-sm justify-center">
          <span className="mono-tag" style={{ opacity: dark ? 0.2 : 0.25 }}>
            SBS — Scalable Backend System © 2025
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── Loading dots ──────────────────────────────────────────────────── */
const LoadingDots = ({ dark }) => (
  <>
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className={`inline-block h-1.5 w-1.5 rounded-full ${dark ? 'bg-white group-hover:bg-black' : 'bg-black group-hover:bg-white'}`}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </>
);