import { dbGetAccounts } from '@/lib/db';
import CaptureForm from './capture-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mobile Capture' };

export default async function CapturePage() {
  // Pull live account names for the autocomplete so the suggestions reflect
  // actual targets in the workspace, not a stale hardcoded sample.
  const accounts = await dbGetAccounts();
  const accountSuggestions = Array.from(
    new Set(accounts.map((a) => a.name).filter((n): n is string => Boolean(n))),
  ).sort((a, b) => a.localeCompare(b));

  return <CaptureForm accountSuggestions={accountSuggestions} />;
}
