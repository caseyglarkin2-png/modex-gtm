'use client';

import { useSession } from 'next-auth/react';

export function useActor(): string {
  const { data } = useSession();
  return data?.user?.name ?? 'Unknown';
}
