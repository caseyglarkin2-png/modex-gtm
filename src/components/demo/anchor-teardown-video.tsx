/**
 * I.T6 — 60-second teardown video player for a microsite.
 *
 * Renders a lazy <video> card when the pack carries
 * account.teardownVideoSrc; returns null otherwise (so the ~41 packs
 * without a recorded video render nothing). preload="none" keeps it off
 * the critical path. Poster optional; falls back to the satellite thumb
 * when provided.
 */

export function AnchorTeardownVideo({
  src,
  brand,
  poster,
}: {
  src?: string;
  brand: string;
  poster?: string;
}) {
  if (!src) return null;
  return (
    <section
      data-teardown-video
      className="mx-auto w-full max-w-5xl px-5 pb-6"
      aria-label={`Teardown video for ${brand}`}
    >
      <div className="overflow-hidden rounded-[12px] border border-[#00B4FF]/[0.16]">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          controls
          preload="none"
          poster={poster}
          className="aspect-video w-full bg-black"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
      <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/55">
        60-second teardown of {brand}&apos;s audited network
      </p>
    </section>
  );
}
