import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<boolean> {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    console.info('[database] connected');
    return true;
  } catch (error) {
    console.warn('[database] unavailable; source-backed read mode enabled', error instanceof Error ? error.message : error);
    return false;
  }
}

export function databaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
