import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Home     from "./components/Home";
import Login    from "./components/auth/Login";
import Register from "./components/auth/Register";
import Tasks    from "./components/dashboard/Tasks";
import Profile  from "./components/dashboard/Profile";
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/logout"    element={<LogoutPage />} />
        <Route path="/dashboard" element={<Protected><Tasks /></Protected>} />
        <Route path="/profile"   element={<Protected><Profile /></Protected>} />
        {/* Catch-all */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}