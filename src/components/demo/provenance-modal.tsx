'use client';

/**
 * F.T1 / F.T6, "How we built these" provenance modal + reusable trigger.
 *
 * <ProvenanceLink> renders a text button that opens an accessible modal
 * (role=dialog, aria-modal, focus trap, Escape + click-outside close,
 * body scroll lock, focus restored to the trigger on close). The modal
 * body renders the F.T2 provenance sections. Each <ProvenanceLink>
 * instance owns its own open state, so the hero and footer triggers are
 * independent (only one opens at a time in practice).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PROVENANCE_SECTIONS, PROVENANCE_CORRECTION_MAILTO } from '@/lib/demo/provenance-copy';

export function ProvenanceLink({
  label = 'How we built these',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Restore focus to the trigger after the dialog unmounts.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        data-ms-cta-id="provenance-open"
        className={
          className ??
          'inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#00B4FF]/85 underline-offset-4 transition-colors hover:text-[#00B4FF] hover:underline'
        }
      >
        {label} <span aria-hidden>→</span>
      </button>
      {open ? <ProvenanceModal onClose={close} /> : null}
    </>
  );
}

function ProvenanceModal({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Body scroll lock for the lifetime of the modal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus the panel on mount; Escape closes; Tab is trapped within.
  useEffect(() => {
    const panel = panelRef.current;
    panel?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        // Click on the backdrop (not the panel) closes.
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="provenance-title"
        tabIndex={-1}
        className="relative max-h-[85vh] w-full max-w-[640px] overflow-y-auto rounded-[16px] border border-[#00B4FF]/[0.30] p-6 text-white outline-none sm:p-8"
        style={{
          background: 'linear-gradient(180deg, rgba(17, 19, 24, 0.98), rgba(10, 12, 16, 0.98))',
          boxShadow: '0 0 0 1px rgba(0,180,255,0.12) inset, 0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#00B4FF]/85">
              Provenance
            </div>
            <h2 id="provenance-title" className="mt-1 text-[22px] font-bold tracking-[-0.01em] text-white">
              How we built these
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 font-mono text-[12px] text-white/70 transition-colors hover:border-[#00B4FF]/55 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-5">
          {PROVENANCE_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h3 className="text-[14px] font-bold text-white">{section.heading}</h3>
              <p className="mt-1 text-[13.5px] leading-[1.6] text-white/[0.72]">{section.body}</p>
            </section>
          ))}
        </div>

        <a
          href={PROVENANCE_CORRECTION_MAILTO}
          data-ms-cta-id="provenance-correction"
          className="mt-6 inline-flex items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.10] px-4 py-2 text-[13px] font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22]"
        >
          Send a correction →
        </a>
      </div>
    </div>
  );
}
