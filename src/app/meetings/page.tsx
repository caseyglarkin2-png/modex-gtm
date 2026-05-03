import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Meetings' };

export default async function MeetingsPage() {
  redirect('/pipeline?tab=meetings&legacy=meetings');
}
