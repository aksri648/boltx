import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { createScopedLogger, renderLogger } from './utils/logger';
import { getProviderList } from './utils/constants';
import { rateLimit } from './lib/middleware/rate-limit';

import chatRoutes from './routes/chat';
import llmCallRoutes from './routes/llmcall';
import modelsRoutes from './routes/models';
import configuredProvidersRoutes from './routes/configured-providers';
import checkEnvKeyRoutes from './routes/check-env-key';
import enhancerRoutes from './routes/enhancer';
import webSearchRoutes from './routes/web-search';
import exportApiKeysRoutes from './routes/export-api-keys';
import bugReportRoutes from './routes/bug-report';
import mcpRoutes from './routes/mcp';
import vercelRoutes from './routes/vercel';
import netlifyRoutes from './routes/netlify';
import githubRoutes from './routes/github';
import gitlabRoutes from './routes/gitlab';
import supabaseRoutes from './routes/supabase';
import gitProxyRoutes from './routes/git-proxy';
import gitInfoRoutes from './routes/git-info';
import systemRoutes from './routes/system';
import updateRoutes from './routes/update';
import updateModelListRoutes from './routes/update-model-list';
import sandboxRoutes, { setupSandboxWebSocket } from './routes/sandbox';
import configRoutes from './routes/config';
import featuresRoutes from './routes/features';
import vercelProxyRoutes from './routes/vercel-proxy';
import netlifyProxyRoutes from './routes/netlify-proxy';
import { SandboxManager } from './lib/sandbox/sandbox-manager';
import { connectMongoDB, disconnectMongoDB } from './lib/db/mongodb';
import chatStorageRoutes from './routes/chats';

const logger = createScopedLogger('Server');

export async function createServer() {
  await getProviderList();

  const app = express();
  const PORT = parseInt(process.env.PORT || '3001', 10);
  const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting — 120 requests per minute per IP
  app.use('/api', rateLimit(60_000, 120));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Persistence routes — must be mounted before /api/chat to avoid prefix collision
  app.use('/api/chat-storage', chatStorageRoutes);
  // AI chat streaming routes
  app.use('/api/chat', chatRoutes);
  app.use('/api/llmcall', llmCallRoutes);
  app.use('/api/models', modelsRoutes);
  app.use('/api/configured-providers', configuredProvidersRoutes);
  app.use('/api/check-env-key', checkEnvKeyRoutes);
  app.use('/api/enhancer', enhancerRoutes);
  app.use('/api/web-search', webSearchRoutes);
  app.use('/api/export-api-keys', exportApiKeysRoutes);
  app.use('/api/bug-report', bugReportRoutes);
  app.use('/api/mcp', mcpRoutes);
  app.use('/api/vercel', vercelRoutes);
  app.use('/api/netlify', netlifyRoutes);
  app.use('/api/github', githubRoutes);
  app.use('/api/gitlab', gitlabRoutes);
  app.use('/api/supabase', supabaseRoutes);
  app.use('/api/git-proxy', gitProxyRoutes);
  app.use('/api/git-info', gitInfoRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/update', updateRoutes);
  app.use('/api/update-model-list', updateModelListRoutes);
  app.use('/api', sandboxRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/features', featuresRoutes);
  app.use('/api/vercel-proxy', vercelProxyRoutes);
  app.use('/api/netlify-proxy', netlifyProxyRoutes);

  // 404 handler
  app.use((_req: express.Request, res: express.Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return { app, PORT };
}

if (process.env.NODE_ENV !== 'test') {
  createServer().then(async ({ app, PORT }) => {
    await connectMongoDB();

    const server = http.createServer(app);

    const wss = new WebSocketServer({ server, path: '/api/sandbox' });
    setupSandboxWebSocket(wss);

    server.listen(PORT, () => {
      renderLogger.info('Bolt backend server running on port', PORT);
    });
  });
}

process.on('SIGTERM', async () => {
  logger.info('Cleaning up sandboxes...');
  await SandboxManager.getInstance().cleanup();
  await disconnectMongoDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Cleaning up sandboxes...');
  await SandboxManager.getInstance().cleanup();
  await disconnectMongoDB();
  process.exit(0);
});
