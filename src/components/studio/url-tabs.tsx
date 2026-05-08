'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { Tabs as TabsRoot } from '@/components/ui/tabs';

type UrlTabsProps = {
  activeTab: string;
  paramName?: string;
  pathname?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof TabsRoot>, 'value' | 'onValueChange' | 'children'>;

export function UrlTabs({
  activeTab,
  paramName = 'tab',
  pathname,
  children,
  ...rest
}: UrlTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <TabsRoot
      {...rest}
      value={activeTab}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set(paramName, value);
        const target = pathname
          ? `${pathname}?${params.toString()}`
          : `?${params.toString()}`;
        router.push(target, { scroll: false });
      }}
    >
      {children}
    </TabsRoot>
  );
}
