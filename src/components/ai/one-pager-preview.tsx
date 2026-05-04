'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { FileImage, RefreshCw, Copy, Download, Library } from 'lucide-react';
import { sanitizeOnePagerData } from '@/lib/one-pager/content-safety';
import type { AgentActionResult } from '@/lib/agent-actions/types';

export interface OnePagerData {
  headline: string;
  subheadline: string;
  painPoints: string[];
  solutionSteps: { step: number; title: string; description: string }[];
  outcomes: string[];
  proofStats: { value: string; label: string }[];
  customerQuote: string;
  bestFit: string;
  publicContext: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface OnePagerPreviewProps {
  accountName: string;
  trigger?: React.ReactNode;
  variant?: 'dialog' | 'inline';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OnePagerPreview({ data, accountName }: { data: OnePagerData; accountName: string }) {
  const sanitized = sanitizeOnePagerData(data);

  return (
    <div className="one-pager-doc bg-[#0b1a2e] text-white rounded-xl overflow-hidden text-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <p className="text-xs tracking-[0.25em] text-cyan-300 uppercase font-semibold">For {accountName}</p>
        <h1 className="text-3xl font-extrabold mt-1 tracking-tight">
          <span className="text-cyan-400">Yard</span><span className="text-white">Flow</span>
          <span className="text-slate-400 text-lg font-normal ml-2">by FreightRoll</span>
        </h1>
      </div>

      {/* Headline & Subheadline */}
      <div className="px-6 pb-4">
        <h2 className="text-base font-extrabold uppercase tracking-tight text-white leading-snug">
          {data.headline}
        </h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">{data.subheadline}</p>
      </div>

      <div className="mx-4 mb-4 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-cyan-600/40 bg-cyan-950/30 p-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Commercial Impact</p>
          <p className="mt-1 text-xs text-slate-200">Grow throughput without adding dock-office headcount.</p>
        </div>
        <div className="rounded-lg border border-blue-600/40 bg-blue-950/30 p-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-300">Operational Control</p>
          <p className="mt-1 text-xs text-slate-200">Standardize gate-to-dock execution across sites.</p>
        </div>
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-950/30 p-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Executive Visibility</p>
          <p className="mt-1 text-xs text-slate-200">Create board-ready proof of dwell and margin lift.</p>
        </div>
      </div>

      {/* Three-column layout with pipe flow diagram */}
      <div className="mx-4 rounded-lg border border-slate-600/60 overflow-hidden">
        <div className="grid grid-cols-[1fr_1.3fr_1fr]">
          {/* Column 1: Typical Reality (red) */}
          <div className="border-r border-slate-600/60">
            <div className="bg-red-900/50 px-3 py-2 text-center border-b border-slate-600/40">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Typical Reality</span>
            </div>
            <div className="px-3 py-3 space-y-2.5">
          {sanitized.painPoints.map((pain, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-red-400 shrink-0 text-sm">⚠</span>
                  <span>{pain}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Standardized Operating Protocol (blue) — with pipe flow */}
          <div className="border-r border-slate-600/60">
            <div className="bg-blue-900/50 px-3 py-2 text-center border-b border-slate-600/40">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Standardized Operating Protocol</span>
            </div>
            <div className="px-3 py-3">
              {/* Pipe flow visual */}
              <div className="relative">
                {sanitized.solutionSteps.map((s, i) => (
                  <div key={s.step} className="relative pl-6 pb-3 last:pb-0">
                    {/* Vertical pipe line */}
                    {i < data.solutionSteps.length - 1 && (
                      <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/60 to-cyan-500/20" />
                    )}
                    {/* Pipe node */}
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full border-2 border-cyan-500/70 bg-[#0b1a2e] flex items-center justify-center">
                      <span className="text-xs leading-none font-bold text-cyan-400 flex items-center justify-center h-full w-full">{s.step}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-cyan-300 font-bold">{s.title}</span>
                      <p className="text-slate-400 mt-0.5 leading-snug text-[11px]">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: YardFlow Effect (green) */}
          <div>
            <div className="bg-emerald-900/50 px-3 py-2 text-center border-b border-slate-600/40">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">YardFlow Effect</span>
            </div>
            <div className="px-3 py-3 space-y-2.5">
              {sanitized.outcomes.map((outcome, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Proof Stats Bar */}
      <div className="mx-4 mt-4">
        <div className="text-center mb-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold border-t border-b border-slate-600 px-6 py-1.5 inline-block">
            Proof from Live Deployment
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {sanitized.proofStats.map((stat, i) => {
            const icons = ['🏭', '🌐', '👤', '⏱', '💰'];
            return (
              <div key={i} className="text-center bg-slate-800/50 rounded-lg py-3 px-1 border border-slate-700/40">
                <div className="text-sm mb-1">{icons[i] ?? '📊'}</div>
                <p className="text-base font-bold text-white leading-none">{stat.value}</p>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Quote */}
      <div className="mx-4 mt-4 bg-slate-800/30 rounded-lg px-4 py-3 border-l-2 border-cyan-400/60">
        <p className="text-xs text-slate-300 italic leading-relaxed">&ldquo;{sanitized.customerQuote}&rdquo;</p>
      </div>

      {/* Best Fit + Context */}
      <div className="px-6 py-4 mt-2 border-t border-slate-700/50 space-y-1.5">
        <p className="text-xs text-slate-300"><strong className="text-slate-100">Best fit:</strong> {sanitized.bestFit}</p>
        {sanitized.publicContext && (
          <p className="text-xs text-slate-400"><strong className="text-slate-300">Public source context:</strong> {sanitized.publicContext}</p>
        )}
      </div>

      <div className="mx-4 mb-5 rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Suggested Next Step</p>
        <p className="mt-1 text-xs text-slate-100">
          Run a 20-minute YardFlow Throughput Benchmark for {accountName} to map current dwell loss and quantify fast-win value.
        </p>
      </div>
    </div>
  );
}

export function onePagerToHtml(data: OnePagerData, accountName: string): string {
  const sanitized = sanitizeOnePagerData(data);
  const safeAccountName = escapeHtml(accountName);
  const safeHeadline = escapeHtml(sanitized.headline);
  const safeSubheadline = escapeHtml(sanitized.subheadline);
  const safeQuote = escapeHtml(sanitized.customerQuote);
  const safeBestFit = escapeHtml(sanitized.bestFit);
  const safePublicContext = escapeHtml(sanitized.publicContext);

  const painHtml = sanitized.painPoints.map((p) => `<div style="display:flex;gap:8px;font-size:12px;color:#cbd5e1;margin-bottom:8px;line-height:1.5;"><span style="color:#f87171;flex-shrink:0;">⚠</span><span>${escapeHtml(p)}</span></div>`).join('');
  const stepsHtml = sanitized.solutionSteps.map((s, i) => `<div style="position:relative;padding-left:32px;margin-bottom:${i < sanitized.solutionSteps.length - 1 ? '12' : '0'}px;">
    <div style="position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;border:2px solid rgba(34,211,238,0.7);background:#0b1a2e;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;line-height:1;color:#22d3ee;">${s.step}</div>
    ${i < sanitized.solutionSteps.length - 1 ? '<div style="position:absolute;left:11px;top:26px;bottom:-4px;width:2px;background:linear-gradient(to bottom,rgba(34,211,238,0.5),rgba(34,211,238,0.15));"></div>' : ''}
    <div style="font-size:12px;"><span style="color:#67e8f9;font-weight:700;">${escapeHtml(s.title)}</span><p style="color:#94a3b8;margin:2px 0 0;font-size:11px;line-height:1.4;">${escapeHtml(s.description)}</p></div>
  </div>`).join('');
  const outcomesHtml = sanitized.outcomes.map((o) => `<div style="display:flex;gap:8px;font-size:12px;color:#cbd5e1;margin-bottom:8px;line-height:1.5;"><span style="color:#34d399;flex-shrink:0;">✓</span><span>${escapeHtml(o)}</span></div>`).join('');
  const statIcons = ['🏭', '🌐', '👤', '⏱', '💰'];
  const statsHtml = sanitized.proofStats.map((s, i) => `<td style="text-align:center;background:#1e293b;border-radius:8px;padding:12px 4px;border:1px solid rgba(71,85,105,0.4);"><div style="font-size:14px;margin-bottom:4px;">${statIcons[i] ?? '📊'}</div><div style="font-size:18px;font-weight:700;color:#fff;">${escapeHtml(s.value)}</div><div style="font-size:9px;color:#94a3b8;margin-top:4px;line-height:1.3;">${escapeHtml(s.label)}</div></td>`).join('');
  const publicContextHtml = sanitized.publicContext
    ? `<p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.5;"><strong style="color:#cbd5e1;">Public source context:</strong> ${safePublicContext}</p>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>YardFlow — ${safeAccountName}</title></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:720px;margin:0 auto;background:#0b1a2e;border-radius:12px;overflow:hidden;color:#fff;">
  <div style="padding:24px 24px 12px;">
    <p style="font-size:11px;letter-spacing:4px;color:#67e8f9;text-transform:uppercase;margin:0;font-weight:600;">For ${safeAccountName}</p>
    <h1 style="font-size:28px;margin:4px 0 0;font-weight:800;letter-spacing:-0.5px;"><span style="color:#22d3ee;">Yard</span><span style="color:#fff;">Flow</span><span style="color:#94a3b8;font-size:16px;font-weight:400;margin-left:8px;">by FreightRoll</span></h1>
  </div>
  <div style="padding:0 24px 16px;">
    <h2 style="font-size:16px;text-transform:uppercase;letter-spacing:-0.3px;margin:0;color:#fff;font-weight:800;line-height:1.3;">${safeHeadline}</h2>
    <p style="margin:8px 0 0;font-size:13px;color:#cbd5e1;line-height:1.6;">${safeSubheadline}</p>
  </div>
  <div style="margin:0 16px 16px;">
    <table width="100%" cellpadding="0" cellspacing="6"><tr>
      <td style="background:rgba(8,145,178,0.2);border:1px solid rgba(34,211,238,0.35);border-radius:8px;padding:10px;vertical-align:top;">
        <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#67e8f9;font-weight:700;">Commercial Impact</div>
        <div style="font-size:11px;color:#e2e8f0;margin-top:6px;line-height:1.4;">Grow throughput without adding dock-office headcount.</div>
      </td>
      <td style="background:rgba(30,58,138,0.2);border:1px solid rgba(96,165,250,0.35);border-radius:8px;padding:10px;vertical-align:top;">
        <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;font-weight:700;">Operational Control</div>
        <div style="font-size:11px;color:#e2e8f0;margin-top:6px;line-height:1.4;">Standardize gate-to-dock execution across sites.</div>
      </td>
      <td style="background:rgba(6,95,70,0.2);border:1px solid rgba(52,211,153,0.35);border-radius:8px;padding:10px;vertical-align:top;">
        <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6ee7b7;font-weight:700;">Executive Visibility</div>
        <div style="font-size:11px;color:#e2e8f0;margin-top:6px;line-height:1.4;">Create board-ready proof of dwell and margin lift.</div>
      </td>
    </tr></table>
  </div>
  <div style="margin:0 16px;border:1px solid rgba(71,85,105,0.5);border-radius:8px;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="30%" style="vertical-align:top;border-right:1px solid rgba(71,85,105,0.5);">
        <div style="background:rgba(127,29,29,0.35);padding:8px;text-align:center;border-bottom:1px solid rgba(71,85,105,0.3);"><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#fca5a5;text-transform:uppercase;">Typical Reality</span></div>
        <div style="padding:12px;">${painHtml}</div>
      </td>
      <td width="40%" style="vertical-align:top;border-right:1px solid rgba(71,85,105,0.5);">
        <div style="background:rgba(30,58,138,0.35);padding:8px;text-align:center;border-bottom:1px solid rgba(71,85,105,0.3);"><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#93c5fd;text-transform:uppercase;">Standardized Operating Protocol</span></div>
        <div style="padding:12px;">${stepsHtml}</div>
      </td>
      <td width="30%" style="vertical-align:top;">
        <div style="background:rgba(6,78,59,0.35);padding:8px;text-align:center;border-bottom:1px solid rgba(71,85,105,0.3);"><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6ee7b7;text-transform:uppercase;">YardFlow Effect</span></div>
        <div style="padding:12px;">${outcomesHtml}</div>
      </td>
    </tr></table>
  </div>
  <div style="margin:16px 16px 0;text-align:center;">
    <span style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#94a3b8;font-weight:700;border-top:1px solid #475569;border-bottom:1px solid #475569;padding:6px 20px;display:inline-block;">Proof from Live Deployment</span>
  </div>
  <div style="margin:12px 16px 0;"><table width="100%" cellpadding="0" cellspacing="6"><tr>${statsHtml}</tr></table></div>
  <div style="margin:16px 16px;background:rgba(30,41,59,0.3);border-radius:8px;padding:12px 16px;border-left:3px solid rgba(34,211,238,0.5);">
    <p style="font-size:12px;color:#cbd5e1;font-style:italic;margin:0;line-height:1.6;">"${safeQuote}"</p>
  </div>
  <div style="padding:16px 24px;border-top:1px solid rgba(51,65,85,0.5);">
    <p style="font-size:11px;color:#cbd5e1;margin:0 0 6px;line-height:1.5;"><strong style="color:#f1f5f9;">Best fit:</strong> ${safeBestFit}</p>
    ${publicContextHtml}
  </div>
  <div style="margin:0 16px 16px;background:rgba(8,145,178,0.15);border:1px solid rgba(34,211,238,0.35);border-radius:8px;padding:12px;">
    <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#67e8f9;font-weight:700;">Suggested Next Step</div>
    <p style="font-size:11px;color:#e2e8f0;margin:6px 0 0;line-height:1.5;">Run a 20-minute YardFlow Throughput Benchmark for ${safeAccountName} to map current dwell loss and quantify fast-win value.</p>
  </div>
</div>
</body></html>`;
}

export function OnePagerDialog({
  accountName,
  trigger,
  variant = 'dialog',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: OnePagerPreviewProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = variant === 'dialog' ? (controlledOpen ?? internalOpen) : true;
  const setOpen = variant === 'dialog' ? (controlledOnOpenChange ?? setInternalOpen) : () => {};
  const [data, setData] = useState<OnePagerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPlaybook, setSavingPlaybook] = useState(false);
  const [useLiveIntel, setUseLiveIntel] = useState(true);
  const [agentContext, setAgentContext] = useState<Pick<AgentActionResult, 'provider' | 'summary' | 'nextActions' | 'freshness'> | null>(null);

  async function generate() {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch('/api/ai/one-pager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, useLiveIntel }),
      });
      const json = await res.json() as { content?: OnePagerData; error?: string; agentContext?: Pick<AgentActionResult, 'provider' | 'summary' | 'nextActions' | 'freshness'> };
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      if (!json.content) throw new Error('Could not parse structured one-pager content');
      setData(json.content);
      setAgentContext(json.agentContext ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'One-pager generation failed');
    } finally {
      setLoading(false);
    }
  }

  function copyHtml() {
    if (!data) return;
    const html = onePagerToHtml(data, accountName);
    navigator.clipboard.writeText(html);
    toast.success('HTML copied to clipboard — paste into email or save as .html');
  }

  function downloadHtml() {
    if (!data) return;
    const html = onePagerToHtml(data, accountName);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${accountName.toLowerCase().replace(/\s+/g, '-')}-yardflow-one-pager.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  }

  async function saveAsPlaybookBlock() {
    if (!data || savingPlaybook) return;
    setSavingPlaybook(true);
    try {
      const response = await fetch('/api/revops/playbook-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${accountName} one-pager block`,
          body: JSON.stringify(data),
          blockType: 'one-pager',
          accountName,
          stage: 'one_pager',
          createdBy: 'Casey',
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(payload.error ?? 'Failed to save playbook block');
      toast.success('Saved as playbook block');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save playbook block');
    } finally {
      setSavingPlaybook(false);
    }
  }

  // Shared content for both dialog and inline modes
  const content = (
    <>
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mb-4 flex items-center gap-2 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useLiveIntel} onChange={(event) => setUseLiveIntel(event.target.checked)} />
            Use latest live intel
          </label>
        </div>
        {agentContext ? (
          <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Context used</span>
              <span className="rounded bg-background px-2 py-0.5 font-mono">{agentContext.provider}</span>
              <span className="rounded bg-background px-2 py-0.5 font-mono">{agentContext.freshness.source}</span>
            </div>
            <p className="mt-2">{agentContext.summary}</p>
          </div>
        ) : null}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse py-20 justify-center">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating custom one-pager with Gemini...
          </div>
        )}
        {!loading && data && <OnePagerPreview data={data} accountName={accountName} />}
        {!loading && !data && (
          <div className="flex flex-col items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-md py-20 gap-3">
            <FileImage className="h-8 w-8 text-muted-foreground/50" />
            <p>Generate a custom YardFlow one-pager tailored to {accountName}&apos;s business case</p>
            <Button onClick={generate} className="gap-2 mt-2">
              <FileImage className="h-4 w-4" />
              Generate One-Pager
            </Button>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
        <Button onClick={generate} disabled={loading} variant={data ? 'outline' : 'default'} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {data ? 'Regenerate' : 'Generate'}
        </Button>
        {data && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyHtml} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy HTML
            </Button>
            <Button variant="outline" size="sm" onClick={downloadHtml} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={saveAsPlaybookBlock} className="gap-1.5" disabled={savingPlaybook}>
              <Library className="h-3.5 w-3.5" /> {savingPlaybook ? 'Saving...' : 'Save as Playbook Block'}
            </Button>
            <Button size="sm" className="gap-1.5" asChild>
              <Link href={`/generated-content?account=${encodeURIComponent(accountName)}`}>
                Open Workspace
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );

  if (variant === 'inline') {
    return (
      <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
        {content}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileImage className="h-3.5 w-3.5" />
            One-Pager
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-blue-500" />
            YardFlow One-Pager — {accountName}
          </DialogTitle>
        </DialogHeader>

        {content}
      </DialogContent>
    </Dialog>
  );
}
