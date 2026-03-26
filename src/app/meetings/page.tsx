import Link from 'next/link';
import { getMeetings } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { CalendarCheck, ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function MeetingsPage() {
  const meetings = getMeetings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meetings ({meetings.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Scheduled and completed meetings linked to accounts and briefs.
        </p>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-10 w-10" />}
          title="No Meetings Yet"
          description="Meetings will appear here once booked. Start outreach to fill the pipeline."
          action={
            <Link href="/waves">
              <Button size="sm" className="gap-1">View Outreach Waves <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="hidden sm:table-cell">Attendees</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{m.date}</TableCell>
                    <TableCell className="font-medium text-sm">{m.account}</TableCell>
                    <TableCell className="text-xs hidden sm:table-cell">{m.attendees}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{m.meeting_type}</Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{m.outcome}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
