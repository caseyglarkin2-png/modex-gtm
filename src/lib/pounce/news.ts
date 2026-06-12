/**
 * Pounce Engine — news source (Phase 1, Task 1).
 *
 * Google News RSS is the zero-auth, zero-dependency news firehose:
 *   https://news.google.com/rss/search?q=<query>&hl=en-US&gl=US&ceid=US:en
 * One fetch per account per scan. Parsing is a deliberate minimal regex pass
 * (title/link/pubDate/source per <item>) — RSS from this endpoint is machine
 * generated and stable, and a parser dependency would be the only new dep in
 * the cron path. Never throws: a failed fetch or parse returns [].
 */

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
}

const RSS_BASE = 'https://news.google.com/rss/search';

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

export async function fetchAccountNews(query: string): Promise<NewsItem[]> {
  const url = `${RSS_BASE}?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; YardFlowPounce/1.0)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = m[1];
      const title = tag(block, 'title');
      const link = tag(block, 'link');
      const pub = tag(block, 'pubDate');
      const source = tag(block, 'source');
      const publishedAt = new Date(pub);
      if (!title || !link || Number.isNaN(publishedAt.getTime())) continue;
      items.push({ title, url: link, source: source || 'unknown', publishedAt });
    }
    return items;
  } catch {
    return [];
  }
}
