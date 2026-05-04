'use client';

import { useMemo } from 'react';
import { Columns2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { buildSideBySideDiff } from '@/lib/revops/engagement-learning';

type ContentDiffDialogProps = {
  accountName: string;
  oldVersion: number;
  oldContent: string;
  newVersion: number;
  newContent: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function ContentDiffDialog({
  accountName,
  oldVersion,
  oldContent,
  newVersion,
  newContent,
  open,
  onOpenChange,
  trigger,
}: ContentDiffDialogProps) {
  const rows = useMemo(() => buildSideBySideDiff(oldContent, newContent), [newContent, oldContent]);
  const dialogTrigger = trigger === undefined
    ? (
      <Button variant="outline" size="sm">
        <Columns2 className="mr-1.5 h-3.5 w-3.5" />
        Diff v{oldVersion} to v{newVersion}
      </Button>
    )
    : trigger;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogTrigger ? (
        <DialogTrigger asChild>
          {dialogTrigger}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-screen max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{accountName} content diff</DialogTitle>
          <DialogDescription>
            Side-by-side comparison between v{oldVersion} and v{newVersion}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
            <p className="rounded-md border px-2 py-1">v{oldVersion}</p>
            <p className="rounded-md border px-2 py-1">v{newVersion}</p>
          </div>
          <div className="max-h-[60vh] overflow-auto rounded-md border">
            {rows.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No diff rows available.</p>
            ) : (
              rows.map((row, index) => (
                <div key={`${index}-${row.oldLine.slice(0, 8)}-${row.newLine.slice(0, 8)}`} className="grid grid-cols-2 gap-2 border-t p-2 text-xs first:border-t-0">
                  <p className={row.changed ? 'rounded-sm bg-amber-50 p-1' : 'p-1'}>{row.oldLine || <span className="text-muted-foreground">[empty]</span>}</p>
                  <p className={row.changed ? 'rounded-sm bg-emerald-50 p-1' : 'p-1'}>{row.newLine || <span className="text-muted-foreground">[empty]</span>}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
