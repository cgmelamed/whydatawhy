import { track } from '@vercel/analytics';

export type EventName =
  | 'File Uploaded'
  | 'Question Asked'
  | 'Visualization Generated'
  | 'Upgrade Clicked'
  | 'Checkout Started';

interface EventProperties {
  'File Uploaded': {
    fileType: string;
    fileSize: number;
    rowCount?: number;
  };
  'Question Asked': {
    question: string;
    dataSize?: number;
  };
  'Visualization Generated': {
    chartType: string;
    dataSize?: number;
  };
  'Upgrade Clicked': {
    remainingQueries: number;
  };
  'Checkout Started': {
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