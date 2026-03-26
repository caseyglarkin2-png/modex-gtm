'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { queuePush, queuePending, queueFlush } from '@/lib/offline-queue';

interface CaptureEntry {
  account: string;
  contact: string;
  title: string;
  notes: string;
  interest: number;
  urgency: number;
  influence: number;
  fit: number;
}

const EMPTY: CaptureEntry = {
  account: '', contact: '', title: '', notes: '',
  interest: 3, urgency: 3, influence: 3, fit: 3,
};

const ACCOUNTS = [
  'Dannon', 'General Mills', 'Frito-Lay', 'Core Mark', 'US Foods', 'Sysco',
  'Nestlé', 'Kraft Heinz', 'Conagra', 'Tyson Foods', 'Mars', 'Mondelez',
  'Campbell Soup', 'PNC Bank', 'Wells Fargo', 'Amazon', 'Walmart', 'Target',
  'Chewy', 'FedEx',
];

export default function CapturePage() {
  const [form, setForm] = useState<CaptureEntry>(EMPTY);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingCount(queuePending().length);
    const autoSync = async () => {
      setIsOnline(true);
      const pending = queuePending();
      if (pending.length === 0) return;
      const { sent } = await queueFlush();
      if (sent > 0) {
        toast.success(`${sent} capture${sent > 1 ? 's' : ''} synced to server`);
        setPendingCount(queuePending().length);
      }
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', autoSync);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', autoSync); window.removeEventListener('offline', onOffline); };
  }, []);

  const heatScore = form.interest + form.urgency + form.influence + form.fit;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.account.trim() || !form.contact.trim()) { toast.error('Account and contact name are required'); return; }
    queuePush({ account: form.account, contact: form.contact, title: form.title, notes: form.notes, interest: form.interest, urgency: form.urgency, influence: form.influence, fit: form.fit, heat_score: heatScore, status: 'Open' });
    toast.success(`Captured: ${form.contact} @ ${form.account} — Heat ${heatScore}/20${isOnline ? '' : ' (offline — will sync)'}`);
    setPendingCount(queuePending().length);
    setForm(EMPTY);
    if (isOnline) queueFlush().then(({ sent }) => { if (sent > 0) setPendingCount(queuePending().length); });
  }

  async function handleManualSync() {
    setSyncing(true);
    const { sent, failed } = await queueFlush();
    setPendingCount(queuePending().length);
    setSyncing(false);
    if (sent > 0) toast.success(`Synced ${sent} capture${sent > 1 ? 's' : ''}`);
    else if (failed > 0) toast.error(`${failed} failed to sync — check connection`);
    else toast('Nothing pending');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mobile Capture</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Quick-capture after events, calls, or hallway conversations. Works offline.</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline
            ? <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300"><Wifi className="h-3 w-3" /> Online</Badge>
            : <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300"><WifiOff className="h-3 w-3" /> Offline</Badge>}
          {pendingCount > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleManualSync} disabled={syncing}>
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sync {pendingCount} pending
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Smartphone className="h-4 w-4" /> Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="account">Account *</Label>
              <Input id="account" list="accounts-list" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} placeholder="e.g. Dannon" required className="mt-1" />
              <datalist id="accounts-list">{ACCOUNTS.map((a) => <option key={a} value={a} />)}</datalist>
            </div>
            <div>
              <Label htmlFor="contact">Contact Name *</Label>
              <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="e.g. Sarah Chen" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. VP Supply Chain" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="What happened, key takeaways, next steps..." className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Heat Scoring</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(['interest', 'urgency', 'influence', 'fit'] as const).map((dim) => (
                <div key={dim}>
                  <Label className="capitalize">{dim}: <span className="font-bold">{form[dim]}</span>/5</Label>
                  <input type="range" min={1} max={5} value={form[dim]} onChange={(e) => setForm({ ...form, [dim]: Number(e.target.value) })} className="mt-2 w-full accent-[var(--primary)]" />
                  <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]"><span>Low</span><span>High</span></div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-[var(--accent)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Heat Score</span>
                <span className={`text-2xl font-bold ${heatScore >= 16 ? 'text-red-600' : heatScore >= 12 ? 'text-amber-600' : 'text-[var(--muted-foreground)]'}`}>{heatScore} / 20</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                <div className={`h-full rounded-full transition-all ${heatScore >= 16 ? 'bg-red-500' : heatScore >= 12 ? 'bg-amber-500' : 'bg-neutral-400'}`} style={{ width: `${(heatScore / 20) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {heatScore >= 16 ? 'Hot lead — follow up within 24h' : heatScore >= 12 ? 'Warm lead — schedule follow-up' : 'Cool — add to nurture queue'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg">
          {isOnline ? 'Save Capture' : 'Save Offline (syncs on reconnect)'}
        </Button>
      </form>
    </div>
  );
}
