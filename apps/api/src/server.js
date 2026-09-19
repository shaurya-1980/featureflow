/**
 * server.js
 *
 * Entry point for the API process. Responsibilities:
 *   1. Load environment variables from .env BEFORE anything else imports env.js.
 *   2. Connect to MongoDB.
 *   3. Start the HTTP server.
 *
 * We deliberately keep this file minimal so that app.js (the Express
 * configuration) can be imported in isolation for testing without triggering
 * a server start or DB connection.
 */

// dotenv must be called before any module that reads process.env is imported.
import 'dotenv/config';

import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { autoSeedAdmin } from './seed/seedAdmin.js';

const start = async () => {
  // Establish the MongoDB connection first — the server should not accept
  // traffic if the DB is unavailable.
  await connectDB();

  // Ensure initial admin user exists and is verified
  await autoSeedAdmin();

  const server = app.listen(env.port, () => {
    console.log(`[server] API running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  // Graceful shutdown: on SIGTERM/SIGINT, stop accepting connections and let
  // in-flight requests complete before the process exits.
  const shutdown = (signal) => {
    console.log(`[server] ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('[server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start();
