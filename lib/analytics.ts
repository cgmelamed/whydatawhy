import { track } from '@vercel/analytics';

export type EventName =
  | 'file_uploaded'
  | 'question_asked'
  | 'visualization_generated'
  | 'upgrade_clicked'
  | 'checkout_started';

interface EventProperties {
  file_uploaded: {
    fileType: string;
    fileSize: number;
    rowCount?: number;
  };
  question_asked: {
    question: string;
    dataSize?: number;
  };
  visualization_generated: {
    chartType: string;
    dataSize?: number;
  };
  upgrade_clicked: {
    remainingQueries: number;
  };
  checkout_started: {
    plan: string;
  };
}

export function logEvent<T extends EventName>(
  eventName: T,
  properties?: EventProperties[T]
) {
  // Log to console (captured by Vercel)
  console.log(`[Analytics Event] ${eventName}`, properties);

  // Track with Vercel Analytics (if available)
  if (typeof window !== 'undefined' && track) {
    track(eventName, properties as any);
  }

  // In development, also log to console with formatting
  if (process.env.NODE_ENV === 'development') {
    console.table(properties);
  }
}

// Helper to get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'unknown';
}