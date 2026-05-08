'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, ExternalLink, MessageSquare, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { EmailComposer } from '@/components/email/composer';

export interface EmailRow {
  id: number;
  to_email: string;
  subject: string;
  status: string;
  account_name: string;
  persona_name: string | null;
  sent_at: string;
  opened_at: string | null;
  thread_id: string | null;
  reply_count: number;
  hubspot_engagement_id: string | null;
}

export function EmailAnalyticsClient({ emails }: { emails: EmailRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const accounts = useMemo(() => {
    const unique = new Set(emails.map((e) => e.account_name).filter(Boolean));
    return Array.from(unique).sort();
  }, [emails]);

  const filtered = useMemo(() => {
    return emails.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (accountFilter !== 'all' && e.account_name !== accountFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.to_email.toLowerCase().includes(q)
          || e.subject.toLowerCase().includes(q)
          || (e.account_name ?? '').toLowerCase().includes(q)
          || (e.persona_name ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [emails, search, statusFilter, accountFilter]);

  function handleCopy(email: EmailRow) {
    const text = `To: ${email.to_email}\nSubject: ${email.subject}\nSent: ${new Date(email.sent_at).toLocaleString()}\nStatus: ${email.status}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Log</CardTitle>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email, subject, or account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emails.length === 0
              ? 'No emails sent yet. Generate a sequence in Studio and send your first email.'
              : 'No emails match your filters.'}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="mb-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {emails.length} emails
            </p>
            {filtered.map((email) => (
              <div
                key={email.id}
                className="rounded-lg border border-input p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{email.subject}</p>
                      <Badge
                        variant={
                          email.status === 'bounced'
                            ? 'destructive'
                            : email.status === 'opened'
                              ? 'default'
                              : 'secondary'
                        }
                        className="shrink-0 text-xs"
                      >
                        {email.status}
                      </Badge>
                      {email.reply_count > 0 ? (
                        <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                          <MessageSquare className="h-3 w-3" />
                          {email.reply_count} {email.reply_count === 1 ? 'reply' : 'replies'}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      To: {email.to_email}
                      {email.account_name ? ` · ${email.account_name}` : null}
                      {email.persona_name ? ` · ${email.persona_name}` : null}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(email.sent_at).toLocaleString()}</span>
                      {email.opened_at ? (
                        <span className="text-emerald-600">
                          Opened {new Date(email.opened_at).toLocaleString()}
                        </span>
                      ) : null}
                      {email.hubspot_engagement_id ? (
                        <span className="text-[10px] text-orange-500">HS</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <EmailComposer
                      accountName={email.account_name}
                      personaName={email.persona_name ?? undefined}
                      personaEmail={email.to_email}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Follow Up
                        </Button>
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopy(email)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy details
                        </DropdownMenuItem>
                        {email.hubspot_engagement_id ? (
                          <DropdownMenuItem asChild>
                            <a
                              href={`https://app.hubspot.com/contacts/emails/${email.hubspot_engagement_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View in HubSpot
                            </a>
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
