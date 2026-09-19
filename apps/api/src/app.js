/**
 * app.js
 *
 * Configures and exports the Express application object.
 * This file is intentionally separated from server.js:
 *   - app.js  = middleware + routes (testable in isolation)
 *   - server.js = server startup + DB connection (not imported in tests)
 *
 * Global middleware order (follows Express best practices):
 *   1. helmet  — sets security-related HTTP headers.
 *   2. cors    — allows the frontend origin, with credentials.
 *   3. express.json() — parse JSON request bodies.
 *   4. cookie-parser  — parse cookie header (needed for the refresh token).
 *   5. morgan  — HTTP request logging (dev only).
 *   6. routes
 *   7. 404 handler
 *   8. centralized errorHandler (must be last, 4-arg signature).
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ---------------------------------------------------------------------------
// 1. Security headers (helmet sets X-Frame-Options, CSP, HSTS, etc.)
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// 2. CORS — allow only the configured frontend origin. credentials:true is
//    required for the browser to send the httpOnly refresh cookie cross-origin.
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.clientOrigin, // From env — never hardcoded.
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// 3. Body parsing (50kb limit sized for feature descriptions/comments)
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '50kb' }));

// ---------------------------------------------------------------------------
// 4. Cookie parsing — must come before routes that read cookies.
// ---------------------------------------------------------------------------
app.use(cookieParser());

// ---------------------------------------------------------------------------
// 5. HTTP request logging (dev only — morgan adds noise in prod logs)
// ---------------------------------------------------------------------------
if (env.isDevelopment) {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// 6. Routes
// ---------------------------------------------------------------------------
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// ---------------------------------------------------------------------------
// 7. 404 handler — catches any request that didn't match a route.
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ---------------------------------------------------------------------------
// 8. Centralized error handler — MUST be registered last.
//    Express identifies it by the 4-argument signature.
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;
