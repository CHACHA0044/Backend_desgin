import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Home from "./components/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Tasks from "./components/dashboard/Tasks";
import Profile from "./components/dashboard/Profile";
import { authAPI } from "./api/Api";

/* ══════════════════════════════════════════════════════════════════════
   PROTECTED ROUTE
   Redirects to /login with state so Login can show a message
   ══════════════════════════════════════════════════════════════════════ */
const Protected = ({ children }) => {
  const location = useLocation();
  if (!localStorage.getItem('sbs-token')) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ authRequired: true, from: location.pathname }}
      />
    );
  }
  return children;
};

/* ══════════════════════════════════════════════════════════════════════
   LOGOUT ROUTE
   Calls API, clears storage, redirects to login with "signed out" flag
   ══════════════════════════════════════════════════════════════════════ */
const LogoutPage = () => {
  useEffect(() => {
    const doLogout = async () => {
      try { await authAPI.logout(); } catch { /* ignore if token already expired */ }
      localStorage.removeItem('sbs-token');
      localStorage.removeItem('sbs-role');
      localStorage.removeItem('sbs-user');
    };
    doLogout();
  }, []);
  return <Navigate to="/login" replace state={{ loggedOut: true }} />;
};

/* ══════════════════════════════════════════════════════════════════════
   AUTH OBSERVER
   Listens for 401/403 events from API and redirects to login
   ══════════════════════════════════════════════════════════════════════ */
const AuthObserver = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('sbs-token');
      localStorage.removeItem('sbs-role');
      localStorage.removeItem('sbs-user');
      navigate('/login', { replace: true, state: { authRequired: true } });
    };
    window.addEventListener('sbs:auth-error', handler);
    return () => window.removeEventListener('sbs:auth-error', handler);
  }, [navigate]);
  return null;
};

export default function App() {
  return (
    <Router>
      <AuthObserver />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}