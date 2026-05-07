'use client';

import { useContext } from 'react';
import { SessionContext } from 'next-auth/react';

export function useActor(): string {
  const ctx = useContext(SessionContext);
  return ctx?.data?.user?.name ?? 'Unknown';
}
