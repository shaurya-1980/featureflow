/**
 * services/password.service.js
 *
 * Encapsulates all bcrypt operations so the cost factor is set in exactly one
 * place and controllers never touch bcrypt directly.
 */

import bcrypt from 'bcrypt';

// Cost factor 12 is the spec requirement. Each increment roughly doubles
// the hashing time; 12 is a solid balance between security and CPU cost.
const SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} plainPassword - The raw password from the user.
 * @returns {Promise<string>} The bcrypt hash to store in the DB.
 */
export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * @param {string} plainPassword - The raw password to check.
 * @param {string} hash          - The stored bcrypt hash.
 * @returns {Promise<boolean>}   True if they match, false otherwise.
 */
export const comparePassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};
