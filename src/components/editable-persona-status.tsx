'use client';

import { useState, useTransition } from 'react';
import { updatePersonaStatus } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';

const PERSONA_STATUSES = ['Not started', 'Researching', 'Contacted', 'Engaged', 'Meeting Set', 'Converted'];

interface Props {
  personaId: string;
  currentValue: string;
}

export function EditablePersonaStatus({ personaId, currentValue }: Props) {
  const [value, setValue] = useState(currentValue);
  const [isPending, startTransition] = useTransition();

  function handleChange(newValue: string) {
    setValue(newValue);
    startTransition(async () => {
      await updatePersonaStatus(personaId, newValue);
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
        {PERSONA_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            <StatusBadge status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
