/**
 * The reframe — names the invisible problem (the "siloed yard" mindset) that
 * most prospects haven't articulated. This is the demo's cold-email payload:
 * before the cost (replay) and the scale (network band), it tells the visitor
 * what they're actually looking at. Presentational only.
 */
interface Props {
  displayName: string;
}

const STEPS = ['Gate', 'Guard', 'Dock', 'Spotter', 'Exit'];

export function DemoReframe({ displayName }: Props) {
  return (
    <section
      data-ms-section-id="reframe"
      className="shrink-0 border-b border-[#00B4FF]/[0.10] bg-[#070809]"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-7">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]/85">
          The frame
        </div>
        <h2 className="mt-2 max-w-3xl text-2xl font-semibold leading-snug tracking-[-0.01em] text-white max-[480px]:text-xl">
          {displayName}&rsquo;s stack is connected. The yards never were.
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/70">
          Your TMS runs the road. Your WMS runs the building. The yards are the tier between
          them, and they were never on the network.
        </p>

        {/* Broken-chain diagram: each step is an isolated box; the connectors
            between them are dashed + severed to show the silos don't share. */}
        <div className="mt-5 flex flex-wrap items-center gap-y-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white/85">
                {step}
              </div>
              {i < STEPS.length - 1 && (
                <span className="flex items-center px-1.5 text-[#FF6A3D]/70" aria-hidden>
                  <span className="h-px w-4 border-t border-dashed border-white/25" />
                  <span className="px-0.5 text-xs">⊘</span>
                  <span className="h-px w-4 border-t border-dashed border-white/25" />
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/70">
          Every truck gets re-keyed, re-queued, and re-found at each step. The lost time lives{' '}
          <span className="italic text-white/90">between</span> the steps, which is why no single
          tool ever fixed it. The audit below is that gap, measured on your real yards.
        </p>
      </div>
    </section>
  );
}
