/** Query params a share can arrive with: ?url=, or the Web Share Target shape ?title=&text= (text often holds "headline https://..."). */
export type SharedParams = { url?: string; text?: string; title?: string; account?: string; note?: string };

/** The shared link: ?url= first, else the first http(s) URL inside text/title. Empty when none. */
export function sharedUrlOf(p: SharedParams): string {
  const direct = (p.url ?? '').trim();
  if (direct) return direct.slice(0, 2_000);
  const m = /(https?:\/\/[^\s]+)/i.exec(`${p.text ?? ''} ${p.title ?? ''}`);
  return m ? m[1].replace(/[)\].,;:!?'"]+$/, '').slice(0, 2_000) : '';
}
