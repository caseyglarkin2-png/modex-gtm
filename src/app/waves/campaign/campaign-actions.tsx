'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Copy, Send, RefreshCw, ExternalLink, CheckCircle, Pencil, X, Check, ChevronDown, ChevronUp, MessageSquare, Phone, FileText, Sparkles } from 'lucide-react';
import { GeneratorDialog } from '@/components/ai/generator-dialog';
import { VoiceScriptButton } from '@/components/voice-script-button';
import { VoicePreviewButton } from '@/components/voice-preview-button';

interface SequenceStep {
  step: string;
  subject: string;
  body: string;
  dayOffset: number;
  sent?: boolean;
}

const STEP_LABELS: Record<string, string> = {
  initial_email: 'Day 0 — Initial',
  follow_up_1: 'Day 3 — Follow-up',
  follow_up_2: 'Day 9 — Variance Tax',
  breakup: 'Day 16 — Breakup',
};

const STEP_BADGE_STYLES: Record<string, string> = {
  initial_email: 'bg-blue-500/15 text-blue-700',
  follow_up_1: 'bg-amber-500/15 text-amber-700',
  follow_up_2: 'bg-violet-500/15 text-violet-700',
  breakup: 'bg-neutral-500/15 text-neutral-700',
};

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
  const [sequence, setSequence] = useState<SequenceStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto';
      bodyRef.current.style.height = bodyRef.current.scrollHeight + 'px';
    }
  }, [editBody, editingStep]);

  async function generateFullSequence() {
    setLoading(true);
    setSequence([]);
    setExpandedStep(null);
    try {
      const res = await fetch('/api/ai/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          personaName,
          tone: 'provocative',
        }),
      });
      const json = await res.json() as { sequence?: Array<{ step: string; subject: string; body: string; dayOffset: number }> };
      if (!res.ok || !json.sequence?.length) throw new Error('Generation failed');
      setSequence(json.sequence.map(s => ({ ...s, sent: false })));
      setExpandedStep(json.sequence[0].step);
      toast.success(`${json.sequence.length}-step sequence generated. Review each step.`);
    } catch {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(step: SequenceStep) {
    setEditingStep(step.step);
    setEditSubject(step.subject);
    setEditBody(step.body);
  }

  function saveEdit(stepName: string) {
    setSequence(prev => prev.map(s =>
      s.step === stepName ? { ...s, subject: editSubject, body: editBody } : s
    ));
    setEditingStep(null);
    toast.success('Saved.');
  }

  function cancelEdit() {
    setEditingStep(null);
  }

  async function sendStep(step: SequenceStep) {
    if (!personaEmail) { toast.error('No email address'); return; }
    setSending(step.step);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: personaEmail,
          subject: step.subject || subjectLine,
          bodyHtml: step.body,
          accountName,
          personaName,
        }),
      });
      if (res.ok) {
        setSequence(prev => prev.map(s =>
          s.step === step.step ? { ...s, sent: true } : s
        ));
        toast.success(`Sent to ${personaEmail}.`);
      } else {
        toast.error('Send failed');
      }
    } catch {
      toast.error('Send failed');
    } finally {
      setSending(null);
    }
  }

  function copyStep(step: SequenceStep) {
    navigator.clipboard.writeText(`Subject: ${step.subject}\n\n${step.body}`);
    toast.success('Copied');
  }

  return (
    <div className="space-y-2 pt-1">
      {/* Action buttons row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={generateFullSequence} disabled={loading}>
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          {sequence.length ? 'Regen Sequence' : 'Generate Sequence'}
        </Button>

        {/* LinkedIn DM */}
        <GeneratorDialog
          accountName={accountName}
          personaName={personaName}
          defaultType="dm"
          trigger={
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
              <MessageSquare className="h-3 w-3" /> DM
            </Button>
          }
        />

        {/* Call Script */}
        <GeneratorDialog
          accountName={accountName}
          personaName={personaName}
          defaultType="call_script"
          trigger={
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
              <Phone className="h-3 w-3" /> Call
            </Button>
          }
        />

        {/* Quick Voice Rehearsal */}
        <VoiceScriptButton accountName={accountName} personaName={personaName} className="h-7 text-[11px]" />

        {/* Meeting Prep */}
        <GeneratorDialog
          accountName={accountName}
          personaName={personaName}
          defaultType="meeting_prep"
          trigger={
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
              <FileText className="h-3 w-3" /> Prep
            </Button>
          }
        />

        {auditUrl && (
          <a href={auditUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-cyan-600">
              <ExternalLink className="h-3 w-3" /> Audit
            </Button>
          </a>
        )}
      </div>

      {/* Full 4-step sequence display */}
      {sequence.length > 0 && (
        <div className="space-y-1.5">
          {sequence.map((step) => {
            const isExpanded = expandedStep === step.step;
            const isEditing = editingStep === step.step;

            return (
              <div key={step.step} className="rounded-lg border text-xs">
                {/* Step header — always visible */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--muted)]/30 transition-colors"
                  onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                >
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${STEP_BADGE_STYLES[step.step] ?? ''}`}>
                      {STEP_LABELS[step.step] ?? step.step}
                    </Badge>
                    <span className="text-[var(--muted-foreground)] truncate max-w-[200px]">
                      {step.subject || 'No subject'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {step.sent && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                        <CheckCircle className="h-3 w-3" /> Sent
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                </button>

                {/* Step body — expanded */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t">
                    {isEditing ? (
                      <div className="space-y-2 pt-2">
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
                            rows={5}
                            className="mt-0.5 w-full rounded border bg-[var(--background)] px-2 py-1.5 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => { saveEdit(step.step); sendStep({ ...step, subject: editSubject, body: editBody }); }} disabled={sending === step.step || !personaEmail}>
                            {sending === step.step ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Approve & Send
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => saveEdit(step.step)}>
                            <Check className="h-3 w-3" /> Save
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={cancelEdit}>
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 space-y-2">
                        <div>
                          <p className="font-medium text-[var(--foreground)] text-[10px]">Subject: {step.subject}</p>
                          <p className="mt-1 whitespace-pre-line text-[var(--muted-foreground)] leading-relaxed">{step.body}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!step.sent && (
                            <>
                              <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => sendStep(step)} disabled={sending === step.step || !personaEmail}>
                                {sending === step.step ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                Send
                              </Button>
                              <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => startEdit(step)}>
                                <Pencil className="h-3 w-3" /> Edit
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => copyStep(step)}>
                            <Copy className="h-3 w-3" /> Copy
                          </Button>
                          <VoicePreviewButton text={step.body} label="Listen" className="h-6 text-[10px]" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
