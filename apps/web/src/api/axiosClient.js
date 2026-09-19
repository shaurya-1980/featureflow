/**
 * api/axiosClient.js
 *
 * Configured axios instance for all API calls.
 *
 * Key features:
 *  1. withCredentials: true — ensures the browser sends the httpOnly refresh
 *     token cookie on every request to the API.
 *  2. Response interceptor — on a 401 response, attempts ONE silent call to
 *     /auth/refresh to get a new access token, then retries the original
 *     request. If the refresh also fails (e.g. refresh token expired), it
 *     calls the registered logout handler to cleanly clear React state.
 *
 * The interceptor uses a `_retry` flag to prevent infinite loops: if the
 * retried request also gets a 401, we do NOT attempt another refresh.
 *
 * Inter-module communication pattern:
 *  All three bridges between this module and AuthContext go through explicit
 *  registered functions (same pattern — read/write/logout), avoiding fragile
 *  window globals that can silently fail if AuthContext is not yet mounted.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for the httpOnly refresh token cookie.
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Module-level registered functions — set by AuthContext on mount.
// These replace the fragile window.__setAccessToken / window.__logoutUser
// globals. All three directions (read token, write token, logout) now go
// through the same explicit registration pattern.
// ---------------------------------------------------------------------------
let getAccessToken = () => null;
let setAccessToken = (_token) => {};   // no-op until AuthContext registers
let logoutUser = () => {               // fallback: hard redirect as last resort
  window.location.href = '/login';
};

/**
 * Register a function that returns the current access token from AuthContext.
 * Called during AuthContext initialization.
 * @param {() => string|null} fn
 */
export const registerTokenGetter = (fn) => {
  getAccessToken = fn;
};

/**
 * Register a function that updates the access token in AuthContext state.
 * Called during AuthContext initialization.
 * @param {(token: string) => void} fn
 */
export const registerTokenSetter = (fn) => {
  setAccessToken = fn;
};

/**
 * Register a function that clears the auth session in AuthContext state.
 * Called during AuthContext initialization.
 * @param {() => void} fn
 */
export const registerLogoutHandler = (fn) => {
  logoutUser = fn;
};

// ---------------------------------------------------------------------------
// Request interceptor — attach the access token from memory if available.
// ---------------------------------------------------------------------------
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — silent refresh on 401.
// ---------------------------------------------------------------------------
axiosClient.interceptors.response.use(
  // Pass through successful responses unchanged.
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only attempt a refresh if:
    //  - The response was 401
    //  - We haven't already retried this exact request
    //  - This is NOT itself the /auth/refresh call (would infinite-loop)
    const is401 = error.response?.status === 401;
    const notRetried = !originalRequest._retry;
    const notRefreshEndpoint = !originalRequest.url?.includes('/auth/refresh');

    if (is401 && notRetried && notRefreshEndpoint) {
      originalRequest._retry = true; // Mark so we don't retry again.

      try {
        // Attempt a silent token refresh. The refresh token cookie is sent
        // automatically because withCredentials:true.
        const { data } = await axiosClient.post('/auth/refresh');

        // Update the in-memory token via the registered setter and attach to retry.
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }

        // Retry the original request with the new token.
        return axiosClient(originalRequest);
      } catch {
        // Refresh failed — session is truly expired. Clear state via registered handler.
        // logoutUser() defaults to window.location.href='/login' if AuthContext never
        // registered its handler, which is a genuine last-resort fallback only.
        logoutUser();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

