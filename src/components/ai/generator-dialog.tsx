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
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Copy, RefreshCw, ChevronDown } from 'lucide-react';
import type { GenerateContentInput } from '@/lib/validations';

type ContentType = GenerateContentInput['type'];
type Tone = GenerateContentInput['tone'];
type Length = GenerateContentInput['length'];

interface GeneratorDialogProps {
  accountName: string;
  personaName?: string;
  defaultType?: ContentType;
  onUseContent?: (content: string, type: ContentType) => void;
  trigger?: React.ReactNode;
}

const TYPE_LABELS: Record<ContentType, string> = {
  email: 'Cold Email',
  dm: 'LinkedIn DM',
  call_script: 'Call Script',
  meeting_prep: 'Meeting Prep',
  infographic: 'Infographic Brief',
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

  async function generate() {
    setLoading(true);
    setContent('');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, accountName, personaName, tone, length }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err = data as { error?: string };
        throw new Error(err.error ?? 'Generation failed');
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

        {/* Output */}
        <div className="flex-1 overflow-auto px-6 py-4 min-h-[200px]">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating with Gemini...
            </div>
          )}
          {!loading && content && (
            <textarea
              className="w-full h-full min-h-[200px] bg-muted/30 rounded-md p-3 text-sm font-mono resize-none border-0 focus:outline-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
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
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                {onUseContent && (
                  <Button size="sm" onClick={handleUse}>
                    Use as Draft
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
