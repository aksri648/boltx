import mongoose from 'mongoose';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MongoDB');

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    logger.info('Already connected to MongoDB');
    return;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.warn('MONGODB_URI not set — MongoDB persistence disabled');
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('Disconnected from MongoDB');
}

export function isMongoDBConnected(): boolean {
  return isConnected;
}
