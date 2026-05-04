'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, ExternalLink, Loader2, Rocket, Send, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface WizardPersona {
  name: string;
  title?: string | null;
  email?: string | null;
  priority?: string;
}

interface WizardCampaign {
  slug: string;
  name: string;
  messagingAngle?: string | null;
  campaignType?: string | null;
}

interface OutreachWizardProps {
  accountName: string;
  micrositeUrl: string;
  personas: WizardPersona[];
  campaigns?: WizardCampaign[];
  trigger?: React.ReactNode;
}

export function OutreachWizard({ accountName, micrositeUrl, personas, campaigns = [], trigger }: OutreachWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedCampaignSlug, setSelectedCampaignSlug] = useState(campaigns[0]?.slug ?? '');
  const [subject, setSubject] = useState(`Quick idea for ${accountName}`);
  const [body, setBody] = useState(
    `I put together a short private brief for ${accountName}.\n\nPrivate brief: ${micrositeUrl}\n\nWorth a quick look?\n\nCasey`,
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const eligiblePersonas = useMemo(
    () => personas.filter((persona) => persona.email && persona.email.includes('@')),
    [personas],
  );

  const selectedPersonas = useMemo(
    () => eligiblePersonas.filter((persona) => selected.includes(persona.email ?? '')),
    [eligiblePersonas, selected],
  );

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.slug === selectedCampaignSlug),
    [campaigns, selectedCampaignSlug],
  );

  function toggleEmail(email: string) {
    setSelected((current) =>
      current.includes(email) ? current.filter((item) => item !== email) : [...current, email],
    );
  }

  async function generateDraft() {
    const lead = selectedPersonas[0];
    if (!lead) {
      toast.error('Select at least one persona first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          accountName,
          personaName: lead.name,
          campaignSlug: selectedCampaignSlug || undefined,
          tone: 'conversational',
          length: 'short',
          useLiveIntel: true,
        }),
      });
      const json = (await res.json()) as { content?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Draft generation failed');

      const nextBody = json.content?.includes(micrositeUrl)
        ? json.content
        : `${json.content?.trim() ?? ''}\n\nPrivate brief: ${micrositeUrl}`;

      setBody(nextBody.trim());
      toast.success('Draft generated. Edit before sending.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Draft generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function sendSelected() {
    if (selectedPersonas.length === 0) {
      toast.error('Select at least one recipient');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/email/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedPersonas.map((persona) => ({
            to: persona.email,
            personaName: persona.name,
            accountName,
          })),
          subject,
          bodyHtml: body,
          accountName,
        }),
      });

      const json = (await res.json()) as { sent?: number; failed?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Bulk send failed');

      toast.success(`${json.sent ?? 0} emails sent${json.failed ? `, ${json.failed} failed` : ''}`);
      setStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk send failed');
    } finally {
      setSending(false);
    }
  }

  const progressLabels = ['Select', 'Brief', 'Compose', 'Send'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700">
            <Rocket className="h-3.5 w-3.5" /> Launch Outreach
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-cyan-600" /> Launch Outreach
          </DialogTitle>
          <DialogDescription>
            Select recipients, verify the microsite, edit the message, and send from one flow.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 pb-2">
          {progressLabels.map((label, index) => {
            const active = step >= index + 1;
            return (
              <Badge key={label} variant={active ? 'default' : 'outline'}>
                {index + 1}. {label}
              </Badge>
            );
          })}
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                {eligiblePersonas.length} mailable personas found for {accountName}.
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {eligiblePersonas.map((persona) => {
                  const checked = selected.includes(persona.email ?? '');
                  return (
                    <label key={persona.email} className={`flex items-start gap-3 rounded-lg border p-3 ${checked ? 'border-cyan-500 bg-cyan-500/5' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => persona.email && toggleEmail(persona.email)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{persona.name}</p>
                        <p className="text-xs text-muted-foreground">{persona.title || 'No title'} · {persona.email}</p>
                      </div>
                      {persona.priority ? <Badge variant="outline">{persona.priority}</Badge> : null}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {campaigns.length > 0 ? (
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium">Campaign context</p>
                  <select
                    value={selectedCampaignSlug}
                    onChange={(event) => setSelectedCampaignSlug(event.target.value)}
                    className="flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm"
                  >
                    {campaigns.map((campaign) => (
                      <option key={campaign.slug} value={campaign.slug}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                  {selectedCampaign?.messagingAngle ? (
                    <p className="text-sm text-muted-foreground">{selectedCampaign.messagingAngle}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Private microsite brief</p>
                <a href={micrositeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-cyan-600 hover:underline">
                  {micrositeUrl} <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use this link in the first touch. It keeps the CTA soft and account-specific.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
                <Button variant="outline" onClick={generateDraft} disabled={loading || selectedPersonas.length === 0} className="gap-1.5">
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Draft
                </Button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Ready to send</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPersonas.length} recipient{selectedPersonas.length === 1 ? '' : 's'} selected.
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {selectedPersonas.map((persona) => (
                    <li key={persona.email} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{persona.name}</span>
                      <span className="text-muted-foreground">{persona.email}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || sending}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button onClick={() => setStep((current) => Math.min(4, current + 1))} disabled={(step === 1 && selectedPersonas.length === 0) || sending} className="gap-1.5">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button onClick={sendSelected} disabled={sending || selectedPersonas.length === 0} className="gap-1.5">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
