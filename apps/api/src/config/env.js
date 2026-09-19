/**
 * config/env.js
 *
 * Single source of truth for all environment variables.
 * Reads from process.env (populated by dotenv in server.js before this runs),
 * validates that every required variable is present, and exports a typed
 * config object. Any other module that needs an env var MUST import from here —
 * never read process.env directly elsewhere in the codebase.
 */

const REQUIRED = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN_DAYS',
  'CLIENT_ORIGIN',
];

// Fail fast: if any required variable is missing, crash immediately with a
// clear message before the server even starts.
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[env] FATAL — Missing required environment variables: ${missing.join(', ')}\n` +
      `       Copy apps/api/.env.example to apps/api/.env and fill in the values.`
  );
  process.exit(1);
}

const env = {
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  },

  refreshToken: {
    // How many days a refresh token lives.
    expiresInDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS, 10) || 7,
  },

  // Allowed origin for CORS (comma-separated list supported).
  clientOrigin: process.env.CLIENT_ORIGIN,

  // Optional — only used by the seed script.
  seed: {
    adminName: process.env.SEED_ADMIN_NAME,
    adminEmail: process.env.SEED_ADMIN_EMAIL,
    adminPassword: process.env.SEED_ADMIN_PASSWORD,
    forceReset: process.env.SEED_ADMIN_FORCE_RESET === 'true',
  },

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default env;
