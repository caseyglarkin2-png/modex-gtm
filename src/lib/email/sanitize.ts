const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_ATTR_RE = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL_RE = /(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*'|\s*javascript:[^\s>]+)/gi;

export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(SCRIPT_TAG_RE, '')
    .replace(EVENT_HANDLER_ATTR_RE, '')
    .replace(JAVASCRIPT_URL_RE, '$1="#"');
}