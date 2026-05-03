import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Activities' };

type SearchParams = {
  filter?: string;
};

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const suffix = params.filter ? `&filter=${encodeURIComponent(params.filter)}` : '';
  redirect(`/pipeline?tab=activities&legacy=activities${suffix}`);
}
