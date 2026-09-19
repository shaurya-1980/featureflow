/**
 * context/AuthContext.jsx
 *
 * Provides global authentication state and actions to the entire app.
 *
 * State:
 *  - user          : { id, name, email, role, isEmailVerified } | null
 *  - accessToken   : JWT string | null  (in-memory only — never in localStorage)
 *  - isAuthenticated: boolean
 *  - loading       : boolean (true while the initial session check is in progress)
 *
 * On mount, AuthContext attempts a silent /auth/refresh to restore the session
 * if the user has a valid refresh cookie from a previous visit. This is what
 * keeps the user logged in across page refreshes.
 *
 * The access token is stored in React state (in-memory) — NOT in localStorage
 * or sessionStorage — to avoid XSS token theft. The refresh token lives in an
 * httpOnly cookie managed entirely by the browser.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient, { registerTokenGetter, registerTokenSetter, registerLogoutHandler } from '../api/axiosClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true); // True until the initial refresh attempt completes.

  // ---------------------------------------------------------------------------
  // Register all three bridges with the axios interceptor:
  //  1. getter  — so the request interceptor can read the current token
  //  2. setter  — so the 401 interceptor can update the token after a refresh
  //  3. logout  — so the 401 interceptor can clear state after a failed refresh
  // ---------------------------------------------------------------------------
  useEffect(() => {
    registerTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    registerTokenSetter((token) => setAccessToken(token));
    registerLogoutHandler(() => {
      setUser(null);
      setAccessToken(null);
    });
    // These registrations are stable — no cleanup or dependencies needed.
  }, []);

  // ---------------------------------------------------------------------------
  // On mount: attempt silent refresh to restore session from the cookie.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await axiosClient.post('/auth/refresh');
        setAccessToken(data.accessToken);

        // Fetch the user profile with the new token.
        const meRes = await axiosClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        setUser(meRes.data.user);
      } catch {
        // No valid refresh cookie or refresh token expired — that's fine.
        // The user is simply not logged in.
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ---------------------------------------------------------------------------
  // signup: calls POST /auth/signup, returns response data (incl. devVerificationUrl)
  // ---------------------------------------------------------------------------
  const signup = useCallback(async ({ name, email, password }) => {
    const { data } = await axiosClient.post('/auth/signup', { name, email, password });
    return data;
  }, []);

  // ---------------------------------------------------------------------------
  // login: calls POST /auth/login, updates state on success
  // ---------------------------------------------------------------------------
  const login = useCallback(async ({ email, password }) => {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  // ---------------------------------------------------------------------------
  // logout: calls POST /auth/logout, clears local state
  // ---------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Even if the server call fails, clear local state.
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // refresh: explicitly triggers a token refresh. Exported for components
  // that need to manually refresh (the axios interceptor uses registerTokenSetter).
  // ---------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    const { data } = await axiosClient.post('/auth/refresh');
    setAccessToken(data.accessToken);
    return data.accessToken;
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user,
    loading,
    signup,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication state and actions.
 * Must be used inside an <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
};

export default AuthContext;
