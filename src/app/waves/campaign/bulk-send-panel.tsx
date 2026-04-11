'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, CheckCircle, XCircle, Zap, Users, Link2 } from 'lucide-react';
import { getMicrositeUrl } from '@/lib/site-url';

interface Recipient {
  accountName: string;
  personaName: string;
  email: string;
  priority: string;
  title?: string;
}

interface BulkSendPanelProps {
  recipients: Recipient[];
}

function slugifyAccountName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function BulkSendPanel({ recipients }: BulkSendPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const validRecipients = recipients.filter((r) => r.email && r.email !== 'N/A');

  const toggleRecipient = useCallback((email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }, []);

  const selectAll = useCallback((priority?: string) => {
    const targets = priority
      ? validRecipients.filter((r) => r.priority === priority)
      : validRecipients;
    setSelected(new Set(targets.map((r) => r.email)));
  }, [validRecipients]);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  function insertMicrositeLink() {
    const anchorAccount = validRecipients.find((recipient) => selected.has(recipient.email))?.accountName ?? validRecipients[0]?.accountName;
    if (!anchorAccount) {
      toast.error('Select a recipient first');
      return;
    }

    const url = getMicrositeUrl(slugifyAccountName(anchorAccount));
    const snippet = `Private brief: ${url}`;
    setBodyHtml((current) => (current.includes(url) ? current : `${current.trim()}\n\n${snippet}`.trim()));
    toast.success('Microsite link inserted');
  }

  async function generateForSelected() {
    if (selected.size === 0) { toast.error('Select at least one recipient'); return; }
    setGenerating(true);
    try {
      const firstRecipient = validRecipients.find((r) => selected.has(r.email));
      if (!firstRecipient) return;
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          accountName: firstRecipient.accountName,
          personaName: firstRecipient.personaName,
          tone: 'provocative',
          length: 'short',
        }),
      });
      const json = await res.json() as { content?: string };
      if (json.content) {
        setBodyHtml(json.content);
        setSubject('the yard is the constraint');
        toast.success('Draft generated — edit before sending');
      }
    } catch {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function sendBulk() {
    if (selected.size === 0) { toast.error('Select recipients'); return; }
    if (!subject.trim()) { toast.error('Subject required'); return; }
    if (!bodyHtml.trim()) { toast.error('Body required'); return; }

    setSending(true);
    setResult(null);
    try {
      const selectedRecipients = validRecipients
        .filter((r) => selected.has(r.email))
        .map((r) => ({ to: r.email, personaName: r.personaName, accountName: r.accountName }));

      const res = await fetch('/api/email/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedRecipients,
          subject,
          bodyHtml,
          accountName: 'Wave 1 Batch',
        }),
      });
      const json = await res.json() as { sent: number; failed: number };
      setResult(json);
      if (json.sent > 0) {
        toast.success(`${json.sent} emails sent${json.failed > 0 ? `, ${json.failed} failed` : ''}`);
      } else {
        toast.error(`Send failed: ${json.failed} failures`);
      }
    } catch {
      toast.error('Bulk send failed');
    } finally {
      setSending(false);
    }
  }

  const selectedCount = selected.size;
  const p1Count = validRecipients.filter((r) => r.priority === 'P1').length;
  const p2Count = validRecipients.filter((r) => r.priority === 'P2').length;

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            Bulk Send — Wave 1
            {selectedCount > 0 && (
              <Badge className="bg-emerald-500/15 text-emerald-700">{selectedCount} selected</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => selectAll('P1')}>
              All P1s ({p1Count})
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => selectAll('P2')}>
              All P2s ({p2Count})
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => selectAll()}>
              All ({validRecipients.length})
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipient grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
          {validRecipients.map((r) => (
            <button
              key={r.email}
              type="button"
              onClick={() => toggleRecipient(r.email)}
              className={`text-left text-xs rounded-md border p-2 transition-colors ${
                selected.has(r.email)
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
              }`}
            >
              <p className="font-medium truncate">{r.personaName}</p>
              <p className="text-[var(--muted-foreground)] truncate">{r.accountName}</p>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="secondary" className="text-[9px]">{r.priority}</Badge>
                {selected.has(r.email) && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              </div>
            </button>
          ))}
        </div>

        {/* Subject + Body */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={generateForSelected}
              disabled={generating || selectedCount === 0}
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              AI Draft
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={insertMicrositeLink}>
              <Link2 className="h-3 w-3" /> Insert Link
            </Button>
          </div>
          <textarea
            placeholder="Email body — paste, type, or generate with AI Draft above"
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
          />
        </div>

        {/* Send button + result */}
        <div className="flex items-center gap-3">
          <Button
            onClick={sendBulk}
            disabled={sending || selectedCount === 0 || !subject.trim() || !bodyHtml.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to {selectedCount} recipient{selectedCount !== 1 ? 's' : ''}
          </Button>
          {result && (
            <div className="flex items-center gap-2 text-sm">
              {result.sent > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-4 w-4" /> {result.sent} sent
                </span>
              )}
              {result.failed > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" /> {result.failed} failed
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
