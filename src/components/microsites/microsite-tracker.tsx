'use client';

import { useMicrositeTracker } from './use-microsite-tracker';

interface MicrositeTrackerProps {
  accountName: string;
  accountSlug: string;
  path: string;
  personName?: string;
  personSlug?: string;
  variantSlug?: string;
  flushIntervalMs?: number;
}

export function MicrositeTracker(props: MicrositeTrackerProps) {
  useMicrositeTracker(props);
  return null;
}