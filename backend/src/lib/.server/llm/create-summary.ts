import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Summary');

export async function createSummary(messages: any[]): Promise<string> {
  if (!messages || messages.length === 0) return 'No conversation to summarize.';
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage?.content || '';
  const summary = content.substring(0, 500);
  logger.info('Created summary');
  return summary;
}
