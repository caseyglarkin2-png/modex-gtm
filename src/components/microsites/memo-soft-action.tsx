/**
 * Sprint M4 — single soft action at the bottom of every memo.
 *
 * The memo is anti-selling: no calendar link, no "book a call" button. The
 * one explicit next-step pointer goes to yardflow.ai/roi/ — the v2
 * calculator. The link carries account context in the query string (see
 * buildROIDeepLink), so prospects land on a calculator that already knows
 * roughly what their network looks like.
 *
 * Sprint M8 redesign — visual treatment is now italic centered serif with
 * hairline rules above and below. Reads as the editorial "epigraph"
 * gesture you see at the close of essays in the New York Review or
 * Harper's. The action is part of the document, not pasted on top of it.
 *
 * Tracking: the anchor carries data-ms-cta-id="roi-deep-link" which the
 * existing useMicrositeTracker picks up — clicks land in the memo's
 * session snapshot like any other tracked event.
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
      className={`mx-auto my-14 max-w-[40rem] border-y border-[#d8d2c2] py-10 px-4 text-center text-[#4a4641] xl:max-w-[52rem] 2xl:max-w-[64rem] ${FONT_SERIF}`}
      style={{
        fontVariationSettings: "'opsz' 18, 'SOFT' 80",
        fontStyle: 'italic',
        fontSize: 'clamp(1.2rem, 0.5vw + 1rem, 1.5rem)',
        lineHeight: 1.55,
      }}
    >
      {description ?? (
        <>
          If this is the layer worth looking at, there&rsquo;s a model behind every
          number above. The calculator at yardflow.ai/roi is pre-filled with the
          shape we read for {accountName}.
        </>
      )}
      <br />
      <a
        data-ms-cta-id="roi-deep-link"
        href={href}
        className="mt-3 inline-block border-b font-medium not-italic transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--memo-accent)]"
        style={{
          color: 'var(--memo-accent)',
          borderBottomColor: 'currentColor',
          fontVariationSettings: "'opsz' 14, 'SOFT' 30",
          fontWeight: 480,
        }}
      >
        Run the calculator with your network &rarr;
      </a>
    </section>
  );
}
