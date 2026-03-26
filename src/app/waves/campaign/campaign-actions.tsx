'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Zap, Copy, Send, RefreshCw, ExternalLink, CheckCircle, Pencil, X, Check } from 'lucide-react';

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
  const [sent, setSent] = useState(false);
  const [generatedBody, setGeneratedBody] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto';
      bodyRef.current.style.height = bodyRef.current.scrollHeight + 'px';
    }
  }, [editBody, editing]);

  async function generate() {
    setLoading(true);
    setSent(false);
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
      // Auto-open edit mode so user can review/tweak
      setEditSubject(step1.subject);
      setEditBody(step1.body);
      setEditing(true);
      toast.success('Generated. Review it. Fix what needs fixing.');
    } catch {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function confirmEdit() {
    setGeneratedSubject(editSubject);
    setGeneratedBody(editBody);
    setEditing(false);
    toast.success('Saved. Ready to send.');
  }

  function cancelEdit() {
    setEditSubject(generatedSubject);
    setEditBody(generatedBody);
    setEditing(false);
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
        toast.success(`Sent to ${personaEmail}. Move to the next one.`);
        setSent(true);
        setEditing(false);
      } else {
        toast.error('Send failed — check logs');
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
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5">
        {sent && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle className="h-3 w-3" /> Sent
          </span>
        )}
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={generate} disabled={loading}>
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          {generatedBody ? 'Regen' : 'Generate'}
        </Button>
        {generatedBody && !editing && !sent && (
          <>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => { setEditSubject(generatedSubject); setEditBody(generatedBody); setEditing(true); }}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
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

      {/* Inline preview/edit panel */}
      {editing && (
        <div className="rounded-lg border bg-[var(--muted)]/30 p-3 space-y-2 text-xs">
          <div>
            <label className="font-medium text-[var(--muted-foreground)] text-[10px] uppercase tracking-wide">Subject</label>
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="mt-0.5 w-full rounded border bg-[var(--background)] px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="font-medium text-[var(--muted-foreground)] text-[10px] uppercase tracking-wide">Body</label>
            <textarea
              ref={bodyRef}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              className="mt-0.5 w-full rounded border bg-[var(--background)] px-2 py-1.5 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Button size="sm" className="h-7 text-[11px] gap-1" onClick={sendEmail} disabled={sending || !personaEmail}>
              {sending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Approve & Send
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={confirmEdit}>
              <Check className="h-3 w-3" /> Save Edits
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={cancelEdit}>
              <X className="h-3 w-3" /> Cancel
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={copyEmail}>
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </div>
        </div>
      )}

      {/* Read-only preview when not editing and content exists */}
      {generatedBody && !editing && !sent && (
        <div className="rounded-lg border p-2 text-xs text-[var(--muted-foreground)] max-h-24 overflow-y-auto cursor-pointer hover:bg-[var(--muted)]/30 transition-colors" onClick={() => { setEditSubject(generatedSubject); setEditBody(generatedBody); setEditing(true); }}>
          <p className="font-medium text-[var(--foreground)] text-[10px]">Subject: {generatedSubject}</p>
          <p className="mt-1 line-clamp-3 whitespace-pre-line">{generatedBody}</p>
        </div>
      )}
    </div>
  );
}
