'use client';

/** Instant client-side copy-to-clipboard (Seller Action Center, dogfood fix, 2026-09-25). No network call, no side effect beyond the clipboard. */

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (!clipboard || typeof clipboard.writeText !== 'function') return;
    try {
      await clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the button simply does nothing rather than throwing.
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? 'Copied' : label}
    </Button>
  );
}
