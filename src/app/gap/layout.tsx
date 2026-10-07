/**
 * Every GAP screen carries the NOTE button (stabilization E): one tap to capture a bug, friction or idea while
 * using GAP. The pages themselves are unchanged.
 */
import { Suspense } from 'react';
import { FeedbackButton } from '@/components/gap/feedback-button';
import { RefreshNudge } from '@/components/gap/refresh-now';

export default function GapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* R61: an in-place action's refreshed page is shown as soon as it arrives (see refresh-now.tsx). */}
      <RefreshNudge />
      <Suspense fallback={null}>
        <FeedbackButton />
      </Suspense>
    </>
  );
}
