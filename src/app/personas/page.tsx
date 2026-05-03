import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contacts' };

export default function PersonasAliasPage() {
  redirect('/contacts?view=all&legacy=personas');
}
