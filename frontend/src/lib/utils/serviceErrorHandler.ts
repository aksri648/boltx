export class ServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}
