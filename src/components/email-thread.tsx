'use client';

import { Badge } from '@/components/ui/badge';

interface EmailMessage {
  id: number;
  subject: string;
  to_email: string;
  status: string;
  sent_at: string;
  opened_at?: string | null;
  reply_count: number;
  body_html: string;
}

interface ReplyNotification {
  id: number;
  persona_email: string | null;
  subject: string | null;
  preview: string | null;
  created_at: string;
}

interface EmailThreadProps {
  emails: EmailMessage[];
  replies: ReplyNotification[];
}

const statusColors: Record<string, string> = {
  sent: 'bg-gray-100 text-gray-800',
  delivered: 'bg-blue-100 text-blue-800',
  opened: 'bg-green-100 text-green-800',
  clicked: 'bg-purple-100 text-purple-800',
  bounced: 'bg-red-100 text-red-800',
};

export function EmailThread({ emails, replies }: EmailThreadProps) {
  // Merge and sort by date
  const timeline = [
    ...emails.map((e) => ({
      type: 'sent' as const,
      date: new Date(e.sent_at),
      data: e,
    })),
    ...replies.map((r) => ({
      type: 'reply' as const,
      date: new Date(r.created_at),
      data: r,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (timeline.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
        No messages in this thread.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((item, i) => (
        <div key={`${item.type}-${i}`} className="relative">
          {/* Thread connector */}
          {i > 0 && (
            <div className="absolute left-4 -top-4 h-4 w-px bg-[var(--border)]" />
          )}

          <div
            className={`rounded-lg border p-4 ${
              item.type === 'reply'
                ? 'ml-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                : 'border-[var(--border)]'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.type === 'sent' ? (
                  <>
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">
                      To: {(item.data as EmailMessage).to_email}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${statusColors[(item.data as EmailMessage).status] || ''}`}
                    >
                      {(item.data as EmailMessage).status}
                    </Badge>
                  </>
                ) : (
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Reply from: {(item.data as ReplyNotification).persona_email || 'Unknown'}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {item.date.toLocaleString()}
              </span>
            </div>

            <p className="text-sm font-medium">
              {item.type === 'sent'
                ? (item.data as EmailMessage).subject
                : (item.data as ReplyNotification).subject}
            </p>

            {item.type === 'reply' && (item.data as ReplyNotification).preview && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {(item.data as ReplyNotification).preview}
              </p>
            )}

            {item.type === 'sent' && (item.data as EmailMessage).opened_at && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Opened: {new Date((item.data as EmailMessage).opened_at!).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
