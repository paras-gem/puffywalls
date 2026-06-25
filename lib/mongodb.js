import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // We don't throw an error to prevent breaking the app before env is set up, but we log a warning.
  console.warn('⚠️ Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Retrieve (or initialise) the shared cache object from the global scope.
 * Shape: { conn: mongoose | null, promise: Promise | null }
 *  - conn    → the resolved Mongoose connection (reused on every subsequent call)
 *  - promise → the in-flight connect() promise (prevents duplicate connection attempts)
 */
let cached = global.mongoose;

if (!cached) {
  // First call ever in this process — set up the empty cache object.
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Guard: if no URI is configured, return early to avoid crashing.
  if (!MONGODB_URI) return null;

  // ✅ FAST PATH: connection already established — reuse it immediately.
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Fail fast instead of buffering queries while disconnected
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  // Await the shared promise and cache the resolved connection for future calls.
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;