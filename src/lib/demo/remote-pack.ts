import { getForPage } from '@/lib/for/store';

/** A no-deploy /demo pack: the demoPack JSON stored on the for_pages row. */
export async function getRemoteDemoPack(slug: string): Promise<unknown | null> {
  const row = await getForPage(slug);
  return row?.demoPack ?? null;
}
