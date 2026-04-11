'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { deleteCampaignAction, updateCampaignSettingsAction } from '../actions';

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

interface CampaignSettingsFormProps {
  slug: string;
  name: string;
  owner: string;
  status: CampaignStatus;
  targetAccountCount: number;
  messagingAngle: string;
  touchCount: number;
  suggestedIntervals: string;
  isSystemDefault?: boolean;
}

export function CampaignSettingsForm({
  slug,
  name,
  owner,
  status,
  targetAccountCount,
  messagingAngle,
  touchCount,
  suggestedIntervals,
  isSystemDefault = false,
}: CampaignSettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name,
    owner,
    status,
    targetAccountCount: String(targetAccountCount),
    messagingAngle,
    touchCount: String(touchCount),
    suggestedIntervals,
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function saveSettings() {
    startTransition(async () => {
      const result = await updateCampaignSettingsAction(slug, {
        name: form.name,
        owner: form.owner,
        status: form.status,
        target_account_count: Number(form.targetAccountCount || 0),
        messaging_angle: form.messagingAngle,
        touch_count: Number(form.touchCount || 0),
        suggested_intervals: form.suggestedIntervals,
      });

      if (result.success) {
        toast.success('Campaign settings saved');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Save failed');
      }
    });
  }

  function deleteCampaign() {
    startTransition(async () => {
      const result = await deleteCampaignAction(slug, deleteConfirm);
      if (result.success) {
        toast.success('Campaign deleted');
        router.push('/campaigns');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Delete failed');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="campaign-name">Campaign name</Label>
          <Input id="campaign-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-owner">Owner</Label>
          <Input id="campaign-owner" value={form.owner} onChange={(event) => updateField('owner', event.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-status">Status</Label>
          <select
            id="campaign-status"
            value={form.status}
            onChange={(event) => updateField('status', event.target.value as CampaignStatus)}
            className="flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-targets">Target accounts</Label>
          <Input id="campaign-targets" type="number" min={0} value={form.targetAccountCount} onChange={(event) => updateField('targetAccountCount', event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-touches">Touch count</Label>
          <Input id="campaign-touches" type="number" min={1} max={12} value={form.touchCount} onChange={(event) => updateField('touchCount', event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-intervals">Intervals</Label>
          <Input id="campaign-intervals" value={form.suggestedIntervals} onChange={(event) => updateField('suggestedIntervals', event.target.value)} placeholder="0, 3, 7, 14" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-angle">Messaging angle</Label>
        <Textarea id="campaign-angle" rows={4} value={form.messagingAngle} onChange={(event) => updateField('messagingAngle', event.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={saveSettings} disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Settings
        </Button>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-red-700">Danger Zone</p>
            <p className="text-xs text-muted-foreground">
              {isSystemDefault
                ? 'This default system campaign stays in place for MODEX operations and cannot be deleted here.'
                : `Type the campaign name to confirm deletion: ${name}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder={isSystemDefault ? 'Default system campaign' : 'Type exact campaign name'}
            disabled={pending || isSystemDefault}
          />
          <Button
            type="button"
            variant="destructive"
            className="gap-1.5"
            onClick={deleteCampaign}
            disabled={pending || isSystemDefault || deleteConfirm.trim() !== name}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
