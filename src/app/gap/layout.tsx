/**
 * Every GAP screen carries the NOTE button (stabilization E): one tap to capture a bug, friction or idea while
 * using GAP. The pages themselves are unchanged.
 */
import { Suspense } from 'react';
import { FeedbackButton } from '@/components/gap/feedback-button';

export default function GapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <FeedbackButton />
      </Suspense>
    </>
  );
}
