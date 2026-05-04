'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  computeChecklistCompleteness,
  getChecklistTemplate,
  type ChecklistItemId,
} from '@/lib/revops/content-qa-checklist';

type ContentQaChecklistPanelProps = {
  generatedContentId: number;
  campaignType?: string;
  initialCompleted?: string[];
  readOnly?: boolean;
  onSaved?: (completedIds: ChecklistItemId[]) => void;
};

export function ContentQaChecklistPanel({
  generatedContentId,
  campaignType,
  initialCompleted,
  readOnly = false,
  onSaved,
}: ContentQaChecklistPanelProps) {
  const template = useMemo(() => getChecklistTemplate(campaignType), [campaignType]);
  const [completed, setCompleted] = useState<ChecklistItemId[]>(
    (initialCompleted ?? []).filter((id): id is ChecklistItemId => template.items.some((item) => item.id === id)),
  );
  const [saving, setSaving] = useState(false);
  const completeness = computeChecklistCompleteness(template, completed);

  async function persistChecklist() {
    setSaving(true);
    try {
      const response = await fetch('/api/revops/content-checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedContentId,
          completedItemIds: completed,
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(payload.error ?? 'Checklist save failed');
      toast.success('Checklist saved');
      onSaved?.(completed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checklist save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Content QA Checklist</p>
        <p className={`text-xs ${completeness.complete ? 'text-emerald-700' : 'text-amber-700'}`}>
          {completeness.requiredComplete}/{completeness.requiredTotal} required complete
        </p>
      </div>
      <div className="space-y-1">
        {template.items.map((item) => {
          const checked = completed.includes(item.id);
          return (
            <label key={`${generatedContentId}-${item.id}`} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={checked}
                disabled={readOnly}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...new Set([...completed, item.id])]
                    : completed.filter((id) => id !== item.id);
                  setCompleted(next);
                }}
              />
              <span>{item.label}</span>
              {item.required ? <span className="text-amber-700">required</span> : null}
            </label>
          );
        })}
      </div>
      {!readOnly ? (
        <Button size="sm" variant="outline" onClick={persistChecklist} disabled={saving}>
          {saving ? 'Saving...' : 'Save Checklist'}
        </Button>
      ) : null}
    </div>
  );
}
