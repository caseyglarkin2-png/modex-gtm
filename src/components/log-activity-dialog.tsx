'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createActivity } from '@/lib/actions';
import { Plus } from 'lucide-react';

const ACTIVITY_TYPES = ['Email', 'LinkedIn DM', 'Phone Call', 'Meeting', 'Event', 'Note', 'Follow-up', 'Other'] as const;

interface Props {
  accountName: string;
  personas: Array<{ name: string }>;
}

export function LogActivityDialog({ accountName, personas }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    activity_type: 'Email' as typeof ACTIVITY_TYPES[number],
    persona: '',
    outcome: '',
    next_step: '',
    next_step_due: '',
    notes: '',
    owner: 'Casey',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createActivity({ account: accountName, ...form });
      if (result.success) {
        toast.success(`Activity logged for ${accountName}`);
        setOpen(false);
        setForm({ activity_type: 'Email', persona: '', outcome: '', next_step: '', next_step_due: '', notes: '', owner: 'Casey' });
      } else if (result.offline) {
        toast.success(`Activity saved locally`);
        setOpen(false);
      } else {
        toast.error('Failed to log activity');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Log Activity
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity — {accountName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v as typeof ACTIVITY_TYPES[number] })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner</Label>
                <Select value={form.owner} onValueChange={(v) => setForm({ ...form, owner: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casey">Casey</SelectItem>
                    <SelectItem value="Jake">Jake</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {personas.length > 0 && (
              <div>
                <Label>Persona / Contact</Label>
                <Select value={form.persona} onValueChange={(v) => setForm({ ...form, persona: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contact..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {personas.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Outcome</Label>
              <Input className="mt-1" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} placeholder="e.g. Replied positively, left voicemail..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Next Step</Label>
                <Input className="mt-1" value={form.next_step} onChange={(e) => setForm({ ...form, next_step: e.target.value })} placeholder="e.g. Follow up call" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" className="mt-1" value={form.next_step_due} onChange={(e) => setForm({ ...form, next_step_due: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Details, talking points, observations..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Log Activity'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
