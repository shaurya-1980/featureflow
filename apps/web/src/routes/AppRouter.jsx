/**
 * routes/AppRouter.jsx
 *
 * Defines the client-side route tree.
 *
 * Route overview:
 *  - Auth pages (/login, /signup, /verify-email, /forgot-password, /reset-password) — public
 *  - Feature feed   /             — public
 *  - Feature detail /posts/:id    — public
 *  - Roadmap        /roadmap      — public (no auth required)
 *  - Admin portal   /admin        — admin role required (AdminRoute guard)
 *  - Catch-all      *             — redirects to /
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminRoute from './AdminRoute.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import SignupPage from '../pages/SignupPage.jsx';
import VerifyEmailPage from '../pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/ResetPasswordPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import PostDetailPage from '../pages/PostDetailPage.jsx';
import RoadmapPage from '../pages/RoadmapPage.jsx';
import AdminPage from '../pages/AdminPage.jsx';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* ── Public auth routes ──────────────────────────────────── */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/signup"          element={<SignupPage />} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* ── Public feature feed & detail ───────────────────────── */}
      <Route path="/"          element={<HomePage />} />
      <Route path="/posts/:id" element={<PostDetailPage />} />

      {/* ── Public product roadmap ─────────────────────────────── */}
      <Route path="/roadmap" element={<RoadmapPage />} />

      {/* ── Admin-only portal (admin role required) ────────────── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      {/* ── Catch-all ──────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
