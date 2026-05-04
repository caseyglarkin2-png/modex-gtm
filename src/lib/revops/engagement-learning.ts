import type { OperatorOutcomeLabel } from '@/lib/revops/operator-outcomes';

export type SignalKind =
  | 'reply-objection'
  | 'bounce'
  | 'negative-outcome'
  | 'wrong-person'
  | 'bad-timing'
  | 'positive-signal'
  | 'unknown';

export type SignalToContentMappingInput = {
  sourceKind: string;
  sourceId: string;
  accountName: string;
  campaignId?: number | null;
  generatedContentId?: number | null;
  sendJobRecipientId?: number | null;
  emailLogId?: number | null;
  outcomeLabel?: OperatorOutcomeLabel | null;
  signalContext?: string | null;
};

export type SignalToContentMapping = {
  sourceKind: string;
  sourceId: string;
  accountName: string;
  campaignId: number | null;
  generatedContentId: number | null;
  sendJobRecipientId: number | null;
  emailLogId: number | null;
  signalKind: SignalKind;
  evidenceSnapshot: {
    outcomeLabel: OperatorOutcomeLabel | null;
    signalContext: string | null;
  };
};

export type RegenerationPromptContext = {
  headline: string;
  contextLines: string[];
  prompt: string;
};

export type LearningReviewStatus =
  | 'proposed'
  | 'in-review'
  | 'approved'
  | 'rejected'
  | 'deployed'
  | 'rolled-back';

export type LearningReviewAction = 'review' | 'approve' | 'reject' | 'deploy' | 'rollback';

export function inferSignalKind(
  sourceKind: string,
  outcomeLabel: OperatorOutcomeLabel | null | undefined,
): SignalKind {
  if (outcomeLabel === 'wrong-person') return 'wrong-person';
  if (outcomeLabel === 'bad-timing') return 'bad-timing';
  if (outcomeLabel === 'negative' || outcomeLabel === 'closed-lost') return 'negative-outcome';
  if (outcomeLabel === 'positive' || outcomeLabel === 'closed-won') return 'positive-signal';
  if (sourceKind === 'send-failure' || sourceKind === 'send-job-recipient') return 'bounce';
  if (sourceKind === 'email-log' || sourceKind === 'notification') return 'reply-objection';
  return 'unknown';
}

export function buildSignalToContentMapping(input: SignalToContentMappingInput): SignalToContentMapping {
  return {
    sourceKind: input.sourceKind,
    sourceId: input.sourceId,
    accountName: input.accountName,
    campaignId: input.campaignId ?? null,
    generatedContentId: input.generatedContentId ?? null,
    sendJobRecipientId: input.sendJobRecipientId ?? null,
    emailLogId: input.emailLogId ?? null,
    signalKind: inferSignalKind(input.sourceKind, input.outcomeLabel),
    evidenceSnapshot: {
      outcomeLabel: input.outcomeLabel ?? null,
      signalContext: input.signalContext ?? null,
    },
  };
}

export function buildRegenerationPromptContext(mapping: SignalToContentMapping): RegenerationPromptContext {
  const signalLine = `Signal: ${mapping.signalKind}`;
  const outcomeLine = mapping.evidenceSnapshot.outcomeLabel
    ? `Outcome label: ${mapping.evidenceSnapshot.outcomeLabel}`
    : 'Outcome label: none provided';
  const contextLine = mapping.evidenceSnapshot.signalContext
    ? `Observed context: ${mapping.evidenceSnapshot.signalContext}`
    : 'Observed context: none provided';

  const contextLines = [
    `Account: ${mapping.accountName}`,
    signalLine,
    outcomeLine,
    contextLine,
    'Task: regenerate one-pager copy to address this signal while preserving tone and core proof.',
    'Constraints: keep claims specific, avoid generic language, and strengthen objection handling.',
  ];

  return {
    headline: `Regenerate from ${mapping.signalKind}`,
    contextLines,
    prompt: contextLines.join('\n'),
  };
}

export type DiffRow = {
  oldLine: string;
  newLine: string;
  changed: boolean;
};

function normalizeLines(value: string): string[] {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildSideBySideDiff(oldValue: string, newValue: string): DiffRow[] {
  const oldLines = normalizeLines(oldValue);
  const newLines = normalizeLines(newValue);
  const length = Math.max(oldLines.length, newLines.length);
  const rows: DiffRow[] = [];

  for (let index = 0; index < length; index += 1) {
    const oldLine = oldLines[index] ?? '';
    const newLine = newLines[index] ?? '';
    rows.push({
      oldLine,
      newLine,
      changed: oldLine !== newLine,
    });
  }

  return rows;
}

export function nextLearningReviewStatus(
  currentStatus: LearningReviewStatus,
  action: LearningReviewAction,
): LearningReviewStatus | null {
  if (action === 'review' && currentStatus === 'proposed') return 'in-review';
  if (action === 'approve' && (currentStatus === 'proposed' || currentStatus === 'in-review')) return 'approved';
  if (action === 'reject' && (currentStatus === 'proposed' || currentStatus === 'in-review')) return 'rejected';
  if (action === 'deploy' && currentStatus === 'approved') return 'deployed';
  if (action === 'rollback' && currentStatus === 'deployed') return 'rolled-back';
  return null;
}

export function computeLearningReviewSlaDueAt(
  createdAt: Date,
  status: LearningReviewStatus,
): Date | null {
  if (status === 'deployed' || status === 'rolled-back' || status === 'rejected') return null;
  const days = status === 'approved' ? 2 : 7;
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
}
