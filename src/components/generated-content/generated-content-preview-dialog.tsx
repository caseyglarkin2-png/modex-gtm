'use client';

import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';

type GeneratedContentPreviewDialogProps = {
  accountName: string;
  version: number;
  content: string;
  providerUsed?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

function sourceLabel(source: ReturnType<typeof resolveGeneratedContentRendering>['source']) {
  if (source === 'json_one_pager') return 'JSON one-pager';
  if (source === 'html') return 'HTML';
  if (source === 'json_invalid') return 'Malformed JSON';
  if (source === 'json_unknown') return 'JSON (raw)';
  return 'Plain text';
}

export function GeneratedContentPreviewDialog({
  accountName,
  version,
  content,
  providerUsed,
  open,
  onOpenChange,
  trigger,
}: GeneratedContentPreviewDialogProps) {
  const rendering = resolveGeneratedContentRendering(content, accountName);
  const dialogTrigger = trigger ?? (
    <Button variant="outline" size="sm">
      <Eye className="mr-1.5 h-3.5 w-3.5" />
      Preview
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="max-h-screen max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{accountName} • v{version}</DialogTitle>
          <DialogDescription>Preview the selected generated one-pager version.</DialogDescription>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Provider: {providerUsed ?? 'unknown'}</span>
            <Badge variant="outline">{sourceLabel(rendering.source)}</Badge>
          </div>
        </DialogHeader>
        <div className="rounded-md border bg-slate-50 p-4">
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: rendering.html }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
