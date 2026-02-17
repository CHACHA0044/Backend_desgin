import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// UPDATED
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';

/* ══════════════════════════════════════════════════════════════════════
   getNavItems — auth-aware, exported so pages can use it too
   ══════════════════════════════════════════════════════════════════════ */
export const getNavItems = (dark) => {
  const isLoggedIn = !!localStorage.getItem('sbs-token');
  return [
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
      links: isLoggedIn
        ? [
            { label: 'Profile',  to: '/profile',   ariaLabel: 'Profile' },
            { label: 'Sign Out', to: '/logout',     ariaLabel: 'Sign Out' },
          ]
        : [
            { label: 'Login',    to: '/login',    ariaLabel: 'Login' },
            { label: 'Register', to: '/register', ariaLabel: 'Register' },
          ],
    },
    {
      label: 'Dashboard',
      bgColor: dark ? '#1a1a1a' : '#e2e2e2',
      textColor: dark ? '#fff' : '#000',
      links: [
        { label: 'Tasks',   to: '/dashboard', ariaLabel: 'Dashboard', protected: true },
        { label: 'Profile', to: '/profile',   ariaLabel: 'Profile',   protected: true },
      ],
    },
  ];
};

/* ══════════════════════════════════════════════════════════════════════
   CardNav component
   ══════════════════════════════════════════════════════════════════════ */
const CardNav = ({
  logoText    = 'SBS',
  items,
  ease        = 'power3.out',
  dark        = true,
  onOpenChange,
  onToggleTheme,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded,      setIsExpanded]      = useState(false);
  const [scrolled,        setScrolled]        = useState(false);
  const navRef   = useRef(null);
  const cardsRef = useRef([]);
  const tlRef    = useRef(null);
  const navigate = useNavigate();

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
        const prev = {
          visibility: el.style.visibility,
          pointerEvents: el.style.pointerEvents,
          position: el.style.position,
          height: el.style.height,
        };
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

  const toggleMenu = () => (isExpanded ? closeNav() : openNav());
  const setCardRef = (i) => (el) => { if (el) cardsRef.current[i] = el; };

  /* ── Handle nav link clicks — protected route check ── */
  const handleLinkClick = (e, lnk) => {
    closeNav();
    if (lnk.protected && !localStorage.getItem('sbs-token')) {
      e.preventDefault();
      navigate('/login', { state: { authRequired: true, from: lnk.to } });
    }
  };

  const themeClass = dark ? 'card-nav-dark' : 'card-nav-light';
  const textColor  = dark ? '#fff' : '#000';

  return (
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
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <Link
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    to={lnk.to || '#'}
                    aria-label={lnk.ariaLabel}
                    style={{ color: item.textColor }}
                    onClick={(e) => handleLinkClick(e, lnk)}
                  >
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

export default CardNav;