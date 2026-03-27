'use client';

import { useState, useTransition } from 'react';
import { updateAccountStatus } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';

const RESEARCH_STATUSES = ['Not started', 'In Progress', 'Ready', 'Complete'];
const OUTREACH_STATUSES = ['Not started', 'Planned', 'In Progress', 'Contacted', 'Replied', 'Follow-up'];
const MEETING_STATUSES = ['No meeting', 'Requested', 'Scheduled', 'Meeting Booked', 'Meeting Held', 'No-show'];

const STATUS_MAP: Record<string, string[]> = {
  research_status: RESEARCH_STATUSES,
  outreach_status: OUTREACH_STATUSES,
  meeting_status: MEETING_STATUSES,
};

interface Props {
  accountName: string;
  field: 'research_status' | 'outreach_status' | 'meeting_status';
  currentValue: string;
}

export function EditableStatus({ accountName, field, currentValue }: Props) {
  const [value, setValue] = useState(currentValue);
  const [isPending, startTransition] = useTransition();

  function handleChange(newValue: string) {
    setValue(newValue);
    startTransition(async () => {
      await updateAccountStatus(accountName, field, newValue);
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-7 w-auto min-w-[120px] border-none bg-transparent px-1 text-xs">
        <SelectValue>
          <StatusBadge status={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(STATUS_MAP[field] ?? []).map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            <StatusBadge status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
