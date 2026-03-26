'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { FileImage, RefreshCw, Copy, Download } from 'lucide-react';

interface OnePagerData {
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

interface OnePagerPreviewProps {
  accountName: string;
  trigger?: React.ReactNode;
}

function OnePagerDocument({ data, accountName }: { data: OnePagerData; accountName: string }) {
  return (
    <div className="one-pager-doc bg-[#0a1628] text-white rounded-xl overflow-hidden text-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-xs tracking-widest text-blue-300 uppercase">For {accountName}</p>
        <h1 className="text-2xl font-bold mt-1 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          YardFlow by FreightRoll
        </h1>
      </div>

      {/* Headline */}
      <div className="px-6 pb-4">
        <h2 className="text-lg font-bold uppercase tracking-tight text-white">
          {data.headline}
        </h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">{data.subheadline}</p>
      </div>

      {/* Three-column: Pain → Solution → Outcomes */}
      <div className="mx-6 rounded-lg border border-slate-600 overflow-hidden">
        <div className="grid grid-cols-3">
          {/* Column 1: Pain Points (red) */}
          <div className="border-r border-slate-600">
            <div className="bg-red-900/60 px-3 py-2 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-red-300">Typical Reality</span>
            </div>
            <div className="px-3 py-3 space-y-2">
              {data.painPoints.map((pain, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-300">
                  <span className="text-red-400 shrink-0">⚠</span>
                  <span>{pain}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Solution Steps (blue) */}
          <div className="border-r border-slate-600">
            <div className="bg-blue-900/60 px-3 py-2 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Standardized Protocol</span>
            </div>
            <div className="px-3 py-3 space-y-2">
              {data.solutionSteps.map((s) => (
                <div key={s.step} className="text-xs">
                  <span className="text-blue-400 font-bold">{s.step}. {s.title}</span>
                  <p className="text-slate-400 mt-0.5">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Outcomes (green) */}
          <div>
            <div className="bg-emerald-900/60 px-3 py-2 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">YardFlow Effect</span>
            </div>
            <div className="px-3 py-3 space-y-2">
              {data.outcomes.map((outcome, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Proof Stats Bar */}
      <div className="mx-6 mt-4">
        <div className="text-center mb-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold border-t border-b border-slate-600 px-4 py-1 inline-block">
            Proof from Live Deployment
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {data.proofStats.map((stat, i) => (
            <div key={i} className="text-center bg-slate-800/60 rounded-lg py-3 px-1">
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div className="mx-6 mt-4 bg-slate-800/40 rounded-lg px-4 py-3 border-l-2 border-blue-400">
        <p className="text-xs text-slate-300 italic">&ldquo;{data.customerQuote}&rdquo;</p>
      </div>

      {/* Best Fit + Context */}
      <div className="px-6 py-4 mt-2 border-t border-slate-700 space-y-1">
        <p className="text-xs text-slate-300"><strong className="text-slate-200">Best fit:</strong> {data.bestFit}</p>
        <p className="text-xs text-slate-400"><strong className="text-slate-300">Public source context:</strong> {data.publicContext}</p>
      </div>
    </div>
  );
}

function onePagerToHtml(data: OnePagerData, accountName: string): string {
  const painHtml = data.painPoints.map((p) => `<div style="display:flex;gap:8px;font-size:12px;color:#cbd5e1;margin-bottom:6px;"><span style="color:#f87171;flex-shrink:0;">⚠</span><span>${p}</span></div>`).join('');
  const stepsHtml = data.solutionSteps.map((s) => `<div style="font-size:12px;margin-bottom:6px;"><span style="color:#60a5fa;font-weight:700;">${s.step}. ${s.title}</span><p style="color:#94a3b8;margin:2px 0 0;">${s.description}</p></div>`).join('');
  const outcomesHtml = data.outcomes.map((o) => `<div style="display:flex;gap:8px;font-size:12px;color:#cbd5e1;margin-bottom:6px;"><span style="color:#34d399;flex-shrink:0;">✓</span><span>${o}</span></div>`).join('');
  const statsHtml = data.proofStats.map((s) => `<td style="text-align:center;background:#1e293b;border-radius:8px;padding:12px 4px;"><div style="font-size:18px;font-weight:700;color:#fff;">${s.value}</div><div style="font-size:10px;color:#94a3b8;">${s.label}</div></td>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>YardFlow — ${accountName}</title></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:680px;margin:0 auto;background:#0a1628;border-radius:12px;overflow:hidden;color:#fff;">
  <div style="padding:24px 24px 16px;">
    <p style="font-size:11px;letter-spacing:3px;color:#93c5fd;text-transform:uppercase;margin:0;">For ${accountName}</p>
    <h1 style="font-size:24px;margin:4px 0 0;color:#60a5fa;">YardFlow by FreightRoll</h1>
  </div>
  <div style="padding:0 24px 16px;">
    <h2 style="font-size:16px;text-transform:uppercase;letter-spacing:-0.5px;margin:0;color:#fff;">${data.headline}</h2>
    <p style="margin:8px 0 0;font-size:13px;color:#cbd5e1;line-height:1.6;">${data.subheadline}</p>
  </div>
  <div style="margin:0 24px;border:1px solid #475569;border-radius:8px;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="33%" style="vertical-align:top;border-right:1px solid #475569;">
        <div style="background:rgba(127,29,29,0.4);padding:8px;text-align:center;"><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#fca5a5;text-transform:uppercase;">Typical Reality</span></div>
        <div style="padding:12px;">${painHtml}</div>
      </td>
      <td width="34%" style="vertical-align:top;border-right:1px solid #475569;">
        <div style="background:rgba(30,58,138,0.4);padding:8px;text-align:center;"><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#93c5fd;text-transform:uppercase;">Standardized Protocol</span></div>
        <div style="padding:12px;">${stepsHtml}</div>
      </td>
      <td width="33%" style="vertical-align:top;">
        <div style="background:rgba(6,78,59,0.4);padding:8px;text-align:center;"><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6ee7b7;text-transform:uppercase;">YardFlow Effect</span></div>
        <div style="padding:12px;">${outcomesHtml}</div>
      </td>
    </tr></table>
  </div>
  <div style="margin:16px 24px 0;text-align:center;">
    <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;font-weight:700;border-top:1px solid #475569;border-bottom:1px solid #475569;padding:4px 16px;display:inline-block;">Proof from Live Deployment</span>
  </div>
  <div style="margin:8px 24px 0;"><table width="100%" cellpadding="0" cellspacing="4"><tr>${statsHtml}</tr></table></div>
  <div style="margin:16px 24px;background:rgba(30,41,59,0.4);border-radius:8px;padding:12px 16px;border-left:2px solid #60a5fa;">
    <p style="font-size:12px;color:#cbd5e1;font-style:italic;margin:0;">"${data.customerQuote}"</p>
  </div>
  <div style="padding:16px 24px;border-top:1px solid #334155;">
    <p style="font-size:11px;color:#cbd5e1;margin:0 0 4px;"><strong style="color:#e2e8f0;">Best fit:</strong> ${data.bestFit}</p>
    <p style="font-size:11px;color:#94a3b8;margin:0;"><strong style="color:#cbd5e1;">Public source context:</strong> ${data.publicContext}</p>
  </div>
</div>
</body></html>`;
}

export function OnePagerDialog({ accountName, trigger }: OnePagerPreviewProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<OnePagerData | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch('/api/ai/one-pager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName }),
      });
      const json = await res.json() as { content?: OnePagerData; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      if (!json.content) throw new Error('Could not parse structured one-pager content');
      setData(json.content);
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

        <div className="flex-1 overflow-auto px-6 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse py-20 justify-center">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating custom one-pager with Gemini...
            </div>
          )}
          {!loading && data && <OnePagerDocument data={data} accountName={accountName} />}
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
              <Button size="sm" onClick={downloadHtml} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
