'use client';

import DOMPurify from 'dompurify';

/**
 * Sanitize untrusted HTML before rendering with dangerouslySetInnerHTML.
 *
 * Only intended for client components — DOMPurify needs `window`. During SSR
 * (when `window` is undefined) we return an empty string so nothing renders
 * until hydration replaces it with the real sanitized markup.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
