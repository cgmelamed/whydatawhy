// Server-side analytics logging
// These logs are automatically captured by Vercel

export function logApiEvent(
  eventName: string,
  properties?: Record<string, any>,
  userId?: string
) {
  const timestamp = new Date().toISOString();

  // Structured logging format for better Vercel log analysis
  const logEntry = {
    timestamp,
    event: eventName,
    userId: userId || 'anonymous',
    ...properties,
    environment: process.env.NODE_ENV,
  };

  // Use console.log in production - Vercel automatically captures these
  console.log('[API Event]', JSON.stringify(logEntry));
}

export function logApiError(
  error: any,
  context?: Record<string, any>,
  userId?: string
) {
  const timestamp = new Date().toISOString();

  const errorEntry = {
    timestamp,
    level: 'error',
    userId: userId || 'anonymous',
    error: error?.message || String(error),
    stack: error?.stack,
    ...context,
    environment: process.env.NODE_ENV,
  };

  console.error('[API Error]', JSON.stringify(errorEntry));
}