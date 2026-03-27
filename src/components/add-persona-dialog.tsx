'use client';

import { useState } from 'react';
import { createPersona } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';

interface Props {
  accountName: string;
}

export function AddPersonaDialog({ accountName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await createPersona({
      account_name: accountName,
      name: fd.get('name') as string,
      title: fd.get('title') as string || undefined,
      email: fd.get('email') as string || undefined,
      priority: (fd.get('priority') as 'P1' | 'P2' | 'P3') || 'P2',
      persona_lane: fd.get('persona_lane') as string || undefined,
      role_in_deal: fd.get('role_in_deal') as string || undefined,
      linkedin_url: fd.get('linkedin_url') as string || undefined,
      why_this_persona: fd.get('why_this_persona') as string || undefined,
      notes: fd.get('notes') as string || undefined,
    });

    setLoading(false);
    if (result.success) {
      setOpen(false);
    } else {
      setError('Failed to add persona');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <UserPlus className="h-3.5 w-3.5" /> Add Persona
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Persona to {accountName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. VP Supply Chain" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="jane@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="P2">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1 — Must reach</SelectItem>
                  <SelectItem value="P2">P2 — Important</SelectItem>
                  <SelectItem value="P3">P3 — Nice to have</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="persona_lane">Persona Lane</Label>
              <Input id="persona_lane" name="persona_lane" placeholder="e.g. Exec sponsor" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role_in_deal">Role in Deal</Label>
              <Input id="role_in_deal" name="role_in_deal" placeholder="e.g. Decision-maker" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input id="linkedin_url" name="linkedin_url" placeholder="https://linkedin.com/in/..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="why_this_persona">Why This Persona?</Label>
            <Input id="why_this_persona" name="why_this_persona" placeholder="Reason for targeting" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Persona'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
