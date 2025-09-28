import mongoose from 'mongoose';

export async function connectMongo(uri) {
  if (!uri) throw new Error('Missing MONGO_URI');
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, { dbName: undefined });
  console.log('MongoDB connected');
}
