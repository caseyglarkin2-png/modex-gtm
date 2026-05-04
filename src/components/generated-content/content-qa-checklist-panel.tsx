'use client';

import { useEffect, useMemo } from 'react';
import { resolveContentQaChecklist, type ChecklistItemId } from '@/lib/revops/content-qa-checklist';

type ContentQaChecklistPanelProps = {
  generatedContentId?: number;
  campaignType?: string;
  accountName?: string;
  content?: string;
  initialCompleted?: string[];
  onSaved?: (completedIds: ChecklistItemId[]) => void;
};

export function ContentQaChecklistPanel({
  campaignType,
  accountName,
  content,
  initialCompleted,
  onSaved,
}: ContentQaChecklistPanelProps) {
  const resolved = useMemo(() => resolveContentQaChecklist({
    campaignType,
    completedItemIds: initialCompleted as ChecklistItemId[] | undefined,
    content,
    accountName,
  }), [accountName, campaignType, content, initialCompleted]);

  useEffect(() => {
    onSaved?.(resolved.completedItemIds);
  }, [onSaved, resolved.completedItemIds]);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Automated QA Policy</p>
        <p className={`text-xs ${resolved.complete ? 'text-emerald-700' : 'text-amber-700'}`}>
          {resolved.requiredComplete}/{resolved.requiredTotal} required complete
        </p>
      </div>
      <div className="space-y-1">
        {resolved.items.map((item) => {
          return (
            <label key={item.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={item.completed}
                disabled
                readOnly
              />
              <span>{item.label}</span>
              {item.required ? <span className="text-amber-700">required</span> : null}
              {item.source === 'automatic' ? <span className="text-emerald-700">auto</span> : null}
              {item.source === 'manual' ? <span className="text-sky-700">manual</span> : null}
              {item.source === 'manual+automatic' ? <span className="text-sky-700">manual + auto</span> : null}
            </label>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Send eligibility is evaluated automatically from content quality, account specificity, CTA strength, and risk checks.
      </p>
    </div>
  );
}
