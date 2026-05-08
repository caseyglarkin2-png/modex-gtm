/**
 * Sprint M4 — the single soft action at the bottom of every memo.
 *
 * The memo is anti-selling: no calendar link, no "book a call" button.
 * The one explicit next-step pointer goes to yardflow.ai/roi/ — the
 * v2 calculator. The link carries account context in the query string
 * (see buildROIDeepLink), so prospects land on a calculator that
 * already knows roughly what their network looks like.
 *
 * Visual treatment intentionally low-key: the soft action is set in the
 * same body type as the surrounding copy, the anchor is a regular
 * text-color link with a subtle chevron — NOT a brand-tinted CTA button.
 * That's the point. The action is part of the document, not pasted on
 * top of it.
 *
 * Tracking: the anchor carries data-ms-cta-id="roi-deep-link" which
 * the existing useMicrositeTracker picks up — clicks land in the
 * memo's session snapshot like any other tracked event.
 */

const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';

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
      className="border-t border-slate-200 pt-10"
    >
      <h2 className={`text-[1.25rem] font-medium text-slate-900 ${FONT_SERIF}`}>
        If you want the numbers on your specific network
      </h2>
      <p className="mt-3 text-[15px] leading-[1.65] text-slate-600">
        {description ??
          `The ROI calculator at yardflow.ai/roi is open. It's pre-filled with the network shape we read for ${accountName}; adjust the assumptions, see what shifts. The output is a downloadable PDF you can circulate internally before any conversation with us.`}
      </p>
      <p className="mt-4">
        <a
          data-ms-cta-id="roi-deep-link"
          href={href}
          className="text-[15px] text-slate-900 underline decoration-slate-300 decoration-1 underline-offset-[5px] transition-colors hover:decoration-slate-700"
        >
          Run the calculator with your network
          <span aria-hidden="true" className="ml-1 text-slate-400">›</span>
        </a>
      </p>
    </section>
  );
}
