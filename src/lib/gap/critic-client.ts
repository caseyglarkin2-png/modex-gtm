/**
 * Clawd congruence-critic client (GAP Prospecting OS, Sprint 3, S3-T9).
 *
 * Wire contract, read from clawd-control-plane on 2026-09-23:
 *   scripts/routes/critic_routes.py:53-84   POST /api/critic/score, Bearer MC_API_TOKEN
 *     body  {"text": "<copy>", "type": "email|post|for-page|paper|signature|generic", "use_llm": true}
 *   scripts/critic/congruence.py:286-323    response
 *     {verdict: pass|warn|block, hard_block: bool, score: 0-100,
 *      counts: {block, warn}, violations: [{rule, severity, message, ...}],
 *      artifact_type, used_llm}
 *   critic_routes.py:72-82  for type email or post the edge (voice) critic is
 *     attached as `edge: {verdict, hard_block, score, violations}`; a caller that
 *     gates on voice blocks when edge.verdict == "block". A broken edge critic
 *     comes back as `edge_error` and is ignored here (congruence stands).
 *
 * Mapping: block or hard_block -> reject; warn -> review; pass -> pass. The
 * edge verdict is folded in the same way and the stricter of the two wins.
 * The subject is folded into the text as a "Subject:" line so the critic sees
 * the whole artifact; the GAP input type `cold_email` is clawd's `email`.
 *
 * Failure discipline: this client never throws and never logs the token. A
 * missing base URL or token answers `critic_unconfigured` without a network
 * call; a non-2xx answers `critic_http_<status>`; a rejected fetch answers
 * `critic_unreachable`; the 5 s abort answers `critic_timeout`; a body that is
 * not the shape above answers `critic_malformed`. The orchestrator treats
 * every `ok:false` as review_required, never pass.
 */

export const CRITIC_TIMEOUT_MS = 5_000;

export type CriticVerdict = 'pass' | 'review' | 'reject';

export interface CriticScoreInput {
  subject: string;
  body: string;
  type: 'cold_email';
}

export interface CriticFinding {
  source: 'congruence' | 'edge';
  rule: string;
  severity: string;
  message: string;
}

export type CriticFailureReason =
  | 'critic_unconfigured'
  | 'critic_unreachable'
  | 'critic_timeout'
  | 'critic_malformed'
  | `critic_http_${number}`;

export type CriticScoreResult =
  | { ok: true; verdict: CriticVerdict; score: number; findings: CriticFinding[] }
  | { ok: false; reason: CriticFailureReason };

export interface CriticClient {
  score(input: CriticScoreInput): Promise<CriticScoreResult>;
}

export interface MakeCriticClientOptions {
  baseUrl?: string | undefined;
  token?: string | undefined;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const CLAWD_TYPE: Record<CriticScoreInput['type'], string> = { cold_email: 'email' };

const VERDICT_MAP: Record<string, CriticVerdict> = { pass: 'pass', warn: 'review', block: 'reject' };
const VERDICT_RANK: Record<CriticVerdict, number> = { pass: 0, review: 1, reject: 2 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapVerdict(raw: Record<string, unknown>): CriticVerdict | null {
  const word = typeof raw.verdict === 'string' ? VERDICT_MAP[raw.verdict] : undefined;
  if (!word) return null;
  return raw.hard_block === true ? 'reject' : word;
}

function mapFindings(raw: Record<string, unknown>, source: CriticFinding['source']): CriticFinding[] {
  if (!Array.isArray(raw.violations)) return [];
  const out: CriticFinding[] = [];
  for (const v of raw.violations) {
    if (!isRecord(v)) continue;
    out.push({
      source,
      rule: typeof v.rule === 'string' ? v.rule : 'unknown',
      severity: typeof v.severity === 'string' ? v.severity : 'unknown',
      message: typeof v.message === 'string' ? v.message : '',
    });
  }
  return out;
}

/** Map one clawd response body; null when it is not the documented shape. */
export function mapClawdCriticResponse(payload: unknown): Extract<CriticScoreResult, { ok: true }> | null {
  if (!isRecord(payload)) return null;
  const verdict = mapVerdict(payload);
  if (!verdict) return null;
  if (typeof payload.score !== 'number' || !Number.isFinite(payload.score)) return null;

  let finalVerdict = verdict;
  const findings = mapFindings(payload, 'congruence');
  if (isRecord(payload.edge)) {
    const edgeVerdict = mapVerdict(payload.edge);
    if (edgeVerdict && VERDICT_RANK[edgeVerdict] > VERDICT_RANK[finalVerdict]) finalVerdict = edgeVerdict;
    findings.push(...mapFindings(payload.edge, 'edge'));
  }
  return { ok: true, verdict: finalVerdict, score: payload.score, findings };
}

export function makeCriticClient(opts: MakeCriticClientOptions = {}): CriticClient {
  const baseUrl = (opts.baseUrl ?? process.env.CLAWD_BASE_URL ?? process.env.CLAWD_URL ?? '').trim().replace(/\/+$/, '');
  const token = (opts.token ?? process.env.MC_API_TOKEN ?? '').trim();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? CRITIC_TIMEOUT_MS;

  return {
    async score(input: CriticScoreInput): Promise<CriticScoreResult> {
      if (!baseUrl || !token) return { ok: false, reason: 'critic_unconfigured' };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}/api/critic/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: `Subject: ${input.subject}\n\n${input.body}`,
            type: CLAWD_TYPE[input.type],
            use_llm: true,
          }),
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timer);
        const aborted = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
        return { ok: false, reason: aborted ? 'critic_timeout' : 'critic_unreachable' };
      }
      clearTimeout(timer);

      if (!response.ok) return { ok: false, reason: `critic_http_${response.status}` };

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { ok: false, reason: 'critic_malformed' };
      }
      return mapClawdCriticResponse(payload) ?? { ok: false, reason: 'critic_malformed' };
    },
  };
}
