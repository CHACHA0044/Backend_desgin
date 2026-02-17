import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import CardNav from '../../common/CardNav';
import { dishAPI, orderAPI } from '../../api/Api';
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
    return () => { window.removeEventListener('mousemove', onMove); document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut); cancelAnimationFrame(raf.current); };
  }, []);
  return <div ref={cursorRef} className="custom-cursor" />;
};

/* ══════════════════════════════════════════════════════════════════════
   CARD NAV
   ══════════════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════════════
   MOCK DATA  (replace with real API calls later)
   ══════════════════════════════════════════════════════════════════════ */
const MOCK_DISHES = [
  { id: 1, name: 'Margherita Pizza', description: 'Classic tomato base, fresh mozzarella, basil, extra-virgin olive oil.', emoji: '🍕', createdAt: '2025-01-10T09:30:00Z', updatedAt: '2025-01-12T14:00:00Z' },
  { id: 2, name: 'Wagyu Burger', description: 'A5 wagyu patty, truffle aioli, aged cheddar, brioche bun.', emoji: '🍔', createdAt: '2025-01-11T11:00:00Z', updatedAt: '2025-01-11T11:00:00Z' },
  { id: 3, name: 'Sushi Platter', description: '12-piece chef selection — salmon, tuna, yellowtail, ikura.', emoji: '🍣', createdAt: '2025-01-13T08:00:00Z', updatedAt: '2025-01-15T10:30:00Z' },
  { id: 4, name: 'Pasta Carbonara', description: 'Guanciale, Pecorino Romano, egg yolks, cracked black pepper.', emoji: '🍝', createdAt: '2025-01-14T12:00:00Z', updatedAt: '2025-01-14T12:00:00Z' },
  { id: 5, name: 'Caesar Salad', description: 'Romaine, house-made dressing, sourdough croutons, Parmigiano.', emoji: '🥗', createdAt: '2025-01-15T09:00:00Z', updatedAt: '2025-01-16T09:00:00Z' },
];

