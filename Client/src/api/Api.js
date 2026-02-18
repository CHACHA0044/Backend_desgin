//src/api/Api.js
const BASE = import.meta.env.VITE_API_URL || '/api/v1';

const headers = (auth = false) => {
  const h = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('sbs-token');
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
};

const handle = async (res) => {
  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(new CustomEvent('sbs:auth-error'));
    throw new Error('Authentication required');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText || 'Request failed');
  }
  return res.json();
};

export const authAPI = {
  register: ({ name, email, password }) =>
    fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    }).then(handle),

  login: ({ email, password }) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: email.trim(), password }),
    }).then(handle),

  logout: () =>
    fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: headers(true),
    }).then(handle),

  me: () =>
    fetch(`${BASE}/auth/me`, {
      headers: headers(true),
    }).then(handle),
};

export const dishAPI = {
  list: () => fetch(`${BASE}/tasks/dishes`, { headers: headers(true) }).then(handle),
  get: (id) => fetch(`${BASE}/tasks/dishes/${id}`, { headers: headers(true) }).then(handle),
  create: (body) => fetch(`${BASE}/tasks/dishes`, { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then(handle),
  update: (id, body) => fetch(`${BASE}/tasks/dishes/${id}`, { method: 'PUT', headers: headers(true), body: JSON.stringify(body) }).then(handle),
  remove: (id) => fetch(`${BASE}/tasks/dishes/${id}`, { method: 'DELETE', headers: headers(true) }).then(handle),
};

export const orderAPI = {
  place: (dishId, qty = 1) => fetch(`${BASE}/tasks/orders`, { method: 'POST', headers: headers(true), body: JSON.stringify({ dishId, qty }) }).then(handle),
  mine: () => fetch(`${BASE}/tasks/orders/me`, { headers: headers(true) }).then(handle),
  all: () => fetch(`${BASE}/tasks/orders`, { headers: headers(true) }).then(handle),
  setStatus: (id, status) => fetch(`${BASE}/tasks/orders/${id}/status`, { method: 'PATCH', headers: headers(true), body: JSON.stringify({ status }) }).then(handle),
  remove: (id) => fetch(`${BASE}/tasks/orders/${id}`, { method: 'DELETE', headers: headers(true) }).then(handle),
};