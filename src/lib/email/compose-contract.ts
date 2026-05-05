import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';

export type ComposeWorkflowMetadata = {
  surface: string;
  shell?: string;
  variant?: string;
  recipientSetKey?: string | null;
  selectedRecipientIds?: number[];
  assetId?: number | null;
  assetVersion?: number | null;
  details?: Record<string, unknown>;
};

export type ComposePayloadRecipient = {
  id: number;
  name: string;
  email: string;
  title?: string;
  accountName?: string;
  readiness?: {
    score: number;
    tier: 'high' | 'medium' | 'low';
    stale: boolean;
  };
};

type BaseComposeInput = {
  accountName: string;
  recipients: ComposePayloadRecipient[];
  selectedRecipientIds: number[];
  recipientSetKey?: string | null;
};

export type OnePagerComposeInput = BaseComposeInput & {
  variant: 'one_pager_asset';
  subject: string;
  openingLine?: string;
  ctaLine?: string;
  asset: {
    id: number;
    generatedContentId?: number;
    version: number;
    content: string;
    contentType: string;
    providerUsed?: string | null;
  };
};

export type EmailDraftComposeInput = BaseComposeInput & {
  variant: 'email_draft';
  subject: string;
  openingLine?: string;
  body: string;
  ctaLine?: string;
};

export type AccountComposeInput = OnePagerComposeInput | EmailDraftComposeInput;

export type AccountComposePayload = {
  accountName: string;
  subject: string;
  bodyHtml: string;
  previewHtml: string;
  generatedContentId?: number;
  recipients: Array<{
    to: string;
    personaId: number;
    personaName: string;
    accountName: string;
    readinessScore?: number;
    readinessTier?: 'high' | 'medium' | 'low';
    stale?: boolean;
  }>;
  workflowMetadata: ComposeWorkflowMetadata;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeParagraph(value?: string) {
  return value?.trim() ?? '';
}

function renderPlainTextPreview(text: string) {
  const escaped = escapeHtml(text)
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px;">')
    .replace(/\n/g, '<br />');

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#ffffff;color:#111827;padding:24px;"><div style="max-width:640px;margin:0 auto;"><p style="margin:0 0 14px;">${escaped}</p></div></body></html>`;
}

function extractRenderableBody(renderedHtml: string) {
  const bodyMatch = renderedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch?.[1]?.trim() ?? renderedHtml;
}

function buildOnePagerEmailHtml(accountName: string, content: string, openingLine?: string, ctaLine?: string) {
  const rendering = resolveGeneratedContentRendering(content, accountName);
  const body = extractRenderableBody(rendering.html);
  const opening = normalizeParagraph(openingLine);
  const cta = normalizeParagraph(ctaLine);

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f8fafc;color:#111827;padding:24px;">
    <div style="max-width:760px;margin:0 auto;">
      ${opening ? `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:16px;"><p style="margin:0;font-size:15px;line-height:1.75;">${escapeHtml(opening)}</p></div>` : ''}
      <div style="border-radius:16px;overflow:hidden;">${body}</div>
      ${cta ? `<div style="background:#0f172a;color:#e2e8f0;border-radius:12px;padding:18px 20px;margin-top:16px;"><p style="margin:0;font-size:14px;line-height:1.7;">${escapeHtml(cta)}</p></div>` : ''}
    </div>
  </body></html>`;
}

function buildDraftBodyText(openingLine?: string, body?: string, ctaLine?: string) {
  return [normalizeParagraph(openingLine), normalizeParagraph(body), normalizeParagraph(ctaLine)]
    .filter(Boolean)
    .join('\n\n');
}

function buildSelectedRecipients(input: BaseComposeInput) {
  const selectedIds = new Set(input.selectedRecipientIds);
  return input.recipients
    .filter((recipient) => selectedIds.has(recipient.id))
    .map((recipient) => ({
      to: recipient.email,
      personaId: recipient.id,
      personaName: recipient.name,
      accountName: recipient.accountName ?? input.accountName,
      readinessScore: recipient.readiness?.score,
      readinessTier: recipient.readiness?.tier,
      stale: recipient.readiness?.stale,
    }));
}

export function buildAccountComposePayload(input: AccountComposeInput): AccountComposePayload {
  const recipients = buildSelectedRecipients(input);
  const workflowMetadata: ComposeWorkflowMetadata = {
    surface: 'account_page',
    shell: 'account_outreach',
    variant: input.variant,
    recipientSetKey: input.recipientSetKey ?? null,
    selectedRecipientIds: input.selectedRecipientIds,
  };

  if (input.variant === 'one_pager_asset') {
    workflowMetadata.assetId = input.asset.id;
    workflowMetadata.assetVersion = input.asset.version;
    workflowMetadata.details = {
      contentType: input.asset.contentType,
      providerUsed: input.asset.providerUsed ?? null,
    };

    const bodyHtml = buildOnePagerEmailHtml(input.accountName, input.asset.content, input.openingLine, input.ctaLine);
    return {
      accountName: input.accountName,
      subject: input.subject,
      bodyHtml,
      previewHtml: bodyHtml,
      generatedContentId: input.asset.generatedContentId,
      recipients,
      workflowMetadata,
    };
  }

  const bodyText = buildDraftBodyText(input.openingLine, input.body, input.ctaLine);
  return {
    accountName: input.accountName,
    subject: input.subject,
    bodyHtml: bodyText,
    previewHtml: renderPlainTextPreview(bodyText),
    recipients,
    workflowMetadata,
  };
}