const MOCK_ORDERS = [
  { id: 101, dishId: 1, dishName: 'Margherita Pizza', user: 'alice@example.com', qty: 2, status: 'delivered', placedAt: '2025-01-16T13:00:00Z' },
  { id: 102, dishId: 3, dishName: 'Sushi Platter', user: 'bob@example.com', qty: 1, status: 'preparing', placedAt: '2025-01-16T14:30:00Z' },
  { id: 103, dishId: 2, dishName: 'Wagyu Burger', user: 'alice@example.com', qty: 3, status: 'pending', placedAt: '2025-01-17T12:00:00Z' },
];

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */
const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_COLORS = {
  pending: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/30' },
  preparing: { bg: 'bg-blue-400/10', text: 'text-blue-400', border: 'border-blue-400/30' },
  delivered: { bg: 'bg-green-400/10', text: 'text-green-400', border: 'border-green-400/30' },
  cancelled: { bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/30' },
};

/* ══════════════════════════════════════════════════════════════════════
   DISH FORM MODAL
   ══════════════════════════════════════════════════════════════════════ */
const DishModal = ({ dish, dark, onClose, onSave }) => {
  const [form, setForm] = useState({ name: dish?.name || '', description: dish?.description || '', emoji: dish?.emoji || '🍽️' });
  const [errors, setErrors] = useState({});

  const EMOJI_OPTIONS = ['🍕', '🍔', '🍣', '🍝', '🥗', '🍜', '🌮', '🍛', '🥩', '🍱', '🥘', '🫕'];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
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
        <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
    transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
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
    transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
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
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`group flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${dark ? 'border-white/6 hover:border-white/12' : 'border-black/6 hover:border-black/12'}`}
    >
      <span className="text-xl leading-none shrink-0">{MOCK_DISHES.find(d => d.id === order.dishId)?.emoji || '🍽️'}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'var(--font-mono)' }}>{order.dishName}</span>
        {isAdmin && <span className={`text-[10px] truncate ${dark ? 'text-white/35' : 'text-black/35'}`} style={{ fontFamily: 'var(--font-mono)' }}>{order.user}</span>}
      </div>
      <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${sc.bg} ${sc.text} ${sc.border}`} style={{ fontFamily: 'var(--font-mono)' }}>{order.status}</span>
      <span className={`hidden text-[10px] sm:block ${dark ? 'text-white/25' : 'text-black/25'}`} style={{ fontFamily: 'var(--font-mono)' }}>qty {order.qty}</span>
      <span className={`text-[10px] ${dark ? 'text-white/25' : 'text-black/25'}`} style={{ fontFamily: 'var(--font-mono)' }}>{fmt(order.createdAt || order.placedAt)}</span>
      <button onClick={() => onDelete(order)} className="ml-auto shrink-0 rounded-lg border border-red-400/0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-400/0 opacity-0 transition-all duration-200 group-hover:border-red-400/30 group-hover:text-red-400/80 group-hover:opacity-100 hover:bg-red-400/10" style={{ fontFamily: 'var(--font-mono)' }}>✕</button>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ══════════════════════════════════════════════════════════════════════ */
const SectionHeader = ({ tag, title, subtitle, dark, action }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
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
  const [dark, setDark] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [dishModal, setDishModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [adminReqPending, setAdminReqPending] = useState(false);
  useEffect(() => { const s = localStorage.getItem('sbs-theme'); if (s) setDark(s === 'dark'); }, []);
  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 520);
    setDark(d => { localStorage.setItem('sbs-theme', !d ? 'dark' : 'light'); return !d; });
  };

  /* Role — swap 'admin' / 'user' here until real auth is wired */
  const storedRole = localStorage.getItem('sbs-role') || 'user';
  const storedUser = JSON.parse(localStorage.getItem('sbs-user') || '{}');
  const [role, setRole] = useState(storedRole);
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* Check admin request cooldown */
    const reqKey = 'sbs-admin-req-date-' + (storedUser.id || 'anon');
    const lastReq = localStorage.getItem(reqKey);
    if (lastReq) {
      const diff = Date.now() - parseInt(lastReq, 10);
      if (diff < 24 * 60 * 60 * 1000) setAdminReqPending(true);
      else localStorage.removeItem(reqKey); // expired
    }

    const load = async () => {
      setLoading(true);
      try {
        const { dishes } = await dishAPI.list();
        setDishes(dishes.map(d => ({ ...d, id: d._id })));

        /* Only admin can fetch all orders, but we need to handle the case where 
           user clicks 'admin' tab but isn't actually an admin yet */
        if (storedRole === 'admin' && role === 'admin') {
          const res = await orderAPI.all();
          setOrders(res.orders.map(o => ({ ...o, id: o._id, dishId: o.dish?._id, dishName: o.dish?.name })));
        } else if (role === 'user') {
          const res = await orderAPI.mine();
          setOrders(res.orders.map(o => ({ ...o, id: o._id, dishId: o.dish?._id, dishName: o.dish?.name })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role, storedRole]);

  const handleRequestAdmin = () => {
    const subject = `approve admin for ${storedUser.email || 'unknown'}`;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=pdemla@student.iul.ac.in&su=${encodeURIComponent(subject)}`;
    window.open(url, '_blank');
    const reqKey = 'sbs-admin-req-date-' + (storedUser.id || 'anon');
    localStorage.setItem(reqKey, Date.now().toString());
    setAdminReqPending(true);
  };

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
  const myOrders = orders;

  /* Derived */
  const bg = dark ? 'bg-black' : 'bg-white';
  const text = dark ? 'text-white' : 'text-black';
  const muted = dark ? 'text-white/40' : 'text-black/40';

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${bg} ${text}`}>
      <div className="grain-overlay" aria-hidden="true" />

      <CustomCursor />
      <CardNav logoText="SBS" dark={dark} ease="power3.out" onOpenChange={setNavOpen} onToggleTheme={toggleTheme} />

      {/* ── MAIN ── */}
      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
        <div className={`pointer-events-none fixed inset-0 ${dark ? 'grid-bg-dark' : 'grid-bg'} opacity-40`} aria-hidden="true" />

        {/* Page header + role switcher */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="mono-tag">── Dashboard</span>
            <h1 className="mt-1 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
              {role === 'admin' ? 'Admin' : 'Menu'}<br />
              <em className={`not-italic ${dark ? 'text-white/30' : 'text-black/30'}`}>{role === 'admin' ? 'control.' : 'orders.'}</em>
            </h1>
          </div>

          {/* Role toggle — remove after real auth */}
          <div className={`flex items-center gap-1 rounded-xl border p-1 ${dark ? 'border-white/10' : 'border-black/10'}`}>
            {['admin', 'user'].map(r => (
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
            {/* ── ACCESS CHECK ── */}
            {storedRole !== 'admin' ? (
              <div className={`mx-auto max-w-lg rounded-3xl border p-12 text-center ${dark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                {adminReqPending ? (
                  <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20 text-3xl text-yellow-400">⏳</div>
                    <h2 className="mb-3 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Request Processing</h2>
                    <p className={`text-sm leading-relaxed ${muted}`} style={{ fontFamily: 'var(--font-mono)' }}> Your request is in process. Once approved u will get a mail and be able to handle dish management.</p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-3xl text-blue-500">🔒</div>
                    <h2 className="mb-3 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Admin Access Required</h2>
                    <p className={`mb-8 text-sm leading-relaxed ${muted}`} style={{ fontFamily: 'var(--font-mono)' }}>You do not have permission to view the Admin Dashboard. You may request access from the system administrator.</p>
                    <button onClick={handleRequestAdmin} className={`rounded-xl px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 ${dark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`} style={{ fontFamily: 'var(--font-mono)' }}>Request Admin Position</button>
                  </>
                )}
              </div>
            ) : (
              /* ── REAL ADMIN DASHBOARD ── */
              <>

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

                {/* End of Real Admin Dashboard */}
              </>
            )}
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
            if (deleteTarget.type === 'dish') handleDeleteDish(deleteTarget.item);
            if (deleteTarget.type === 'order') handleDeleteOrder(deleteTarget.item);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}