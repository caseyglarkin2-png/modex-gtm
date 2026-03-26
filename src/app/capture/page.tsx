'use client';

import { useState } from 'react';

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
  const [saved, setSaved] = useState(false);

  const heatScore = form.interest + form.urgency + form.influence + form.fit;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, POST to API route → Railway DB
    console.log('Captured:', { ...form, heat_score: heatScore, timestamp: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm({ account: '', contact: '', notes: '', interest: 3, urgency: 3, influence: 3, fit: 3 });
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Mobile Capture</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Quick-capture after events, calls, or hallway conversations. Scores 4 dimensions → Heat Score.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium">Account</label>
          <input
            type="text"
            value={form.account}
            onChange={(e) => setForm({ ...form, account: e.target.value })}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-sm"
            placeholder="e.g. Dannon"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact Name</label>
          <input
            type="text"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-sm"
            placeholder="e.g. Sarah Chen"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-sm"
            placeholder="What happened, key takeaways..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(['interest', 'urgency', 'influence', 'fit'] as const).map((dim) => (
            <div key={dim}>
              <label className="block text-sm font-medium capitalize">{dim}: {form[dim]}</label>
              <input
                type="range"
                min={1}
                max={5}
                value={form[dim]}
                onChange={(e) => setForm({ ...form, [dim]: Number(e.target.value) })}
                className="mt-1 w-full"
              />
              <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                <span>1</span><span>5</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-[var(--accent)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Heat Score</span>
            <span className={`text-2xl font-bold ${heatScore >= 16 ? 'text-red-600' : heatScore >= 12 ? 'text-amber-600' : 'text-gray-600'}`}>
              {heatScore} / 20
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${heatScore >= 16 ? 'bg-red-500' : heatScore >= 12 ? 'bg-amber-500' : 'bg-gray-400'}`}
              style={{ width: `${(heatScore / 20) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--primary)] p-3 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
        >
          Save Capture
        </button>
        {saved && <p className="text-center text-sm text-green-600 font-medium">Saved!</p>}
      </form>
    </>
  );
}
