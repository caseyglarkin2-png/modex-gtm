'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, Sparkles, Eye, Pencil } from 'lucide-react';
import { GeneratorDialog } from '@/components/ai/generator-dialog';
import { VoicePreviewButton } from '@/components/voice-preview-button';
import { readApiResponse } from '@/lib/api-response';

function buildEmailPreviewHtml(bodyText: string, accountName: string): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px;">')
    .replace(/\n/g, '<br />');

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#ffffff;padding:16px 8px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:20px 16px 16px;color:#1a1a1a;font-size:13px;line-height:1.75;letter-spacing:-0.01em;">
        <p style="margin:0 0 12px;">${escaped}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 16px 20px;">
        <table cellpadding="0" cellspacing="0" style="border-top:1px solid #e0e0e0;width:100%;">
          <tr>
            <td style="padding-top:12px;">
              <p style="margin:0 0 2px;font-size:12px;font-weight:600;color:#1a1a1a;">Casey Larkin</p>
              <p style="margin:0 0 8px;font-size:11px;color:#6b7280;">GTM Lead · <span style="color:#0e7490;font-weight:600;">Yard</span><span style="font-weight:600;color:#1a1a1a;">Flow</span> by FreightRoll</p>
              <p style="margin:0 0 8px;font-size:10px;color:#9ca3af;font-style:italic;">The First Yard Network System — deterministic throughput across every facility.</p>
              <p style="margin:0;font-size:10px;">
                <span style="color:#0e7490;font-weight:500;">yardflow.ai</span>
                <span style="color:#d1d5db;margin:0 4px;">|</span>
                <span style="color:#0e7490;font-weight:500;">Run ROI</span>
                <span style="color:#d1d5db;margin:0 4px;">|</span>
                <span style="color:#0e7490;font-weight:500;">Book a Network Audit</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

interface EmailComposerProps {
  accountName: string;
  personaName?: string;
  personaEmail?: string;
  trigger?: React.ReactNode;
}

export function EmailComposer({ accountName, personaName, personaEmail, trigger }: EmailComposerProps) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(personaEmail ?? '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  function handleAIDraft(content: string) {
    setBody(content);
    if (!subject) {
      setSubject(`built this with ${accountName} in mind`);
    }
  }

  async function handleSend() {
    if (!to || !subject || !body) {
      toast.error('Fill in To, Subject, and Body');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc: cc || undefined,
          subject,
          bodyHtml: body,
          accountName,
          personaName,
        }),
      });
      const data = await readApiResponse<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error ?? 'Send failed');
      }
      toast.success(`Email sent to ${to}`);
      setOpen(false);
      setTo(personaEmail ?? '');
      setCc('');
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Email send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Compose Email
            {personaName && (
              <span className="text-sm font-normal text-muted-foreground">· {personaName}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input placeholder="email@company.com" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CC (optional)</Label>
            <Input placeholder="cc@company.com" value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Input placeholder="Subject line" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Body</Label>
              <div className="flex items-center gap-1">
                <GeneratorDialog
                  accountName={accountName}
                  personaName={personaName}
                  defaultType="email"
                  onUseContent={handleAIDraft}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-violet-500 hover:text-violet-600">
                      <Sparkles className="h-3 w-3" /> AI Draft
                    </Button>
                  }
                />
                {body.trim() && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${!previewMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      <Pencil className="h-2.5 w-2.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(true)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${previewMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      <Eye className="h-2.5 w-2.5" /> Preview
                    </button>
                  </>
                )}
              </div>
            </div>
            {previewMode && body.trim() ? (
              <div
                className="w-full min-h-[200px] rounded-md border border-input overflow-hidden"
                dangerouslySetInnerHTML={{ __html: buildEmailPreviewHtml(body, accountName) }}
              />
            ) : (
              <textarea
                className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Write your email or click AI Draft above..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {body.trim() && <VoicePreviewButton text={body} label="Listen" />}
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
