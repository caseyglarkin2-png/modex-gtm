import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/engagement-center';
import { loadThread, markThreadRead } from '@/lib/inbox';
import { ThreadReplyComposer } from '@/components/email/thread-reply-composer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Conversation' };

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await loadThread(decodeURIComponent(id));
  if (!thread) notFound();

  // Opening the thread clears its unread inbound messages.
  await markThreadRead(thread.id);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Engagement', href: '/engagement' },
          { label: 'Conversation' },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">
            {thread.subject ?? 'Conversation'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[thread.accountName, thread.personaEmail].filter(Boolean).join(' · ') ||
              'No account linked'}
          </p>
        </div>
        {thread.accountSlug ? (
          <Link href={`/accounts/${thread.accountSlug}`}>
            <Button variant="outline" size="sm">Open Account</Button>
          </Link>
        ) : null}
      </div>

      <div className="space-y-3">
        {thread.messages.map((message) => (
          <Card
            key={message.id}
            className={message.direction === 'received' ? 'border-l-2 border-l-[var(--primary)]' : undefined}
          >
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">{message.fromLabel}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={message.direction === 'sent' ? 'outline' : 'default'}>
                    {message.direction === 'sent' ? 'Sent' : 'Received'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(message.at)}
                  </span>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                {message.bodyText || '(no readable body)'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ThreadReplyComposer threadId={thread.id} recipient={thread.personaEmail} />
    </div>
  );
}
