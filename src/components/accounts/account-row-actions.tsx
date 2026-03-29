'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, FileText, Mail, Send, ExternalLink, Copy, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AccountRowActionsProps {
  account: {
    name: string;
    slug: string;
  };
  onGenerateOnePager?: (accountName: string) => void;
  onGenerateSequence?: (accountName: string) => void;
  onSendEmail?: (accountName: string) => void;
}

export function AccountRowActions({
  account,
  onGenerateOnePager,
  onGenerateSequence,
  onSendEmail,
}: AccountRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleCopyLink() {
    const url = `${window.location.origin}/accounts/${account.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Account link copied to clipboard');
    setOpen(false);
  }

  function handleViewDetails() {
    router.push(`/accounts/${account.slug}`);
    setOpen(false);
  }

  function handleGenerateOnePager() {
    if (onGenerateOnePager) {
      onGenerateOnePager(account.name);
    } else {
      // Fallback: navigate to studio with query param
      router.push(`/studio?tab=one-pager&account=${encodeURIComponent(account.name)}`);
    }
    setOpen(false);
  }

  function handleGenerateSequence() {
    if (onGenerateSequence) {
      onGenerateSequence(account.name);
    } else {
      // Fallback: navigate to studio with query param
      router.push(`/studio?tab=sequence&account=${encodeURIComponent(account.name)}`);
    }
    setOpen(false);
  }

  function handleSendEmail() {
    if (onSendEmail) {
      onSendEmail(account.name);
    } else {
      toast.info('Select a persona first in Studio');
      router.push(`/studio?tab=sequence&account=${encodeURIComponent(account.name)}`);
    }
    setOpen(false);
  }

  function handleBookMeeting() {
    // Open Calendly link
    window.open(
      'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW',
      '_blank'
    );
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open actions menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleGenerateOnePager}>
          <FileText className="mr-2 h-4 w-4" />
          Generate One-Pager
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGenerateSequence}>
          <Mail className="mr-2 h-4 w-4" />
          Generate Sequence
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSendEmail}>
          <Send className="mr-2 h-4 w-4" />
          Send Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleBookMeeting}>
          <Calendar className="mr-2 h-4 w-4" />
          Book Meeting
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewDetails}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Account Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
