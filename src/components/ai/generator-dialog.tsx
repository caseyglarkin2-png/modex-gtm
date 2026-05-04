'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Copy, RefreshCw, ChevronDown, Eye, Pencil, Send, Mail } from 'lucide-react';
import { VoicePreviewButton } from '@/components/voice-preview-button';
import { Input } from '@/components/ui/input';
import type { GenerateContentInput } from '@/lib/validations';
import { readApiResponse } from '@/lib/api-response';

type ContentType = Exclude<GenerateContentInput['type'], 'infographic'>;
type Tone = GenerateContentInput['tone'];
type Length = GenerateContentInput['length'];

interface GeneratorDialogProps {
  accountName: string;
  personaName?: string;
  personaEmail?: string;
  campaignSlug?: string;
  defaultType?: ContentType;
  onUseContent?: (content: string, type: ContentType) => void;
  trigger?: React.ReactNode;
}

const TYPE_LABELS: Record<ContentType, string> = {
  email: 'Cold Email',
  follow_up: 'Follow-Up Email',
  dm: 'LinkedIn DM',
  call_script: 'Call Script',
  meeting_prep: 'Meeting Prep',
};

const TONE_LABELS: Record<Tone, string> = {
  formal: 'Professional',
  conversational: 'Casual',
  provocative: 'Bold',
};

const LENGTH_LABELS: Record<Length, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
};

export function GeneratorDialog({
  accountName,
  personaName,
  personaEmail,
  campaignSlug,
  defaultType = 'email',
  onUseContent,
  trigger,
}: GeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>(defaultType);
  const [tone, setTone] = useState<Tone>('conversational');
  const [length, setLength] = useState<Length>('medium');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [sendEmail, setSendEmail] = useState(personaEmail ?? '');
  const [sending, setSending] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [playbookBlocks, setPlaybookBlocks] = useState<Array<{ id: string; title: string; body: string; tags: string[] }>>([]);
  const [selectedPlaybookIds, setSelectedPlaybookIds] = useState<Record<string, boolean>>({});

  const isSendable = type === 'email' || type === 'follow_up';

  useEffect(() => {
    if (open) {
      setSendEmail(personaEmail ?? '');
      fetch(`/api/revops/playbook-blocks?accountName=${encodeURIComponent(accountName)}${personaName ? `&persona=${encodeURIComponent(personaName)}` : ''}`)
        .then(async (res) => {
          if (!res.ok) return [] as Array<{ id: string; title: string; body: string; tags: string[] }>;
          const payload = await res.json() as { blocks?: Array<{ id: string; title: string; body: string; tags: string[] }> };
          return payload.blocks ?? [];
        })
        .then((blocks) => setPlaybookBlocks(blocks.slice(0, 6)))
        .catch(() => setPlaybookBlocks([]));
    }
  }, [accountName, open, personaEmail, personaName]);

  async function generate() {
    setLoading(true);
    setContent('');
    try {
      const selectedBlocks = playbookBlocks.filter((block) => selectedPlaybookIds[block.id]);
      const playbookHints = selectedBlocks.map((block) => `${block.title}: ${block.body.slice(0, 400)}`).join('\n\n');
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          accountName,
          personaName,
          campaignSlug,
          tone,
          length,
          context: playbookHints
            ? { playbookHints }
            : undefined,
        }),
      });
      const data = await readApiResponse<{ content?: string; error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error ?? 'Generation failed');
      }
      const result = data as { content: string };
      setContent(result.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  }

  function handleUse() {
    if (onUseContent) {
      onUseContent(content, type);
      setOpen(false);
      toast.success('Content applied');
    }
  }

  async function handleSend() {
    if (!content.trim() || !sendEmail.trim()) return;
    setSending(true);
    try {
      // Extract subject from content (first line often is subject-like)
      const lines = content.trim().split('\n').filter(Boolean);
      const subjectLine = lines[0]?.replace(/^Subject:\s*/i, '').trim() ?? `built this with ${accountName} in mind`;
      const bodyText = lines[0]?.toLowerCase().startsWith('subject:') ? lines.slice(1).join('\n').trim() : content.trim();

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sendEmail.trim(),
          subject: subjectLine,
          bodyHtml: bodyText,
          accountName,
          personaName,
        }),
      });
      const json = await readApiResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error ?? 'Send failed');
      toast.success(`Email sent to ${sendEmail}`);
      setShowSendForm(false);
      setSendEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Draft
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Content Generator
            {personaName && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                · {personaName} @ {accountName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b">
          <div className="space-y-1">
            <Label className="text-xs">Content Type</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  {TYPE_LABELS[type]}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(TYPE_LABELS) as ContentType[]).map((t) => (
                  <DropdownMenuItem key={t} onSelect={() => setType(t)}>
                    {TYPE_LABELS[t]}
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
            <Label className="text-xs">Length</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  {LENGTH_LABELS[length]}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(LENGTH_LABELS) as Length[]).map((l) => (
                  <DropdownMenuItem key={l} onSelect={() => setLength(l)}>
                    {LENGTH_LABELS[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {playbookBlocks.length > 0 ? (
          <div className="px-6 py-3 border-b space-y-2">
            <p className="text-xs text-muted-foreground">Playbook Recommendations</p>
            <div className="flex flex-wrap gap-1.5">
              {playbookBlocks.map((block) => {
                const selected = selectedPlaybookIds[block.id] ?? false;
                return (
                  <button
                    key={block.id}
                    type="button"
                    className={`rounded border px-2 py-1 text-[11px] ${selected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    onClick={() => setSelectedPlaybookIds((prev) => ({ ...prev, [block.id]: !selected }))}
                    title={block.body.slice(0, 180)}
                  >
                    {block.title}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Output */}
        <div className="flex-1 overflow-auto px-6 py-4 min-h-[200px]">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse py-12 justify-center">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating with Gemini...
            </div>
          )}
          {!loading && content && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${previewMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${!previewMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>
              {previewMode ? (
                <div
                  className="rounded-md border bg-background p-4 text-sm leading-relaxed min-h-[200px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n\n/g, '</p><p style="margin:12px 0;">').replace(/\n/g, '<br />') }}
                />
              ) : (
                <textarea
                  className="w-full h-full min-h-[200px] bg-muted/30 rounded-md p-3 text-sm font-mono resize-none border-0 focus:outline-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
            </div>
          )}
          {!loading && !content && (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-md min-h-[200px]">
              Configure options above and click Generate
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <Button onClick={generate} disabled={loading} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {content ? 'Regenerate' : 'Generate'}
          </Button>
          <div className="flex gap-2">
            {content && (
              <>
                {['email', 'dm', 'call_script'].includes(type) && (
                  <VoicePreviewButton text={content} label="Listen" />
                )}
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                {onUseContent && (
                  <Button size="sm" onClick={handleUse}>
                    Use as Draft
                  </Button>
                )}
                {isSendable && (
                  <Button size="sm" onClick={() => setShowSendForm(!showSendForm)} className="gap-1.5">
                    <Mail className="h-4 w-4" />
                    Send
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Send form */}
        {showSendForm && isSendable && content && (
          <div className="px-6 py-3 border-t bg-muted/30 flex items-center gap-2">
            <Input
              type="email"
              placeholder="Recipient email..."
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || !sendEmail.trim()}
              className="gap-1.5 shrink-0"
            >
              {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
