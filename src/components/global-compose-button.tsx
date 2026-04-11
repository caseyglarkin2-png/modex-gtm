'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailComposer } from '@/components/email/composer';

/**
 * Global compose FAB — visible on all internal pages.
 * Ctrl+Shift+E (Cmd+Shift+E on Mac) opens EmailComposer.
 * If on an /accounts/[slug] page, pre-fills account context.
 */
export function GlobalComposeButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Extract account name from /accounts/[slug] URL
  const accountSlug = pathname.match(/^\/accounts\/([^/]+)/)?.[1];
  const accountName = accountSlug
    ? accountSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : undefined;

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        title="Compose email (Ctrl+Shift+E)"
      >
        <Mail className="h-5 w-5" />
      </Button>
      <EmailComposer
        accountName={accountName ?? ''}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
