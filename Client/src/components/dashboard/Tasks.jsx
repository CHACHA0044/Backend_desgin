import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { dishAPI, orderAPI } from '../../api/Api';
/* ══════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
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
    const onOver = (e) => { if (e.target.closest('a, button, [role="button"], input')) cursorRef.current?.classList.add('hovering'); };
    const onOut  = () => cursorRef.current?.classList.remove('hovering');
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
    return () => { window.removeEventListener('mousemove', onMove); document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut); cancelAnimationFrame(raf.current); };
  }, []);
  return <div ref={cursorRef} className="custom-cursor" />;
};

/* ══════════════════════════════════════════════════════════════════════
   CARD NAV
   ══════════════════════════════════════════════════════════════════════ */
const CardNav = ({ logoText = 'SBS', items, ease = 'power3.out', dark = true, onOpenChange, onToggleTheme }) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null); const cardsRef = useRef([]); const tlRef = useRef(null);
  useEffect(() => { onOpenChange?.(isExpanded); }, [isExpanded, onOpenChange]);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  const calculateHeight = useCallback(() => { const navEl = navRef.current; if (!navEl) return 260; const isMobile = window.matchMedia('(max-width: 768px)').matches; if (isMobile) { const el = navEl.querySelector('.card-nav-content'); if (el) { const prev = { visibility: el.style.visibility, pointerEvents: el.style.pointerEvents, position: el.style.position, height: el.style.height }; Object.assign(el.style, { visibility: 'visible', pointerEvents: 'auto', position: 'static', height: 'auto' }); el.offsetHeight; const result = 56 + el.scrollHeight + 16; Object.assign(el.style, prev); return result; } } return 250; }, []);
  const createTimeline = useCallback(() => { const navEl = navRef.current; if (!navEl) return null; gsap.set(navEl, { height: 56, overflow: 'hidden' }); gsap.set(cardsRef.current, { y: 40, opacity: 0 }); const tl = gsap.timeline({ paused: true }); tl.to(navEl, { height: calculateHeight, duration: 0.4, ease }); tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.35, ease, stagger: 0.07 }, '-=0.15'); return tl; }, [ease, calculateHeight]);
  useLayoutEffect(() => { const tl = createTimeline(); tlRef.current = tl; return () => { tl?.kill(); tlRef.current = null; }; }, [createTimeline]);
  useLayoutEffect(() => { const handleResize = () => { if (!tlRef.current) return; tlRef.current.kill(); const newTl = createTimeline(); if (newTl) { if (isExpanded) newTl.progress(1); tlRef.current = newTl; } }; window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, [isExpanded, createTimeline]);
  const closeNav = useCallback(() => { const tl = tlRef.current; if (!tl || !isExpanded) return; setIsHamburgerOpen(false); tl.eventCallback('onReverseComplete', () => setIsExpanded(false)); tl.reverse(); }, [isExpanded]);
  useEffect(() => { window.__sbsCloseNav = closeNav; return () => { window.__sbsCloseNav = null; }; }, [closeNav]);
  const openNav = () => { const tl = tlRef.current; if (!tl || isExpanded) return; setIsHamburgerOpen(true); setIsExpanded(true); tl.play(0); };
  const toggleMenu = () => isExpanded ? closeNav() : openNav();
  const setCardRef = (i) => (el) => { if (el) cardsRef.current[i] = el; };
  const themeClass = dark ? 'card-nav-dark' : 'card-nav-light';
  const textColor  = dark ? '#fff' : '#000';
  return (
    <div className="card-nav-container">
      <nav ref={navRef} className={`card-nav ${themeClass} ${isExpanded ? 'open' : ''} ${scrolled ? 'scrolled' : ''}`}>
        <div className="card-nav-top">
          <button onClick={(e) => { e.stopPropagation(); onToggleTheme(); }} aria-label="Toggle theme" style={{ color: textColor }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-opacity hover:opacity-60">
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{dark ? '○' : '●'}</span>
          </button>
          <div className="logo-container">
            <Link to="/" className="card-nav-logo-text" style={{ color: textColor }} tabIndex={-1} onClick={closeNav}>{logoText}</Link>
          </div>
          <div className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`} onClick={toggleMenu} role="button" aria-label={isExpanded ? 'Close menu' : 'Open menu'} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleMenu()} style={{ color: textColor }}>
            <div className="hamburger-line" /><div className="hamburger-line" />
          </div>
        </div>
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="nav-card" ref={setCardRef(idx)} style={{ backgroundColor: item.bgColor, color: item.textColor }}>
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <Link key={`${lnk.label}-${i}`} className="nav-card-link" to={lnk.to || '#'} aria-label={lnk.ariaLabel} style={{ color: item.textColor }} onClick={closeNav}>
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />{lnk.label}
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

const getNavItems = (dark) => [
  { label: 'Navigate', bgColor: dark ? '#0e0e0e' : '#f2f2f2', textColor: dark ? '#fff' : '#000', links: [{ label: 'Home', to: '/', ariaLabel: 'Home' }, { label: 'About', to: '/about', ariaLabel: 'About' }] },
  { label: 'Account',  bgColor: dark ? '#141414' : '#eaeaea', textColor: dark ? '#fff' : '#000', links: [{ label: 'Login', to: '/login', ariaLabel: 'Login' }, { label: 'Register', to: '/register', ariaLabel: 'Register' }] },
  { label: 'Dashboard',bgColor: dark ? '#1a1a1a' : '#e2e2e2', textColor: dark ? '#fff' : '#000', links: [{ label: 'Tasks', to: '/dashboard', ariaLabel: 'Dashboard' }, { label: 'Profile', to: '/profile', ariaLabel: 'Profile' }] },
];

/* ══════════════════════════════════════════════════════════════════════
   MOCK DATA  (replace with real API calls later)
   ══════════════════════════════════════════════════════════════════════ */
const MOCK_DISHES = [
  { id: 1, name: 'Margherita Pizza', description: 'Classic tomato base, fresh mozzarella, basil, extra-virgin olive oil.', emoji: '🍕', createdAt: '2025-01-10T09:30:00Z', updatedAt: '2025-01-12T14:00:00Z' },
  { id: 2, name: 'Wagyu Burger',      description: 'A5 wagyu patty, truffle aioli, aged cheddar, brioche bun.',           emoji: '🍔', createdAt: '2025-01-11T11:00:00Z', updatedAt: '2025-01-11T11:00:00Z' },
  { id: 3, name: 'Sushi Platter',     description: '12-piece chef selection — salmon, tuna, yellowtail, ikura.',          emoji: '🍣', createdAt: '2025-01-13T08:00:00Z', updatedAt: '2025-01-15T10:30:00Z' },
  { id: 4, name: 'Pasta Carbonara',   description: 'Guanciale, Pecorino Romano, egg yolks, cracked black pepper.',        emoji: '🍝', createdAt: '2025-01-14T12:00:00Z', updatedAt: '2025-01-14T12:00:00Z' },
  { id: 5, name: 'Caesar Salad',      description: 'Romaine, house-made dressing, sourdough croutons, Parmigiano.',       emoji: '🥗', createdAt: '2025-01-15T09:00:00Z', updatedAt: '2025-01-16T09:00:00Z' },
];

const MOCK_ORDERS = [
  { id: 101, dishId: 1, dishName: 'Margherita Pizza', user: 'alice@example.com', qty: 2, status: 'delivered',  placedAt: '2025-01-16T13:00:00Z' },
  { id: 102, dishId: 3, dishName: 'Sushi Platter',    user: 'bob@example.com',   qty: 1, status: 'preparing', placedAt: '2025-01-16T14:30:00Z' },
  { id: 103, dishId: 2, dishName: 'Wagyu Burger',     user: 'alice@example.com', qty: 3, status: 'pending',   placedAt: '2025-01-17T12:00:00Z' },
];

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */
const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_COLORS = {
  pending:   { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/30' },
  preparing: { bg: 'bg-blue-400/10',   text: 'text-blue-400',   border: 'border-blue-400/30'   },
  delivered: { bg: 'bg-green-400/10',  text: 'text-green-400',  border: 'border-green-400/30'  },
  cancelled: { bg: 'bg-red-400/10',    text: 'text-red-400',    border: 'border-red-400/30'    },
};

/* ══════════════════════════════════════════════════════════════════════
   DISH FORM MODAL
   ══════════════════════════════════════════════════════════════════════ */
const DishModal = ({ dish, dark, onClose, onSave }) => {
  const [form, setForm] = useState({ name: dish?.name || '', description: dish?.description || '', emoji: dish?.emoji || '🍽️' });
  const [errors, setErrors] = useState({});

  const EMOJI_OPTIONS = ['🍕','🍔','🍣','🍝','🥗','🍜','🌮','🍛','🥩','🍱','🥘','🫕'];

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name = 'Name is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...dish, ...form, id: dish?.id || Date.now(), createdAt: dish?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    onClose();
  };

  const bd = dark ? 'border-white/10' : 'border-black/10';
  const inputCls = `w-full bg-transparent border rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 ${dark ? 'border-white/12 text-white placeholder:text-white/25 focus:border-white/35' : 'border-black/12 text-black placeholder:text-black/25 focus:border-black/35'}`;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(8px)', background: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }} onClick={onClose}>
        <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
          className={`relative w-full max-w-md rounded-2xl border p-6 ${dark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <span className="mono-tag">{dish ? '── Edit Dish' : '── New Dish'}</span>
              <h2 className="mt-1 text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>{dish ? 'Update details' : 'Create a dish'}</h2>
            </div>
            <button onClick={onClose} className={`text-lg leading-none transition-opacity hover:opacity-50 ${dark ? 'text-white/40' : 'text-black/40'}`} style={{ fontFamily: 'var(--font-mono)' }}>✕</button>
          </div>

          {/* Emoji picker */}
          <div className="mb-4">
            <label className={`mb-2 block text-xs tracking-widest uppercase ${dark ? 'text-white/40' : 'text-black/40'}`} style={{ fontFamily: 'var(--font-mono)' }}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((em) => (
                <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))}
                  className={`text-xl rounded-xl p-2 border transition-all duration-150 ${form.emoji === em ? (dark ? 'border-white/40 bg-white/10' : 'border-black/40 bg-black/10') : `border-transparent ${dark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="mb-3">
            <label className={`mb-1.5 block text-xs tracking-widest uppercase ${dark ? 'text-white/40' : 'text-black/40'}`} style={{ fontFamily: 'var(--font-mono)' }}>Dish Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Margherita Pizza" className={inputCls} style={{ fontFamily: 'var(--font-mono)' }} />
            {errors.name && <p className="mt-1 text-xs text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className={`mb-1.5 block text-xs tracking-widest uppercase ${dark ? 'text-white/40' : 'text-black/40'}`} style={{ fontFamily: 'var(--font-mono)' }}>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe ingredients, preparation…" className={`${inputCls} resize-none`} style={{ fontFamily: 'var(--font-mono)' }} />
            {errors.description && <p className="mt-1 text-xs text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>{errors.description}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 rounded-xl border px-4 py-3 text-xs tracking-widest uppercase transition-opacity hover:opacity-60 ${dark ? 'border-white/15 text-white/50' : 'border-black/15 text-black/50'}`} style={{ fontFamily: 'var(--font-mono)' }}>Cancel</button>
            <button onClick={handleSave}
              className={`group relative flex-1 overflow-hidden rounded-xl border px-4 py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${dark ? 'border-white/20 text-white' : 'border-black/20 text-black'}`}
              style={{ fontFamily: 'var(--font-mono)' }}>
              <span className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${dark ? 'bg-white' : 'bg-black'}`} />
              <span className={`relative z-10 transition-colors duration-300 ${dark ? 'group-hover:text-black' : 'group-hover:text-white'}`}>{dish ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   DELETE CONFIRM MODAL
   ══════════════════════════════════════════════════════════════════════ */
const DeleteModal = ({ label, dark, onClose, onConfirm }) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(8px)', background: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
        className={`w-full max-w-sm rounded-2xl border p-6 ${dark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'}`}
        onClick={(e) => e.stopPropagation()}>
        <p className={`mb-1 text-xs tracking-widest uppercase ${dark ? 'text-white/40' : 'text-black/40'}`} style={{ fontFamily: 'var(--font-mono)' }}>── Confirm Delete</p>
        <h3 className="mb-2 text-xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Are you sure?</h3>
        <p className={`mb-6 text-sm ${dark ? 'text-white/50' : 'text-black/50'}`} style={{ fontFamily: 'var(--font-mono)' }}>
          <span className={`font-bold ${dark ? 'text-white' : 'text-black'}`}>"{label}"</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 rounded-xl border px-4 py-3 text-xs tracking-widest uppercase transition-opacity hover:opacity-60 ${dark ? 'border-white/15 text-white/50' : 'border-black/15 text-black/50'}`} style={{ fontFamily: 'var(--font-mono)' }}>Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-xs font-bold tracking-widest uppercase text-red-400 transition-all hover:bg-red-400/20" style={{ fontFamily: 'var(--font-mono)' }}>Delete</button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

/* ══════════════════════════════════════════════════════════════════════
   DISH CARD — Admin view
   ══════════════════════════════════════════════════════════════════════ */
const AdminDishCard = ({ dish, dark, onEdit, onDelete, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12, scale: 0.97 }}
    transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22,1,0.36,1] }}
    className={`group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300 ${dark ? 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]' : 'border-black/8 bg-black/[0.02] hover:border-black/15 hover:bg-black/[0.04]'}`}
  >
    {/* Emoji + Name */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none">{dish.emoji}</span>
        <div>
          <h3 className={`font-bold leading-tight ${dark ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{dish.name}</h3>
        </div>
      </div>
      {/* Actions */}
      <div className="flex shrink-0 gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button onClick={() => onEdit(dish)} className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all hover:opacity-70 ${dark ? 'border-white/15 text-white/60' : 'border-black/15 text-black/60'}`} style={{ fontFamily: 'var(--font-mono)' }}>Edit</button>
        <button onClick={() => onDelete(dish)} className="rounded-lg border border-red-400/30 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-red-400 transition-all hover:bg-red-400/10" style={{ fontFamily: 'var(--font-mono)' }}>Del</button>
      </div>
    </div>

    {/* Description */}
    <p className={`text-sm leading-relaxed ${dark ? 'text-white/45' : 'text-black/45'}`}>{dish.description}</p>

    {/* Timestamps */}
    <div className={`flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[10px] ${dark ? 'border-white/6 text-white/25' : 'border-black/6 text-black/25'}`} style={{ fontFamily: 'var(--font-mono)' }}>
      <span>Created {fmt(dish.createdAt)}</span>
      {dish.updatedAt !== dish.createdAt && <span>· Edited {fmt(dish.updatedAt)}</span>}
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════
   DISH CARD — User menu view
   ══════════════════════════════════════════════════════════════════════ */
const UserDishCard = ({ dish, dark, onOrder, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22,1,0.36,1] }}
    className={`group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300 ${dark ? 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]' : 'border-black/8 bg-black/[0.02] hover:border-black/15 hover:bg-black/[0.04]'}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none">{dish.emoji}</span>
        <h3 className={`font-bold ${dark ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{dish.name}</h3>
      </div>
      <button onClick={() => onOrder(dish)}
        className={`group/btn relative shrink-0 overflow-hidden rounded-xl border px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${dark ? 'border-white/20 text-white' : 'border-black/20 text-black'}`}
        style={{ fontFamily: 'var(--font-mono)' }}>
        <span className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-300 group-hover/btn:scale-x-100 ${dark ? 'bg-white' : 'bg-black'}`} />
        <span className={`relative z-10 transition-colors duration-300 ${dark ? 'group-hover/btn:text-black' : 'group-hover/btn:text-white'}`}>Order</span>
      </button>
    </div>
    <p className={`text-sm leading-relaxed ${dark ? 'text-white/45' : 'text-black/45'}`}>{dish.description}</p>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════
   ORDER ROW
   ══════════════════════════════════════════════════════════════════════ */
const OrderRow = ({ order, dark, isAdmin, onDelete, index }) => {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, scale: 0.97 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22,1,0.36,1] }}
      className={`group flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${dark ? 'border-white/6 hover:border-white/12' : 'border-black/6 hover:border-black/12'}`}
    >
      <span className="text-xl leading-none shrink-0">{MOCK_DISHES.find(d => d.id === order.dishId)?.emoji || '🍽️'}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'var(--font-mono)' }}>{order.dishName}</span>
        {isAdmin && <span className={`text-[10px] truncate ${dark ? 'text-white/35' : 'text-black/35'}`} style={{ fontFamily: 'var(--font-mono)' }}>{order.user}</span>}
      </div>
      <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${sc.bg} ${sc.text} ${sc.border}`} style={{ fontFamily: 'var(--font-mono)' }}>{order.status}</span>
      <span className={`hidden text-[10px] sm:block ${dark ? 'text-white/25' : 'text-black/25'}`} style={{ fontFamily: 'var(--font-mono)' }}>qty {order.qty}</span>
      <span className={`hidden text-[10px] md:block ${dark ? 'text-white/25' : 'text-black/25'}`} style={{ fontFamily: 'var(--font-mono)' }}>{fmt(order.placedAt)}</span>
      <button onClick={() => onDelete(order)} className="ml-auto shrink-0 rounded-lg border border-red-400/0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-400/0 opacity-0 transition-all duration-200 group-hover:border-red-400/30 group-hover:text-red-400/80 group-hover:opacity-100 hover:bg-red-400/10" style={{ fontFamily: 'var(--font-mono)' }}>✕</button>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ══════════════════════════════════════════════════════════════════════ */
const SectionHeader = ({ tag, title, subtitle, dark, action }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22,1,0.36,1] }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <span className="mono-tag">{tag}</span>
      <h2 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
        {title}<br />
        <em className={`not-italic ${dark ? 'text-white/30' : 'text-black/30'}`}>{subtitle}</em>
      </h2>
    </div>
    {action}
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════
   TASKS PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function Tasks() {
  const navigate = useNavigate();

  /* Theme */
  const [dark,    setDark]    = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { const s = localStorage.getItem('sbs-theme'); if (s) setDark(s === 'dark'); }, []);
  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 520);
    setDark(d => { localStorage.setItem('sbs-theme', !d ? 'dark' : 'light'); return !d; });
  };

  /* Role — swap 'admin' / 'user' here until real auth is wired */
const storedRole = localStorage.getItem('sbs-role') || 'user';
const [role,     setRole]     = useState(storedRole);
const [dishes,   setDishes]   = useState([]);
const [orders,   setOrders]   = useState([]);
const [loading,  setLoading]  = useState(true);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const { dishes } = await dishAPI.list();
      setDishes(dishes);
      const res = role === 'admin' ? await orderAPI.all() : await orderAPI.mine();
      setOrders(res.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  load();
}, [role]);
// after fetching dishes:
setDishes(dishes.map(d => ({ ...d, id: d._id })));
setOrders(orders.map(o => ({ ...o, id: o._id, dishId: o.dish?._id, dishName: o.dish?.name })));

  const handleSaveDish = async (dish) => {
  try {
    if (dish._id) {
      const { dish: updated } = await dishAPI.update(dish._id, dish);
      setDishes(ds => ds.map(d => d._id === updated._id ? updated : d));
    } else {
      const { dish: created } = await dishAPI.create(dish);
      setDishes(ds => [created, ...ds]);
    }
  } catch (err) { console.error(err); }
};

const handleDeleteDish = async (dish) => {
  try {
    await dishAPI.remove(dish._id);
    setDishes(ds => ds.filter(d => d._id !== dish._id));
    setOrders(os => os.filter(o => (o.dish?._id || o.dishId) !== dish._id));
  } catch (err) { console.error(err); }
};

const handlePlaceOrder = async (dish) => {
  try {
    const { order } = await orderAPI.place(dish._id);
    setOrders(os => [order, ...os]);
    setOrderSuccess(dish.name);
    setTimeout(() => setOrderSuccess(null), 2800);
  } catch (err) { console.error(err); }
};

const handleDeleteOrder = async (order) => {
  try {
    await orderAPI.remove(order._id);
    setOrders(os => os.filter(o => o._id !== order._id));
  } catch (err) { console.error(err); }
};

  /* My orders (user view) */
  const myOrders = orders.filter(o => o.user === 'me@example.com');

  /* Derived */
  const bg    = dark ? 'bg-black'      : 'bg-white';
  const text  = dark ? 'text-white'    : 'text-black';
  const muted = dark ? 'text-white/40' : 'text-black/40';

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${bg} ${text}`}>
      <div className="grain-overlay" aria-hidden="true" />
      <div className={`nav-backdrop ${navOpen ? 'active' : ''} ${navOpen && !dark ? 'light' : ''}`} onClick={() => window.__sbsCloseNav?.()} aria-hidden="true" />
      <CustomCursor />
      <CardNav logoText="SBS" items={getNavItems(dark)} dark={dark} ease="power3.out" onOpenChange={setNavOpen} onToggleTheme={toggleTheme} />

      {/* ── MAIN ── */}
      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
        <div className={`pointer-events-none fixed inset-0 ${dark ? 'grid-bg-dark' : 'grid-bg'} opacity-40`} aria-hidden="true" />

        {/* Page header + role switcher */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }} className="relative z-10 mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="mono-tag">── Dashboard</span>
            <h1 className="mt-1 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
              {role === 'admin' ? 'Admin' : 'Menu'}<br />
              <em className={`not-italic ${dark ? 'text-white/30' : 'text-black/30'}`}>{role === 'admin' ? 'control.' : 'orders.'}</em>
            </h1>
          </div>

          {/* Role toggle — remove after real auth */}
          <div className={`flex items-center gap-1 rounded-xl border p-1 ${dark ? 'border-white/10' : 'border-black/10'}`}>
            {['admin','user'].map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`rounded-lg px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-200 ${role === r ? (dark ? 'bg-white text-black' : 'bg-black text-white') : muted}`}
                style={{ fontFamily: 'var(--font-mono)' }}>
                {r}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Order success toast ── */}
        <AnimatePresence>
          {orderSuccess && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
              className={`fixed right-6 top-24 z-50 rounded-xl border px-5 py-3 text-xs ${dark ? 'border-white/20 bg-white/5 text-white/80' : 'border-black/20 bg-black/5 text-black/80'}`}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              ✓ Order placed — <strong>{orderSuccess}</strong>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════════
            ADMIN VIEW
            ════════════════════════════════════════════════ */}
        {role === 'admin' && (
          <div className="relative z-10 space-y-16">

            {/* ── Dishes section ── */}
            <section>
              <SectionHeader
                tag="── Dish Management"
                title="All"
                subtitle="dishes."
                dark={dark}
                action={
                  <button onClick={() => setDishModal('new')}
                    className={`group relative overflow-hidden rounded-xl border px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${dark ? 'border-white/20 text-white' : 'border-black/20 text-black'}`}
                    style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${dark ? 'bg-white' : 'bg-black'}`} />
                    <span className={`relative z-10 transition-colors duration-300 ${dark ? 'group-hover:text-black' : 'group-hover:text-white'}`}>+ New Dish</span>
                  </button>
                }
              />

              {dishes.length === 0 ? (
                <div className={`rounded-2xl border border-dashed py-16 text-center ${dark ? 'border-white/10' : 'border-black/10'}`}>
                  <p className="text-4xl mb-3">🍽️</p>
                  <p className={`text-sm ${muted}`} style={{ fontFamily: 'var(--font-mono)' }}>No dishes yet. Create your first one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {dishes.map((dish, i) => (
                      <AdminDishCard key={dish.id} dish={dish} dark={dark} index={i}
                        onEdit={(d) => setDishModal(d)}
                        onDelete={(d) => setDeleteTarget({ type: 'dish', item: d })}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* ── Divider ── */}
            <div className="divider" />

            {/* ── All Orders section ── */}
            <section>
              <SectionHeader tag="── Order Management" title="All" subtitle="orders." dark={dark} />

              {orders.length === 0 ? (
                <div className={`rounded-2xl border border-dashed py-12 text-center ${dark ? 'border-white/10' : 'border-black/10'}`}>
                  <p className={`text-sm ${muted}`} style={{ fontFamily: 'var(--font-mono)' }}>No orders yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <AnimatePresence mode="popLayout">
                    {orders.map((order, i) => (
                      <OrderRow key={order.id} order={order} dark={dark} isAdmin index={i}
                        onDelete={(o) => setDeleteTarget({ type: 'order', item: o })}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            USER VIEW
            ════════════════════════════════════════════════ */}
        {role === 'user' && (
          <div className="relative z-10 space-y-16">

            {/* ── Menu section ── */}
            <section>
              <SectionHeader tag="── Menu" title="Today's" subtitle="dishes." dark={dark} />

              {dishes.length === 0 ? (
                <div className={`rounded-2xl border border-dashed py-16 text-center ${dark ? 'border-white/10' : 'border-black/10'}`}>
                  <p className="text-4xl mb-3">🍽️</p>
                  <p className={`text-sm ${muted}`} style={{ fontFamily: 'var(--font-mono)' }}>Menu is empty. Check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {dishes.map((dish, i) => (
                    <UserDishCard key={dish.id} dish={dish} dark={dark} index={i} onOrder={handlePlaceOrder} />
                  ))}
                </div>
              )}
            </section>

            {/* ── Divider ── */}
            <div className="divider" />

            {/* ── My Orders section ── */}
            <section>
              <SectionHeader tag="── Order History" title="My" subtitle="orders." dark={dark} />

              {myOrders.length === 0 ? (
                <div className={`rounded-2xl border border-dashed py-12 text-center ${dark ? 'border-white/10' : 'border-black/10'}`}>
                  <p className={`text-sm ${muted}`} style={{ fontFamily: 'var(--font-mono)' }}>No orders yet. Pick something from the menu.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <AnimatePresence mode="popLayout">
                    {myOrders.map((order, i) => (
                      <OrderRow key={order.id} order={order} dark={dark} isAdmin={false} index={i}
                        onDelete={(o) => setDeleteTarget({ type: 'order', item: o })}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t px-6 py-6 ${dark ? 'border-white/8' : 'border-black/8'}`}>
        <div className="mx-auto flex max-w-4xl justify-center">
          <span className="mono-tag" style={{ opacity: dark ? 0.2 : 0.25 }}>SBS — Scalable Backend System © 2025</span>
        </div>
      </footer>

      {/* ── Modals ── */}
      {(dishModal === 'new' || (dishModal && typeof dishModal === 'object')) && (
        <DishModal dish={dishModal === 'new' ? null : dishModal} dark={dark} onClose={() => setDishModal(null)} onSave={handleSaveDish} />
      )}

      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.type === 'dish' ? deleteTarget.item.name : deleteTarget.item.dishName}
          dark={dark}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget.type === 'dish')  handleDeleteDish(deleteTarget.item);
            if (deleteTarget.type === 'order') handleDeleteOrder(deleteTarget.item);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}