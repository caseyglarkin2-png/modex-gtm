/**
 * Evidence depth: how many INDEPENDENT sources back a thesis (2026-09-25).
 *
 * A research target, not a gate, and not a confidence score. One strong
 * primary source stays approvable; two weak ones are not better.
 *
 * Independence is about ORIGIN, not links:
 *   - passages of the same document are one origin (an SEC filing is its
 *     accession: every sentence of one 10-Q is one source);
 *   - the same URL (ignoring query and fragment) is one origin;
 *   - the same excerpt at different URLs is one origin (syndication, a
 *     rewritten press release, an AI summary quoting the same line);
 *   - a keyword hit that quotes nothing (an auto-ingested trigger with no
 *     evidence text) is not counted at all: it names a document, it does not
 *     show a fact from it;
 *   - Casey's own operator knowledge is one first-party origin, labeled as
 *     such (unverified hearsay is still something he knows).
 */
export interface DepthSignal {
  id: string;
  source_kind: string;
  source_type?: string | null;
  evidence_url: string | null;
  evidence_text: string | null;
  summary?: string | null;
  title?: string | null;
}

export type DepthLabel = 'INSUFFICIENT' | 'SINGLE-SOURCE' | 'CORROBORATED' | 'WELL-SUPPORTED';

export interface EvidenceOrigin {
  key: string;
  kind: 'primary' | 'secondary' | 'operator' | 'other';
  signalIds: string[];
  label: string;
}

export interface EvidenceDepth {
  independentSources: number;
  label: DepthLabel;
  origins: EvidenceOrigin[];
  keywordOnly: number;
}

const excerptKey = (t: string) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 160);

export function originKeyOf(s: DepthSignal): string | null {
  if (s.source_kind === 'operator_knowledge' || s.source_kind === 'manual') return `operator:${s.id}`;
  if (!s.evidence_url) return null;
  try {
    const u = new URL(s.evidence_url);
    const sec = /\/Archives\/edgar\/data\/\d+\/(\d{10,})\//.exec(u.pathname);
    if (/sec\.gov$/i.test(u.hostname) && sec) return `sec:${sec[1]}`;
    return `url:${u.hostname.replace(/^www\./, '').toLowerCase()}${u.pathname.replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return `url:${s.evidence_url.trim().toLowerCase()}`;
  }
}

export function evidenceDepth(signals: readonly DepthSignal[]): EvidenceDepth {
  let keywordOnly = 0;
  const origins = new Map<string, EvidenceOrigin>();
  const byExcerpt = new Map<string, string>();
  for (const s of signals) {
    const text = (s.evidence_text ?? '').trim() || (s.summary ?? '').trim();
    const isOperator = s.source_kind === 'operator_knowledge' || s.source_kind === 'manual';
    if (!isOperator && !text) {
      keywordOnly += 1;
      continue;
    }
    let key = originKeyOf(s);
    if (!key) continue;
    // Syndication: the same excerpt already seen under another origin is that origin.
    if (!isOperator && text) {
      const ek = excerptKey(text);
      const prior = byExcerpt.get(ek);
      if (prior && prior !== key) key = prior;
      else byExcerpt.set(ek, key);
    }
    const kind: EvidenceOrigin['kind'] = isOperator ? 'operator' : s.source_type === 'public_primary' ? 'primary' : s.source_type === 'public_secondary' ? 'secondary' : 'other';
    const existing = origins.get(key);
    if (existing) existing.signalIds.push(s.id);
    else origins.set(key, { key, kind, signalIds: [s.id], label: isOperator ? 'Casey (operator knowledge)' : s.title ?? key });
  }
  const n = origins.size;
  const label: DepthLabel = n === 0 ? 'INSUFFICIENT' : n === 1 ? 'SINGLE-SOURCE' : n === 2 ? 'CORROBORATED' : 'WELL-SUPPORTED';
  return { independentSources: n, label, origins: [...origins.values()], keywordOnly };
}
