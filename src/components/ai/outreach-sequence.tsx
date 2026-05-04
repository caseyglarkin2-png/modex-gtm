'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { readApiResponse } from '@/lib/api-response';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Zap, RefreshCw, Send, Copy, ChevronDown, Mail, MessageSquare, HandMetal,
  Check, Clock, ArrowRight, Link2,
} from 'lucide-react';
import { EmailPreviewModal } from '@/components/email/email-preview-modal';
import { getMicrositeUrl } from '@/lib/site-url';
import type { AgentActionResult } from '@/lib/agent-actions/types';

interface SequenceStep {
  step: string;
  subject: string;
  body: string;
  dayOffset: number;
  status?: 'draft' | 'sent' | 'opened' | 'clicked' | 'replied';
}

interface OutreachSequenceProps {
  accountName: string;
  personas: Array<{ name: string; title?: string; priority: string }>;
  campaignSlug?: string;
  trigger?: React.ReactNode;
  variant?: 'dialog' | 'inline';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STEP_LABELS: Record<string, string> = {
  initial_email: 'Initial Email',
  follow_up_1: 'Follow-up #1',
  follow_up_2: 'Follow-up #2',
  breakup: 'Breakup Email',
};

const STEP_ICONS: Record<string, typeof Mail> = {
  initial_email: Mail,
  follow_up_1: ArrowRight,
  follow_up_2: MessageSquare,
  breakup: HandMetal,
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-500/15 text-neutral-500',
  sent: 'bg-blue-500/15 text-blue-700',
  opened: 'bg-amber-500/15 text-amber-700',
  clicked: 'bg-emerald-500/15 text-emerald-700',
  replied: 'bg-green-500/15 text-green-700',
};

type Tone = 'formal' | 'conversational' | 'provocative';

const TONE_LABELS: Record<Tone, string> = {
  formal: 'Professional',
  conversational: 'Casual',
  provocative: 'Bold',
};

function slugifyAccountName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function OutreachSequenceDialog({
  accountName,
  personas,
  campaignSlug,
  trigger,
  variant = 'dialog',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: OutreachSequenceProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = variant === 'dialog' ? (controlledOpen ?? internalOpen) : true;
  const setOpen = variant === 'dialog' ? (controlledOnOpenChange ?? setInternalOpen) : () => {};
  const [tone, setTone] = useState<Tone>('conversational');
  const [selectedPersona, setSelectedPersona] = useState(
    personas.find((p) => p.priority === 'P1')?.name ?? personas[0]?.name ?? ''
  );
  const [sequence, setSequence] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [previewStep, setPreviewStep] = useState<SequenceStep | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | undefined>(undefined);
  const [useLiveIntel, setUseLiveIntel] = useState(true);
  const [agentContext, setAgentContext] = useState<Pick<AgentActionResult, 'provider' | 'summary' | 'nextActions' | 'freshness'> | null>(null);

  async function generateSequence() {
    setLoading(true);
    setSequence([]);
    try {
      const res = await fetch('/api/ai/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, personaName: selectedPersona, campaignSlug, tone, useLiveIntel }),
      });
      const json = await readApiResponse<{ sequence?: SequenceStep[]; error?: string; agentContext?: Pick<AgentActionResult, 'provider' | 'summary' | 'nextActions' | 'freshness'> }>(res);
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      if (!json.sequence) throw new Error('No sequence returned');
      setSequence(json.sequence.map((s) => ({ ...s, status: 'draft' as const })));
      setExpandedStep(json.sequence[0]?.step ?? null);
      setAgentContext(json.agentContext ?? null);
      toast.success(`${json.sequence.length}-step sequence generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sequence generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function sendStep(step: SequenceStep) {
    if (!selectedPersona) {
      toast.error('Select a persona first');
      return;
    }
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Enter a valid recipient email address');
      return;
    }

    // Show preview modal instead of sending immediately
    setPreviewStep(step);
    setPreviewOpen(true);
  }

  async function confirmAndSend() {
    if (!previewStep) return;

    setSending(previewStep.step);
    try {
      const toastId = toast.loading(`Sending ${STEP_LABELS[previewStep.step]}...`);

      // Send the email via API
      const emailRes = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: previewStep.subject,
          bodyHtml: previewStep.body,
          accountName,
          personaName: selectedPersona,
        }),
      });

      const emailData = await readApiResponse<{ remaining?: number; error?: string }>(emailRes);

      // Update rate limit display
      if (emailData.remaining !== undefined) {
        setRateLimitRemaining(emailData.remaining);
      }

      toast.dismiss(toastId);

      // Always mark as sent (we track the attempt)
      setSequence((prev) =>
        prev.map((s) => s.step === previewStep.step ? { ...s, status: 'sent' as const } : s)
      );

      if (emailRes.ok) {
        toast.success(`${STEP_LABELS[previewStep.step]} sent to ${recipientEmail} and logged`);
      } else {
        toast.error(emailData.error ?? 'Email send failed');
      }

      setPreviewOpen(false);
      setPreviewStep(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(null);
    }
  }

  function copyStep(step: SequenceStep) {
    navigator.clipboard.writeText(`Subject: ${step.subject}\n\n${step.body}`);
    toast.success('Copied to clipboard');
  }

  function updateStepBody(stepName: string, newBody: string) {
    setSequence((prev) =>
      prev.map((s) => s.step === stepName ? { ...s, body: newBody } : s)
    );
  }

  function updateStepSubject(stepName: string, newSubject: string) {
    setSequence((prev) =>
      prev.map((s) => s.step === stepName ? { ...s, subject: newSubject } : s)
    );
  }

  function insertMicrositeLink(stepName: string) {
    if (!accountName.trim()) {
      toast.error('Account context is required to insert a microsite link');
      return;
    }

    const url = getMicrositeUrl(slugifyAccountName(accountName));
    const snippet = `Private brief: ${url}`;

    setSequence((prev) =>
      prev.map((s) =>
        s.step === stepName
          ? { ...s, body: s.body.includes(url) ? s.body : `${s.body.trim()}\n\n${snippet}` }
          : s,
      ),
    );
    toast.success('Microsite link inserted');
  }

  // Shared content for both dialog and inline modes
  const content = (
    <>
      {/* Controls */}
      <div className={`space-y-3 ${variant === 'dialog' ? 'px-6 py-4 border-b' : 'px-4 py-4 border-b bg-muted/20'} shrink-0`}>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Persona</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between truncate" size="sm">
                  {selectedPersona || 'Select...'}
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {personas.map((p) => (
                  <DropdownMenuItem key={p.name} onSelect={() => setSelectedPersona(p.name)}>
                    {p.name} ({p.priority})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tone</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  {TONE_LABELS[tone]}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                  <DropdownMenuItem key={t} onSelect={() => setTone(t)}>
                    {TONE_LABELS[t]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">&nbsp;</Label>
            <Button onClick={generateSequence} disabled={loading || !selectedPersona} className="w-full gap-2" size="sm">
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {sequence.length > 0 ? 'Regenerate' : 'Generate'}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Recipient Email</Label>
          <Input
            type="email"
            placeholder="name@company.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={useLiveIntel} onChange={(event) => setUseLiveIntel(event.target.checked)} />
          Use latest live intel
        </label>
        {agentContext ? (
          <div className="rounded-lg border bg-background p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Context used</span>
              <span className="rounded bg-muted px-2 py-0.5 font-mono">{agentContext.provider}</span>
              <span className="rounded bg-muted px-2 py-0.5 font-mono">{agentContext.freshness.source}</span>
            </div>
            <p className="mt-2">{agentContext.summary}</p>
          </div>
        ) : null}
      </div>

      {/* Sequence Timeline */}
      <div className={`flex-1 overflow-auto space-y-3 ${variant === 'dialog' ? 'px-6 py-4' : 'px-4 py-4'}`}>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse py-16 justify-center">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating 4-step sequence with Gemini...
          </div>
        )}

        {!loading && sequence.length === 0 && (
          <div className="flex flex-col items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-md py-16 gap-2">
            <Zap className="h-8 w-8 text-muted-foreground/50" />
            <p>Select a persona, choose tone, then generate</p>
            <p className="text-xs">Creates a 4-step cadence: Initial → Follow-up #1 → Follow-up #2 → Breakup</p>
          </div>
        )}

        {!loading && sequence.map((step) => {
          const Icon = STEP_ICONS[step.step] ?? Mail;
          const isExpanded = expandedStep === step.step;
          const isSending = sending === step.step;
          return (
            <Card key={step.step} className={`transition-all ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}>
              <CardContent className="p-0">
                {/* Step Header */}
                <button
                  type="button"
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{STEP_LABELS[step.step]}</p>
                      <p className="text-xs text-muted-foreground">Day {step.dayOffset} · {step.subject || 'Pending'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_STYLES[step.status ?? 'draft']} variant="secondary">
                      {step.status === 'sent' && <Check className="h-3 w-3 mr-1" />}
                      {step.status === 'draft' && <Clock className="h-3 w-3 mr-1" />}
                      {step.status ?? 'draft'}
                    </Badge>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t space-y-3">
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Subject</p>
                      <Input
                        value={step.subject}
                        onChange={(e) => updateStepSubject(step.step, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Body</p>
                      <textarea
                        className="w-full min-h-[120px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        value={step.body}
                        onChange={(e) => updateStepBody(step.step, e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => sendStep(step)}
                        disabled={isSending || step.status === 'sent'}
                        className="gap-1.5"
                      >
                        {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {step.status === 'sent' ? 'Sent' : 'Send & Log'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyStep(step)} className="gap-1.5">
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => insertMicrositeLink(step.step)} className="gap-1.5">
                        <Link2 className="h-3.5 w-3.5" /> Insert Link
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Bar */}
      {sequence.length > 0 && (
        <div className={`border-t shrink-0 flex items-center justify-between text-xs text-muted-foreground ${variant === 'dialog' ? 'px-6 py-3' : 'px-4 py-3 bg-muted/20'}`}>
          <span>{sequence.filter((s) => s.status === 'sent').length}/{sequence.length} steps sent</span>
          <span>Target: {selectedPersona}</span>
        </div>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <>
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
          {content}
        </div>
        {previewStep && (
          <EmailPreviewModal
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            subject={previewStep.subject}
            body={previewStep.body}
            recipientEmail={recipientEmail}
            onConfirm={confirmAndSend}
            isLoading={sending === previewStep.step}
            rateLimitRemaining={rateLimitRemaining}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Outreach Sequence
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Outreach Sequence — {accountName}
            </DialogTitle>
          </DialogHeader>

          {content}
        </DialogContent>
      </Dialog>
      {previewStep && (
        <EmailPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          subject={previewStep.subject}
          body={previewStep.body}
          recipientEmail={recipientEmail}
          onConfirm={confirmAndSend}
          isLoading={sending === previewStep.step}
        />
      )}
    </>
  );
}
