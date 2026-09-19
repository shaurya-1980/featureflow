/**
 * config/db.js
 *
 * Establishes and exports the Mongoose connection helper.
 * Called once during server startup (server.js). If the initial connection
 * fails the process exits — there is no point serving traffic without a DB.
 */

import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[db] MongoDB connection FAILED: ${error.message}`);
    process.exit(1); // Fatal — cannot operate without a database.
  }
};

export default connectDB;
