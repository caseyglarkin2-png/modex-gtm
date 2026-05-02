import { onePagerToHtml, type OnePagerData } from '@/components/ai/one-pager-preview';

type RenderSource = 'json_one_pager' | 'html' | 'plain_text' | 'json_invalid' | 'json_unknown';

export type GeneratedContentRenderMetadata = {
  source: RenderSource;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePlainText(value: string): string {
  return `<div style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.5;">${escapeHtml(value)}</div>`;
}

function isOnePagerShape(value: unknown): value is OnePagerData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.headline === 'string' && typeof candidate.subheadline === 'string';
}

export function resolveGeneratedContentRendering(rawContent: string, accountName: string): GeneratedContentRenderMetadata {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return { source: 'plain_text', html: normalizePlainText('') };
  }

  if (trimmed.startsWith('<')) {
    return { source: 'html', html: rawContent };
  }

  const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  if (looksLikeJson) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isOnePagerShape(parsed)) {
        return { source: 'json_one_pager', html: onePagerToHtml(parsed, accountName) };
      }
      return { source: 'json_unknown', html: normalizePlainText(trimmed) };
    } catch {
      return { source: 'json_invalid', html: normalizePlainText(trimmed) };
    }
  }

  return { source: 'plain_text', html: normalizePlainText(trimmed) };
}
