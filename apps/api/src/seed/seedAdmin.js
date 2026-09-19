/**
 * seed/seedAdmin.js
 *
 * Seeds an initial administrator user from environment variables.
 * Can be run standalone via: npm run seed:admin
 * Or called programmatically on API startup in server.js.
 *
 * Behaviour:
 *   - Reads admin credentials from SEED_ADMIN_NAME / SEED_ADMIN_EMAIL /
 *     SEED_ADMIN_PASSWORD env vars.
 *   - Idempotent:
 *       * If no user exists with adminEmail, creates one with role: 'admin' and isEmailVerified: true.
 *       * If user exists but role !== 'admin' or !isEmailVerified, ensures role: 'admin' and isEmailVerified: true.
 *       * If user already exists and is admin, logs and completes safely.
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import env from '../config/env.js';
import User from '../models/User.js';
import { hashPassword, comparePassword } from '../services/password.service.js';

export const autoSeedAdmin = async () => {
  const { adminName, adminEmail, adminPassword, forceReset } = env.seed;

  if (!adminName || !adminEmail || !adminPassword) {
    console.warn(
      '[seed] WARNING — SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, or SEED_ADMIN_PASSWORD not set in environment. Skipping admin seed.'
    );
    return;
  }

  try {
    const existing = await User.findOne({ email: adminEmail }).select('+passwordHash');

    if (existing) {
      let needsSave = false;
      const changes = [];

      if (existing.role !== 'admin') {
        existing.role = 'admin';
        changes.push('role -> admin');
        needsSave = true;
      }
      if (!existing.isEmailVerified) {
        existing.isEmailVerified = true;
        changes.push('isEmailVerified -> true');
        needsSave = true;
      }

      // Password sync/repair logic:
      // In development / test mode or when SEED_ADMIN_FORCE_RESET=true, verify that the
      // existing user's password matches SEED_ADMIN_PASSWORD. If it does not match (e.g.
      // created previously with a stale password or via manual signup), repair it so
      // demo admin credentials work reliably out of the box.
      // In real production (NODE_ENV === 'production' without forceReset), existing user
      // passwords are NEVER overwritten.
      const shouldCheckPassword = !env.isProduction || forceReset;

      if (shouldCheckPassword) {
        const passwordMatches = await comparePassword(adminPassword, existing.passwordHash);
        if (!passwordMatches) {
          existing.passwordHash = await hashPassword(adminPassword);
          changes.push('password updated to match environment configuration');
          needsSave = true;
        }
      }

      if (needsSave) {
        await existing.save();
        console.log(`[seed] Updated existing admin user ${adminEmail}: [${changes.join(', ')}].`);
      } else {
        console.log(`[seed] Admin user verified: ${adminEmail} (role: admin, email verified, credentials intact).`);
      }
      return;
    }

    const passwordHash = await hashPassword(adminPassword);

    await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isEmailVerified: true, // Admin is pre-verified — no email verification needed.
    });

    console.log(`[seed] Admin user created successfully: ${adminEmail} (role: admin, email verified).`);
  } catch (err) {
    console.error(`[seed] Error seeding admin user:`, err.message);
  }
};

// Check if this script was executed directly from CLI
const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (executedFilePath && currentFilePath === executedFilePath) {
  (async () => {
    await connectDB();
    await autoSeedAdmin();
    process.exit(0);
  })();
}

export default autoSeedAdmin;
