import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { authAPI } from '../api/Api';

/* ══════════════════════════════════════════════════════════════════════
   getNavItems — Centralized navigation configuration
   ══════════════════════════════════════════════════════════════════════ */
export const getNavItems = (dark) => {
  const isLoggedIn = !!localStorage.getItem('sbs-token');
  return [
    {
      label: 'Navigate',
      bgColor: dark ? '#0e0e0e' : '#f2f2f2',
      textColor: dark ? '#fff' : '#000',
      links: [
        { label: 'Home', to: '/', ariaLabel: 'Home' },
        { label: 'About', to: '/about', ariaLabel: 'About' },
      ],
    },
    {
      label: 'Account',
      bgColor: dark ? '#141414' : '#eaeaea',
      textColor: dark ? '#fff' : '#000',
      links: isLoggedIn
        ? [
          { label: 'Profile', to: '/profile', ariaLabel: 'Profile' },
          { label: 'Sign Out', action: 'logout', ariaLabel: 'Sign Out' },
        ]
        : [
          { label: 'Login', to: '/login', ariaLabel: 'Login' },
          { label: 'Register', to: '/register', ariaLabel: 'Register' },
        ],
    },
    {
      label: 'Dashboard',
      bgColor: dark ? '#1a1a1a' : '#e2e2e2',
      textColor: dark ? '#fff' : '#000',
      links: [
        { label: 'Tasks', to: '/dashboard', ariaLabel: 'Dashboard', protected: true },
        { label: 'Profile', to: '/profile', ariaLabel: 'Profile', protected: true },
      ],
    },
  ];
};

/* ══════════════════════════════════════════════════════════════════════
   CardNav component
   ══════════════════════════════════════════════════════════════════════ */
const CardNav = ({
  logoText = 'SBS',
  items, // Optional prop to override default items
  ease = 'power3.out',
  dark = true,
  onOpenChange, // Optional callback if parent needs to know state
  onToggleTheme,
}) => {
  /* ── State ── */
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize navItems in state so it can update when auth changes
  const [navItems, setNavItems] = useState(() => getNavItems(dark));

  // Update nav items whenever dark mode changes or when menu opens (to check fresh auth)
  useEffect(() => {
    setNavItems(getNavItems(dark));
  }, [dark, isExpanded]);

  // Listen for custom "auth-change" event if you have one, or just rely on isExpanded re-check
  useEffect(() => {
    const handleStorage = () => setNavItems(getNavItems(dark));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dark]);

  useEffect(() => { onOpenChange?.(isExpanded); }, [isExpanded, onOpenChange]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Animation Logic ── */
  const calculateHeight = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const el = navEl.querySelector('.card-nav-content');
      if (el) {
        const prev = {
          visibility: el.style.visibility,
          pointerEvents: el.style.pointerEvents,
          position: el.style.position,
          height: el.style.height,
        };
        Object.assign(el.style, { visibility: 'visible', pointerEvents: 'auto', position: 'static', height: 'auto' });
        el.offsetHeight; // Force reflow
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

  // Expose closeNav to window for any external triggers (legacy support)
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

  const toggleMenu = () => (isExpanded ? closeNav() : openNav());
  const setCardRef = (i) => (el) => { if (el) cardsRef.current[i] = el; };

  /* ── Link Handling ── */
  const handleLinkClick = (e, lnk) => {
    e.preventDefault();
    console.log('[CardNav] Link clicked:', lnk); // LOGGING

    closeNav();

    setTimeout(() => {
      console.log('[CardNav] Executing navigation for:', lnk); // LOGGING

      // Handle Logout
      if (lnk.action === 'logout') {
        console.log('[CardNav] Initiating logout...'); // LOGGING
        authAPI.logout()
          .then(() => console.log('[CardNav] Logout API success')) // LOGGING
          .catch(err => console.error('[CardNav] Logout failed:', err))
          .finally(() => {
            console.log('[CardNav] Clearing storage and redirecting to login'); // LOGGING
            localStorage.removeItem('sbs-token');
            localStorage.removeItem('sbs-role');
            localStorage.removeItem('sbs-user');
            // Force re-evaluation of items immediately
            setNavItems(getNavItems(dark));
            navigate('/login');
          });
        return;
      }

      // Handle Protected Routes
      const token = localStorage.getItem('sbs-token');
      console.log('[CardNav] Checking protection. Protected?', lnk.protected, 'Has token?', !!token); // LOGGING
      if (lnk.protected && !token) {
        console.log('[CardNav] Access denied. Redirecting to login with state.'); // LOGGING
        navigate('/login', { state: { authRequired: true, from: lnk.to } });
        return;
      }

      // Normal Navigation
      if (lnk.to) {
        console.log('[CardNav] Navigating to:', lnk.to); // LOGGING
        navigate(lnk.to);
      }
    }, 350);
  };

  const themeClass = dark ? 'card-nav-dark' : 'card-nav-light';
  const textColor = dark ? '#fff' : '#000';

  return (
    <>
      {/* ── Backdrop ── 
          Included here to be reusable. It covers the screen when nav is open. 
      */}
      <div
        className={`nav-backdrop ${isExpanded ? 'active' : ''} ${isExpanded && !dark ? 'light' : ''}`}
        onClick={closeNav}
        aria-hidden="true"
      />

      <div className="card-nav-container">
        <nav
          ref={navRef}
          className={`card-nav ${themeClass} ${isExpanded ? 'open' : ''} ${scrolled ? 'scrolled' : ''}`}
        >
          <div className="card-nav-top">
            {/* Theme toggle — LEFT */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleTheme?.(); }}
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
              <Link
                to="/"
                className="card-nav-logo-text"
                style={{ color: textColor }}
                tabIndex={-1}
                onClick={closeNav}
              >
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

          {/* Expandable cards */}
          <div className="card-nav-content" aria-hidden={!isExpanded}>
            {navItems.slice(0, 3).map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="nav-card"
                ref={setCardRef(idx)}
                style={{ backgroundColor: item.bgColor, color: item.textColor }}
              >
                <div className="nav-card-label">{item.label}</div>
                <div className="nav-card-links">
                  {item.links?.map((lnk, i) => (
                    <button
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      onClick={(e) => handleLinkClick(e, lnk)}
                      aria-label={lnk.ariaLabel}
                      type="button"
                      style={{
                        color: item.textColor,
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        letterSpacing: 'inherit',
                        textTransform: 'inherit',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        position: 'relative',
                        zIndex: 10
                      }}
                    >
                      <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                      {lnk.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default CardNav;