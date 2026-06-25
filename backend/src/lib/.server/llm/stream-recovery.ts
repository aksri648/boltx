import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('StreamRecovery');

export const STREAM_RECOVERY_PROMPT = `You are an AI that helps recover from stream interruptions.
Please review the following conversation history and generate a summary of what was accomplished,
then pick up where we left off.`;

export function shouldAttemptRecovery(error: any): boolean {
  return error?.name === 'AbortError' || error?.message?.includes('stream') || error?.message?.includes('timeout');
}
