'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { readApiResponse } from '@/lib/api-response';

export type EditableLongTextField = 'why_now' | 'primo_angle' | 'best_intro_path' | 'signal_type';

type EditableLongTextProps = {
  /** Account slug used in the PATCH URL — must match the [slug] route param. */
  accountSlug: string;
  /** Which Account column this control edits. */
  field: EditableLongTextField;
  /** Current persisted value (string) or null when blank. */
  currentValue: string | null;
  /** Placeholder shown in the textarea when the field is empty. */
  placeholder?: string;
  /** Hard cap matching the server-side zod schema. */
  maxLength?: number;
  /** Optional fallback rendered when the field is null/empty in display mode. */
  emptyFallback?: string;
};

/**
 * Click-to-edit text component that mirrors the click-to-edit affordance of
 * <EditableStatus>, but renders a <Textarea> instead of a <Select> so it can
 * back free-text fields like why_now / primo_angle / best_intro_path.
 *
 * Calls PATCH /api/accounts/[slug] (S4-T1) and triggers a Next.js router
 * refresh on success so the surrounding server-rendered card picks up the
 * new value + edit-history badge without a hard reload.
 */
export function EditableLongText({
  accountSlug,
  field,
  currentValue,
  placeholder,
  maxLength = 4000,
  emptyFallback = 'Click the pencil to add.',
}: EditableLongTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentValue ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function startEdit() {
    setDraft(currentValue ?? '');
    setIsEditing(true);
  }

  function cancel() {
    setIsEditing(false);
    setDraft(currentValue ?? '');
  }

  async function save() {
    if (isSaving) return;
    const trimmed = draft.trim();
    const payload = trimmed.length === 0 ? null : trimmed;
    if (payload === (currentValue ?? null)) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/accounts/${accountSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: payload }),
      });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? 'Save failed');
      }
      toast.success('Saved');
      setIsEditing(false);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="group relative" data-testid={`editable-long-text-${field}`}>
        <p className="pr-7 text-sm">
          {currentValue && currentValue.trim().length > 0 ? currentValue : emptyFallback}
        </p>
        <button
          type="button"
          onClick={startEdit}
          className="absolute right-0 top-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--accent)] hover:text-[var(--foreground)] group-hover:opacity-100 focus:opacity-100"
          aria-label={`Edit ${field}`}
          title={`Edit ${field}`}
          data-testid={`editable-long-text-pencil-${field}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid={`editable-long-text-edit-${field}`}>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={4}
        autoFocus
        aria-label={`Edit ${field}`}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted-foreground)]">{draft.length}/{maxLength}</span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={cancel}
            disabled={isSaving}
            data-testid={`editable-long-text-cancel-${field}`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void save()}
            disabled={isSaving}
            data-testid={`editable-long-text-save-${field}`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
