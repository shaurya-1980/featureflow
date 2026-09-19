/**
 * routes/health.routes.js
 *
 * GET /api/health — public endpoint.
 * Returns the server status and the current Mongoose connection state.
 * Useful for uptime monitoring and verifying the DB connection is alive.
 *
 * Mongoose readyState values:
 *   0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting.
 */

import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
