'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OutreachSequenceDialog } from '@/components/ai/outreach-sequence';
import { FileImage, Zap } from 'lucide-react';

interface CampaignToolbarProps {
  accountName: string;
  personas: Array<{ name: string; title?: string; priority: string }>;
}

export function CampaignToolbar({ accountName, personas }: CampaignToolbarProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" asChild>
        <Link href={`/generated-content?account=${encodeURIComponent(accountName)}`}>
          <FileImage className="h-3 w-3" /> One-Pager
        </Link>
      </Button>
      <OutreachSequenceDialog
        accountName={accountName}
        personas={personas}
        trigger={
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
            <Zap className="h-3 w-3" /> Full Sequence
          </Button>
        }
      />
    </div>
  );
}
