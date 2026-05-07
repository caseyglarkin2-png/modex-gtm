'use client';

import { useState } from 'react';
import { createAccount } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useActor } from '@/lib/use-actor';

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actor = useActor();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await createAccount({
      name: fd.get('name') as string,
      vertical: fd.get('vertical') as string,
      parent_brand: fd.get('parent_brand') as string || undefined,
      why_now: fd.get('why_now') as string || undefined,
      primo_angle: fd.get('primo_angle') as string || undefined,
      tier: (fd.get('tier') as 'Tier 1' | 'Tier 2' | 'Tier 3') || 'Tier 3',
      owner: fd.get('owner') as string || actor,
      notes: fd.get('notes') as string || undefined,
    });

    setLoading(false);
    if (result.success) {
      setOpen(false);
    } else if (result.error && typeof result.error === 'object' && 'name' in result.error) {
      setError((result.error as { name?: string[] }).name?.[0] ?? 'Failed to add account');
    } else {
      setError('Failed to add account');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Procter & Gamble" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vertical">Vertical *</Label>
              <Input id="vertical" name="vertical" required placeholder="e.g. CPG / Food & Bev" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="parent_brand">Parent Brand</Label>
              <Input id="parent_brand" name="parent_brand" placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier">Tier</Label>
              <Select name="tier" defaultValue="Tier 3">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tier 1">Tier 1</SelectItem>
                  <SelectItem value="Tier 2">Tier 2</SelectItem>
                  <SelectItem value="Tier 3">Tier 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="why_now">Why Now?</Label>
            <Input id="why_now" name="why_now" placeholder="Signal or timing reason" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primo_angle">Primo Angle</Label>
            <Input id="primo_angle" name="primo_angle" placeholder="How YardFlow connects" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" name="owner" defaultValue={actor} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Any context..." />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
