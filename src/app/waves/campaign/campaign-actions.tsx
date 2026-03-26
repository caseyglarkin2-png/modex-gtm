'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Zap, Copy, Send, RefreshCw, ExternalLink } from 'lucide-react';

interface CampaignActionsProps {
  accountName: string;
  personaName: string;
  personaEmail: string;
  subjectLine: string;
  auditUrl?: string;
  calendarLink: string;
  whyNowHook: string;
  proofLine: string;
}

export function CampaignActions({
  accountName,
  personaName,
  personaEmail,
  subjectLine,
  auditUrl,
  calendarLink,
  whyNowHook,
  proofLine,
}: CampaignActionsProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedBody, setGeneratedBody] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState('');

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          personaName,
          tone: 'conversational',
        }),
      });
      const json = await res.json() as { sequence?: Array<{ step: string; subject: string; body: string }> };
      if (!res.ok || !json.sequence?.length) throw new Error('Generation failed');
      const step1 = json.sequence[0];
      setGeneratedSubject(step1.subject);
      setGeneratedBody(step1.body);
      toast.success('Step 1 email generated — review and send');
    } catch {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function sendEmail() {
    if (!personaEmail) { toast.error('No email address'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: personaEmail,
          subject: generatedSubject || subjectLine,
          bodyHtml: generatedBody,
          accountName,
          personaName,
        }),
      });
      if (res.ok) {
        toast.success(`Sent to ${personaEmail}`);
      } else {
        toast.success('Logged — delivery pending');
      }
    } catch {
      toast.error('Send failed');
    } finally {
      setSending(false);
    }
  }

  function copyEmail() {
    const text = `Subject: ${generatedSubject || subjectLine}\n\n${generatedBody || whyNowHook + '\n\n' + proofLine + (auditUrl ? '\n\n' + auditUrl : '')}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <div className="flex items-center gap-1.5 pt-1">
      <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={generate} disabled={loading}>
        {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
        {generatedBody ? 'Regen' : 'Generate'}
      </Button>
      {generatedBody && (
        <>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={copyEmail}>
            <Copy className="h-3 w-3" /> Copy
          </Button>
          <Button size="sm" className="h-7 text-[11px] gap-1" onClick={sendEmail} disabled={sending || !personaEmail}>
            {sending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send
          </Button>
        </>
      )}
      {auditUrl && (
        <a href={auditUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-cyan-600">
            <ExternalLink className="h-3 w-3" /> Audit
          </Button>
        </a>
      )}
    </div>
  );
}
