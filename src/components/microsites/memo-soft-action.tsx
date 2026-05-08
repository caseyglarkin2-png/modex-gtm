/**
 * Sprint M4 — the single soft action at the bottom of every memo.
 *
 * The memo is anti-selling: no calendar link, no "book a call" button.
 * The one explicit next-step pointer goes to yardflow.ai/roi/ — the
 * v2 calculator. The link carries account context in the query string
 * (see buildROIDeepLink), so prospects land on a calculator that
 * already knows roughly what their network looks like.
 *
 * Tracking: the anchor carries data-ms-cta-id="roi-deep-link" which
 * the existing useMicrositeTracker picks up — clicks land in the
 * memo's session snapshot like any other tracked event.
 */

interface MemoSoftActionProps {
  accountName: string;
  href: string;
  /** Optional one-liner override. Defaults to a network-shape framing. */
  description?: string;
}

export function MemoSoftAction({ accountName, href, description }: MemoSoftActionProps) {
  return (
    <section
      data-ms-section-id="soft-action"
      className="mt-16 border-t border-slate-200 pt-10"
    >
      <h2 className="font-serif text-xl font-semibold text-slate-900">
        Want the numbers on your specific network?
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {description ??
          `The /roi/ calculator at yardflow.ai is open. Pre-filled with the network shape we read for ${accountName} — adjust the assumptions, see what shifts. The output is a downloadable PDF you can circulate internally before any conversation with us.`}
      </p>
      <a
        data-ms-cta-id="roi-deep-link"
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--memo-accent)] hover:underline"
      >
        Run the calculator on your network →
      </a>
    </section>
  );
}
