'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

interface CaptureEntry {
  account: string;
  contact: string;
  notes: string;
  interest: number;
  urgency: number;
  influence: number;
  fit: number;
}

export default function CapturePage() {
  const [form, setForm] = useState<CaptureEntry>({
    account: '',
    contact: '',
    notes: '',
    interest: 3,
    urgency: 3,
    influence: 3,
    fit: 3,
  });

  const heatScore = form.interest + form.urgency + form.influence + form.fit;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.account.trim() || !form.contact.trim()) {
      toast.error('Account and contact name are required');
      return;
    }
    // In Sprint 3 this will POST to the API
    toast.success(`Captured: ${form.contact} @ ${form.account} (Heat: ${heatScore}/20)`);
    setForm({ account: '', contact: '', notes: '', interest: 3, urgency: 3, influence: 3, fit: 3 });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mobile Capture</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Quick-capture after events, calls, or hallway conversations. Scores 4 dimensions into a Heat Score.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" /> Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="account">Account *</Label>
              <Input
                id="account"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                placeholder="e.g. Dannon"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact Name *</Label>
              <Input
                id="contact"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="e.g. Sarah Chen"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="What happened, key takeaways..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Heat Scoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(['interest', 'urgency', 'influence', 'fit'] as const).map((dim) => (
                <div key={dim}>
                  <Label className="capitalize">{dim}: <span className="font-bold">{form[dim]}</span>/5</Label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={form[dim]}
                    onChange={(e) => setForm({ ...form, [dim]: Number(e.target.value) })}
                    className="mt-2 w-full accent-[var(--primary)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
                    <span>Low</span><span>High</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-[var(--accent)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Heat Score</span>
                <span className={`text-2xl font-bold ${heatScore >= 16 ? 'text-red-600' : heatScore >= 12 ? 'text-amber-600' : 'text-[var(--muted-foreground)]'}`}>
                  {heatScore} / 20
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className={`h-full rounded-full transition-all ${heatScore >= 16 ? 'bg-red-500' : heatScore >= 12 ? 'bg-amber-500' : 'bg-neutral-400'}`}
                  style={{ width: `${(heatScore / 20) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {heatScore >= 16 ? 'Hot lead — follow up immediately' : heatScore >= 12 ? 'Warm lead — schedule follow-up' : 'Cool lead — add to nurture queue'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg">
          Save Capture
        </Button>
      </form>
    </div>
  );
}
