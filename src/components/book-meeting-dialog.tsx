'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createMeeting } from '@/lib/actions';
import { CalendarCheck, ExternalLink } from 'lucide-react';

const MEETING_TYPES = ['In-Person', 'Virtual', 'Phone', 'Booth'] as const;

interface Props {
  accountName: string;
  personas: Array<{ name: string; priority: string }>;
  calendlyLink?: string;
}

export function BookMeetingDialog({ accountName, personas, calendlyLink }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    meeting_type: 'In-Person' as typeof MEETING_TYPES[number],
    attendees: '',
    date: '',
    time: '',
    location: '',
    objective: '',
    notes: '',
    owner: 'Jake',
  });

  // Pre-select P1 personas by default
  const p1Names = personas.filter((p) => p.priority === 'P1').map((p) => p.name).join(', ');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) { toast.error('Date is required'); return; }
    setLoading(true);
    try {
      const result = await createMeeting({
        account: accountName,
        attendees: form.attendees || p1Names,
        meeting_type: form.meeting_type,
        date: form.date,
        time: form.time,
        location: form.location,
        objective: form.objective,
        notes: form.notes,
        owner: form.owner,
        status: 'Scheduled',
      });
      if (result.success) {
        toast.success(`Meeting booked: ${accountName} on ${form.date}`);
        setOpen(false);
        setForm({ meeting_type: 'In-Person', attendees: '', date: '', time: '', location: '', objective: '', notes: '', owner: 'Jake' });
      } else if (result.offline) {
        toast.success(`Meeting saved locally`);
        setOpen(false);
      } else {
        toast.error('Failed to book meeting');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <CalendarCheck className="h-3.5 w-3.5" /> Book Meeting
        </Button>
        {calendlyLink && (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={calendlyLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Calendly
            </a>
          </Button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Meeting — {accountName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" className="mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" className="mt-1" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v as typeof MEETING_TYPES[number] })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner</Label>
                <Select value={form.owner} onValueChange={(v) => setForm({ ...form, owner: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jake">Jake</SelectItem>
                    <SelectItem value="Casey">Casey</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Attendees</Label>
              <Select onValueChange={(v) => setForm({ ...form, attendees: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={p1Names || 'Select persona...'} /></SelectTrigger>
                <SelectContent>
                  {personas.map((p) => <SelectItem key={p.name} value={p.name}>{p.name} ({p.priority})</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="mt-2" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder={p1Names || 'Or type names manually...'} />
            </div>
            <div>
              <Label>Location / Link</Label>
              <Input className="mt-1" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. MODEX Booth #1234 or Zoom link" />
            </div>
            <div>
              <Label>Objective</Label>
              <Input className="mt-1" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="e.g. Demo YardFlow, discuss pilot timeline" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Prep notes, context..." />
            </div>
            <DialogFooter>
              {calendlyLink && (
                <Button type="button" variant="outline" asChild>
                  <a href={calendlyLink} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Open Calendly
                  </a>
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Book Meeting'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
