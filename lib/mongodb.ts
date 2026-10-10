import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGO_URL;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isAvailable: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null, isAvailable: false };
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    cached!.isAvailable = false;
    return null;
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2500,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts)
      .then((instance) => {
        cached!.isAvailable = true;
        return instance;
      })
      .catch((err) => {
        console.warn('MongoDB connection note: Live cluster unreachable or bad auth. Falling back to local in-memory store.', err.message);
        cached!.isAvailable = false;
        cached!.promise = null;
        return null as any;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.isAvailable = false;
    return null;
  }

  return cached!.conn;
}

export function isMongoConnected(): boolean {
  return cached?.isAvailable ?? false;
}
