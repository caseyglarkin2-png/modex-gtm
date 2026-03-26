'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open command search' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['J', '↓'], description: 'Move to next row in tables' },
  { keys: ['K', '↑'], description: 'Move to previous row' },
  { keys: ['Enter'], description: 'Open selected row' },
  { keys: ['Esc'], description: 'Close dialogs' },
] as const;

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
      if (isInput) return;
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--muted-foreground)]">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs font-medium">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
