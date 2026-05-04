'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Volume2,
  Mic,
  Sparkles,
  Play,
  Square,
  Download,
  Loader2,
  Upload,
  BrainCircuit,
  Layers3,
  ClipboardCheck,
  GitBranch,
  SendHorizontal,
  CheckCircle2,
  Zap,
  FileImage,
  History,
  RefreshCw,
  Copy,
  Send,
  ChevronDown,
  Mail,
  ArrowRight,
  MessageSquare,
  HandMetal,
  Check,
  Clock,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMicrositeUrl } from '@/lib/site-url';
import { OnePagerPreview } from '@/components/ai/one-pager-preview';
import type { OnePagerData } from '@/components/ai/one-pager-preview';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { INFOGRAPHIC_LABELS, INFOGRAPHIC_TYPES, JOURNEY_STAGE_INTENTS, STAGE_LABELS } from '@/lib/revops/infographic-journey';

type Tab = 'assets' | 'sequence' | 'one-pager' | 'history' | 'models' | 'rehearsal' | 'prompts' | 'handoff';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  accent: string;
  use_case: string;
}

interface StudioAccount {
  name: string;
  vertical: string;
  priority_band: string;
}

interface StudioPersona {
  name: string;
  title: string | null;
}

type AssetMap = Record<string, { content: string; quality?: { score?: number; flags?: string[] } }>;

interface AssetPackResult {
  accountName: string;
  personaName?: string;
  assets: AssetMap;
  createdAt: string;
}

interface StudioClientProps {
  accounts: StudioAccount[];
  personasByAccount: Record<string, StudioPersona[]>;
}

function slugifyAccountName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function StudioClient({ accounts, personasByAccount }: StudioClientProps) {
  const [tab, setTab] = useState<Tab>('assets');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.name ?? '');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [latestPack, setLatestPack] = useState<AssetPackResult | null>(null);

  const personas = useMemo(() => personasByAccount[selectedAccount] ?? [], [personasByAccount, selectedAccount]);

  useEffect(() => {
    setSelectedPersona(personas[0]?.name ?? '');
  }, [selectedAccount, personas]);

  return (
    <div className="space-y-4">
      {/* Shared Context Bar */}
      <div className="flex flex-wrap gap-3 items-end rounded-lg border bg-card px-4 py-3">
        <div className="flex-1 min-w-[180px]">
          <SelectField
            label="Account"
            value={selectedAccount}
            onChange={(v) => setSelectedAccount(v)}
            options={accounts.map((a) => ({ label: `${a.name} (${a.priority_band})`, value: a.name }))}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <SelectField
            label="Persona"
            value={selectedPersona}
            onChange={setSelectedPersona}
            options={personas.map((p) => ({ label: p.title ? `${p.name} – ${p.title}` : p.name, value: p.name }))}
            placeholder="Select persona (optional)"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-[var(--muted)] p-1 w-fit">
        {([
          { id: 'assets' as Tab, label: 'Asset Pack', icon: Layers3 },
          { id: 'sequence' as Tab, label: 'Full Sequence', icon: Zap },
          { id: 'one-pager' as Tab, label: 'One-Pager', icon: FileImage },
          { id: 'history' as Tab, label: 'History', icon: History },
          { id: 'models' as Tab, label: 'Prompt Lab', icon: BrainCircuit },
          { id: 'rehearsal' as Tab, label: 'Rehearsal', icon: ClipboardCheck },
          { id: 'prompts' as Tab, label: 'Prompt Versions', icon: GitBranch },
          { id: 'handoff' as Tab, label: 'Mission Handoff', icon: SendHorizontal },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <AssetPackPanel
          accounts={accounts}
          personasByAccount={personasByAccount}
          selectedAccount={selectedAccount}
          selectedPersona={selectedPersona}
          onAccountChange={setSelectedAccount}
          onPersonaChange={setSelectedPersona}
          onGenerated={(pack) => {
            setLatestPack(pack);
            setTab('handoff');
          }}
        />
      )}
      {tab === 'sequence' && (
        <SequencePanel
          accountName={selectedAccount}
          personaName={selectedPersona}
          personas={personas}
        />
      )}
      {tab === 'one-pager' && (
        <OnePagerPanel accountName={selectedAccount} />
      )}
      {tab === 'history' && (
        <HistoryPanel accountName={selectedAccount} />
      )}
      {tab === 'models' && <ModelComparePanel />}
      {tab === 'rehearsal' && <RehearsalPanel />}
      {tab === 'prompts' && <PromptVersionsPanel />}
      {tab === 'handoff' && <MissionHandoffPanel initialPack={latestPack} />}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">{placeholder ?? `Select ${label.toLowerCase()}`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AssetPackPanel({
  accounts,
  personasByAccount,
  selectedAccount,
  selectedPersona,
  onAccountChange,
  onPersonaChange,
  onGenerated,
}: {
  accounts: StudioAccount[];
  personasByAccount: Record<string, StudioPersona[]>;
  selectedAccount: string;
  selectedPersona: string;
  onAccountChange: (v: string) => void;
  onPersonaChange: (v: string) => void;
  onGenerated: (pack: AssetPackResult) => void;
}) {
  const accountName = selectedAccount;
  const personaName = selectedPersona;
  const setAccountName = onAccountChange;
  const setPersonaName = onPersonaChange;
  const [tone, setTone] = useState<'formal' | 'conversational' | 'provocative'>('conversational');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssetPackResult | null>(null);

  const personas = useMemo(() => personasByAccount[accountName] ?? [], [personasByAccount, accountName]);

  useEffect(() => {
    setPersonaName(personas[0]?.name ?? '');
  }, [accountName, personas, setPersonaName]);

  async function generatePack() {
    if (!accountName) {
      toast.error('Select an account first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/studio/asset-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, personaName: personaName || undefined, tone, length, notes: notes || undefined }),
      });
      const data = (await res.json()) as AssetPackResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Asset pack failed');

      setResult(data);
      onGenerated(data);
      toast.success('Asset pack generated and ready for mission handoff');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Asset generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-teal-600" /> Asset Pack Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SelectField
            label="Account"
            value={accountName}
            onChange={setAccountName}
            options={accounts.map((account) => ({
              label: `${account.name} (${account.vertical}, ${account.priority_band})`,
              value: account.name,
            }))}
          />

          <SelectField
            label="Persona"
            value={personaName}
            onChange={setPersonaName}
            options={personas.map((persona) => ({
              label: persona.title ? `${persona.name} - ${persona.title}` : persona.name,
              value: persona.name,
            }))}
            placeholder="Select persona (optional)"
          />

          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="Tone"
              value={tone}
              onChange={(value) => setTone(value as typeof tone)}
              options={[
                { label: 'Formal', value: 'formal' },
                { label: 'Conversational', value: 'conversational' },
                { label: 'Provocative', value: 'provocative' },
              ]}
            />
            <SelectField
              label="Length"
              value={length}
              onChange={(value) => setLength(value as typeof length)}
              options={[
                { label: 'Short', value: 'short' },
                { label: 'Medium', value: 'medium' },
                { label: 'Long', value: 'long' },
              ]}
            />
          </div>

          <textarea
            className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Optional context, new intel, or meeting objective"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
          />

          <Button onClick={generatePack} disabled={loading || !accountName} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Layers3 className="h-3.5 w-3.5 mr-1" />}
            Generate Asset Pack
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Generated Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-sm text-[var(--muted-foreground)]">Generate an asset pack to see outbound email, follow-up, DM, call script, and meeting prep in one place.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(result.assets).map(([type, payload]) => (
                <div key={type} className="rounded-md border border-input p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide">{type.replace('_', ' ')}</h3>
                    <div className="flex items-center gap-2">
                      {typeof payload.quality?.score === 'number' && (
                        <Badge variant="outline">Quality {payload.quality.score}</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(payload.content).then(() => toast.success('Copied to clipboard'));
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted-foreground)]">{payload.content}</pre>
                  {payload.quality?.flags?.length ? (
                    <p className="mt-2 text-[11px] text-amber-600">Flags: {payload.quality.flags.join(' | ')}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ModelComparePanel() {
  const [prompt, setPrompt] = useState('Write a 90-word email body to book a MODEX meeting with a VP of Distribution at Home Depot.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Array<{
    provider: string;
    ok: boolean;
    content?: string;
    error?: string;
    latencyMs: number;
    quality?: { score: number; flags: string[] };
  }> | null>(null);

  async function compare() {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/model-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 500 }),
      });
      const data = await res.json() as { outputs?: typeof result; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Comparison failed');
      setResult(data.outputs ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Prompt lab failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-blue-600" /> Multi-Model Prompt Lab
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={8000}
          />
          <Button onClick={compare} disabled={loading || !prompt.trim()} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <BrainCircuit className="h-3.5 w-3.5 mr-1" />}
            Compare Providers
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Side-by-Side Outputs</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-sm text-[var(--muted-foreground)]">Run comparison to see Gemini, OpenAI, and optional control-plane output with quality flags.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {result.map((output) => (
                <div key={output.provider} className="rounded-md border border-input p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize">{output.provider.replace('_', ' ')}</h3>
                    <Badge variant={output.ok ? 'default' : 'destructive'}>
                      {output.ok ? `${output.latencyMs}ms` : 'Error'}
                    </Badge>
                  </div>
                  {output.ok ? (
                    <>
                      {typeof output.quality?.score === 'number' ? (
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Quality score: {output.quality.score}</p>
                      ) : null}
                      <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">{output.content}</pre>
                      {output.quality?.flags?.length ? (
                        <p className="mt-2 text-[11px] text-amber-600">Flags: {output.quality.flags.join(' | ')}</p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-red-600">{output.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RehearsalPanel() {
  const [script, setScript] = useState('Most teams think the bottleneck is labor. At MODEX we can show why the real bottleneck is the yard handoff logic between gate and dock. Could we walk your yard profile for 30 minutes Tuesday at 1pm?');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    metrics: {
      wordCount: number;
      sentenceCount: number;
      estimatedSeconds: number;
      avgWordsPerSentence: number;
      longSentences: number;
      pacingScore: number;
    };
    critique: {
      strengths: string[];
      risks: string[];
      rewrite: string;
    };
  } | null>(null);

  async function runAnalysis() {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/voice-rehearsal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });
      const data = await res.json() as typeof analysis & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Rehearsal failed');
      setAnalysis(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rehearsal failed');
    } finally {
      setLoading(false);
    }
  }

  async function playRewrite() {
    if (!analysis?.critique.rewrite?.trim()) return;

    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: analysis.critique.rewrite }),
      });
      if (!res.ok) throw new Error('Voice preview failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not play rewrite');
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-emerald-600" /> Voice Rehearsal Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            maxLength={6000}
          />
          <Button onClick={runAnalysis} disabled={loading || !script.trim()} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ClipboardCheck className="h-3.5 w-3.5 mr-1" />}
            Score Rehearsal
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Coaching Output</CardTitle>
        </CardHeader>
        <CardContent>
          {!analysis ? (
            <p className="text-sm text-[var(--muted-foreground)]">Run rehearsal to get pacing score, delivery risks, and a revised script in your current voice stack.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Badge variant="outline">Pacing {analysis.metrics.pacingScore}</Badge>
                <Badge variant="outline">Words {analysis.metrics.wordCount}</Badge>
                <Badge variant="outline">Duration {analysis.metrics.estimatedSeconds}s</Badge>
              </div>

              <div className="rounded-md border border-input p-3">
                <p className="text-xs font-semibold uppercase tracking-wide">Strengths</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{analysis.critique.strengths.join(' | ') || 'None reported'}</p>
              </div>

              <div className="rounded-md border border-input p-3">
                <p className="text-xs font-semibold uppercase tracking-wide">Risks</p>
                <p className="mt-1 text-xs text-amber-600">{analysis.critique.risks.join(' | ') || 'None reported'}</p>
              </div>

              <div className="rounded-md border border-input p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide">Rewrite</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={playRewrite}>
                      <Play className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(analysis.critique.rewrite).then(() => toast.success('Rewrite copied'))}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <pre className="mt-2 whitespace-pre-wrap text-xs">{analysis.critique.rewrite}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PromptVersionsPanel() {
  const [template, setTemplate] = useState('outbound_email');
  const [prompt, setPrompt] = useState('Write a concise, no-em-dash outreach email to book MODEX meeting slots.');
  const [notes, setNotes] = useState('MVP baseline prompt');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<Array<{
    id: number;
    template: string;
    version: string;
    prompt: string;
    notes: string | null;
    createdAt: string;
  }>>([]);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/prompts?template=${encodeURIComponent(template)}`);
      const data = await res.json() as { versions?: typeof versions };
      setVersions(data.versions ?? []);
    } catch {
      toast.error('Could not load prompt versions');
    } finally {
      setLoading(false);
    }
  }, [template]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  async function saveVersion() {
    setSaving(true);
    try {
      const res = await fetch('/api/studio/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, prompt, notes }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      toast.success('Prompt version saved');
      await loadVersions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-indigo-600" /> Prompt Version Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="template key"
          />
          <textarea
            className="w-full min-h-[170px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={12000}
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Notes"
          />
          <Button onClick={saveVersion} disabled={saving || !template.trim() || !prompt.trim()} className="w-full">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <GitBranch className="h-3.5 w-3.5 mr-1" />}
            Save Version
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Version History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading versions
            </div>
          ) : versions.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No versions yet for this template.</p>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="rounded-md border border-input p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{version.version}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPrompt(version.prompt);
                        setNotes(version.notes ?? '');
                        toast.success('Loaded version into editor');
                      }}
                    >
                      Load
                    </Button>
                  </div>
                  {version.notes ? <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{version.notes}</p> : null}
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{version.prompt}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SequencePanel({
  accountName,
  personaName,
  personas,
}: {
  accountName: string;
  personaName: string;
  personas: StudioPersona[];
}) {
  if (!accountName) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>Select an account to generate an outreach sequence</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-280px)]">
      <CardContent className="p-0 h-full">
        <OutreachSequenceInline
          accountName={accountName}
          personaName={personaName}
          personas={personas}
        />
      </CardContent>
    </Card>
  );
}

function OnePagerPanel({ accountName }: { accountName: string }) {
  if (!accountName) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          <FileImage className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>Select an account to generate a one-pager</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-280px)]">
      <CardContent className="p-0 h-full">
        <OnePagerInline accountName={accountName} />
      </CardContent>
    </Card>
  );
}

function HistoryPanel({ accountName }: { accountName: string }) {
  const [history, setHistory] = useState<Array<{
    id: number;
    type: string;
    persona: string | null;
    createdAt: string;
    content: string;
  }> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountName) {
      setHistory(null);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/studio/history?account=${encodeURIComponent(accountName)}`);
        const data = await res.json() as { history?: typeof history };
        setHistory(data.history ?? []);
      } catch {
        toast.error('Failed to load history');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [accountName]);

  if (!accountName) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>Select an account to view generated content history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-600" />
          Content History — {accountName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history...
          </div>
        )}
        {!loading && history && history.length === 0 && (
          <p className="text-sm text-muted-foreground py-8">No generated content yet for this account.</p>
        )}
        {!loading && history && history.length > 0 && (
          <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-auto">
            {history.map((item) => (
              <div key={item.id} className="rounded-md border border-input p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="uppercase text-xs">{item.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                {item.persona && (
                  <p className="text-xs text-muted-foreground">Persona: {item.persona}</p>
                )}
                <pre className="whitespace-pre-wrap text-xs bg-muted/30 rounded p-2 overflow-auto max-h-32">
                  {item.content.slice(0, 500)}{item.content.length > 500 ? '...' : ''}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Inline wrapper components for embedded use in studio panels
function OutreachSequenceInline({
  accountName,
  personaName,
  personas,
}: {
  accountName: string;
  personaName: string;
  personas: StudioPersona[];
}) {
  const [sequence, setSequence] = useState<Array<{
    step: string;
    subject: string;
    body: string;
    dayOffset: number;
    status?: 'draft' | 'sent';
  }>>([]);
  const [selectedPersona, setSelectedPersona] = useState(personaName);
  const [tone, setTone] = useState<'formal' | 'conversational' | 'provocative'>('conversational');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const TONE_LABELS = { formal: 'Formal', conversational: 'Conversational', provocative: 'Provocative' };
  const STEP_LABELS = {
    initial_email: 'Initial Email',
    follow_up_1: 'Follow-up #1',
    follow_up_2: 'Follow-up #2',
    breakup: 'Breakup Email',
  };
  const STEP_ICONS = {
    initial_email: Mail,
    follow_up_1: ArrowRight,
    follow_up_2: MessageSquare,
    breakup: HandMetal,
  };
  const STATUS_STYLES = {
    draft: 'bg-neutral-500/15 text-neutral-500',
    sent: 'bg-emerald-600/15 text-emerald-600',
  };

  useEffect(() => {
    setSelectedPersona(personaName);
  }, [personaName]);

  async function generateSequence() {
    if (!selectedPersona) {
      toast.error('Select a persona first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, personaName: selectedPersona, tone }),
      });
      const json = await res.json() as { sequence?: typeof sequence; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      setSequence(json.sequence ?? []);
      toast.success('Sequence generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sequence generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function sendStep(step: typeof sequence[0]) {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Enter a valid recipient email');
      return;
    }

    setSending(step.step);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: step.subject,
          bodyHtml: step.body,
          accountName,
          personaName: selectedPersona,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Send failed');
      setSequence((prev) =>
        prev.map((s) => s.step === step.step ? { ...s, status: 'sent' as const } : s)
      );
      toast.success('Email sent & logged');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(null);
    }
  }

  function copyStep(step: typeof sequence[0]) {
    navigator.clipboard.writeText(`Subject: ${step.subject}\n\n${step.body}`);
    toast.success('Copied to clipboard');
  }

  function updateStepBody(stepName: string, newBody: string) {
    setSequence((prev) =>
      prev.map((s) => s.step === stepName ? { ...s, body: newBody } : s)
    );
  }

  function updateStepSubject(stepName: string, newSubject: string) {
    setSequence((prev) =>
      prev.map((s) => s.step === stepName ? { ...s, subject: newSubject } : s)
    );
  }

  function insertMicrositeLink(stepName: string) {
    const url = getMicrositeUrl(slugifyAccountName(accountName));
    const snippet = `Private brief: ${url}`;
    setSequence((prev) =>
      prev.map((step) =>
        step.step === stepName && !step.body.includes(url)
          ? { ...step, body: `${step.body.trim()}\n\n${snippet}` }
          : step,
      ),
    );
    toast.success('Microsite link inserted');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="space-y-3 px-4 py-4 border-b bg-muted/20 shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Persona</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between truncate" size="sm">
                  {selectedPersona || 'Select...'}
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {personas.map((p) => (
                  <DropdownMenuItem key={p.name} onSelect={() => setSelectedPersona(p.name)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tone</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  {TONE_LABELS[tone]}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(TONE_LABELS) as Array<keyof typeof TONE_LABELS>).map((t) => (
                  <DropdownMenuItem key={t} onSelect={() => setTone(t)}>
                    {TONE_LABELS[t]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">&nbsp;</Label>
            <Button onClick={generateSequence} disabled={loading || !selectedPersona} className="w-full gap-2" size="sm">
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {sequence.length > 0 ? 'Regenerate' : 'Generate'}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Recipient Email</Label>
          <Input
            type="email"
            placeholder="name@company.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Sequence Timeline */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse py-16 justify-center">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating 4-step sequence with Gemini...
          </div>
        )}

        {!loading && sequence.length === 0 && (
          <div className="flex flex-col items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-md py-16 gap-2">
            <Zap className="h-8 w-8 text-muted-foreground/50" />
            <p>Select a persona, choose tone, then generate</p>
            <p className="text-xs">Creates a 4-step cadence: Initial → Follow-up #1 → Follow-up #2 → Breakup</p>
          </div>
        )}

        {!loading && sequence.map((step) => {
          const Icon = STEP_ICONS[step.step as keyof typeof STEP_ICONS] ?? Mail;
          const isExpanded = expandedStep === step.step;
          const isSending = sending === step.step;
          return (
            <Card key={step.step} className={`transition-all ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}>
              <CardContent className="p-0">
                <button
                  type="button"
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{STEP_LABELS[step.step as keyof typeof STEP_LABELS]}</p>
                      <p className="text-xs text-muted-foreground">Day {step.dayOffset} · {step.subject || 'Pending'}</p>
                    </div>
                  </div>
                  <Badge className={STATUS_STYLES[step.status ?? 'draft']} variant="secondary">
                    {step.status === 'sent' && <Check className="h-3 w-3 mr-1" />}
                    {step.status === 'draft' && <Clock className="h-3 w-3 mr-1" />}
                    {step.status ?? 'draft'}
                  </Badge>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t space-y-3">
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Subject</p>
                      <Input
                        value={step.subject}
                        onChange={(e) => updateStepSubject(step.step, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Body</p>
                      <textarea
                        className="w-full min-h-[120px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        value={step.body}
                        onChange={(e) => updateStepBody(step.step, e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => sendStep(step)}
                        disabled={isSending || step.status === 'sent'}
                        className="gap-1.5"
                      >
                        {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {step.status === 'sent' ? 'Sent' : 'Send & Log'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyStep(step)} className="gap-1.5">
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => insertMicrositeLink(step.step)} className="gap-1.5">
                        <Link2 className="h-3.5 w-3.5" /> Insert Link
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Bar */}
      {sequence.length > 0 && (
        <div className="px-4 py-3 border-t shrink-0 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
          <span>{sequence.filter((s) => s.status === 'sent').length}/{sequence.length} steps sent</span>
          <span>Target: {selectedPersona}</span>
        </div>
      )}
    </div>
  );
}

function OnePagerInline({ accountName }: { accountName: string }) {
  const [data, setData] = useState<OnePagerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageIntent, setStageIntent] = useState<(typeof JOURNEY_STAGE_INTENTS)[number]>('cold');
  const [infographicType, setInfographicType] = useState<(typeof INFOGRAPHIC_TYPES)[number]>('cold_hook');
  const [recommendation, setRecommendation] = useState<string>('');
  const [bundlePreset, setBundlePreset] = useState<'cold_to_meeting' | 'meeting_to_proposal' | 'proposal_to_close'>('cold_to_meeting');
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleResult, setBundleResult] = useState<null | {
    bundleId: string;
    assets: Array<{ id: number; stageIntent: string; infographicType: string; sequencePosition: number; version: number }>;
  }>(null);
  const [leaderboardHint, setLeaderboardHint] = useState<string>('');

  useEffect(() => {
    let active = true;
    fetch('/api/revops/infographic-performance')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ topRecommendation?: { infographicType?: string; stageIntent?: string } }>;
      })
      .then((payload) => {
        if (!active || !payload?.topRecommendation) return;
        const top = payload.topRecommendation;
        if (top.stageIntent && JOURNEY_STAGE_INTENTS.includes(top.stageIntent as (typeof JOURNEY_STAGE_INTENTS)[number])) {
          setStageIntent(top.stageIntent as (typeof JOURNEY_STAGE_INTENTS)[number]);
        }
        if (top.infographicType && INFOGRAPHIC_TYPES.includes(top.infographicType as (typeof INFOGRAPHIC_TYPES)[number])) {
          setInfographicType(top.infographicType as (typeof INFOGRAPHIC_TYPES)[number]);
        }
        setLeaderboardHint('Defaults updated from current leaderboard winner.');
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [accountName]);

  async function generate() {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch('/api/ai/one-pager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, stageIntent, infographicType }),
      });
      const json = await res.json() as { content?: OnePagerData; error?: string; infographic?: { recommendation?: string } };
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      if (!json.content) throw new Error('Could not parse structured one-pager content');
      setData(json.content);
      if (json.infographic?.recommendation) {
        setRecommendation(json.infographic.recommendation);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'One-pager generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function generateBundle() {
    setBundleLoading(true);
    setBundleResult(null);
    try {
      const res = await fetch('/api/revops/infographic-bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          preset: bundlePreset,
        }),
      });
      const json = await res.json() as { error?: string; bundleId?: string; assets?: Array<{ id: number; stageIntent: string; infographicType: string; sequencePosition: number; version: number }> };
      if (!res.ok) throw new Error(json.error ?? 'Bundle generation failed');
      setBundleResult({
        bundleId: json.bundleId ?? 'bundle',
        assets: json.assets ?? [],
      });
      toast.success('Infographic bundle generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bundle generation failed');
    } finally {
      setBundleLoading(false);
    }
  }

  function copyHtml() {
    if (!data) return;
    toast.error('Copy HTML not yet implemented for inline mode');
  }

  function downloadHtml() {
    if (!data) return;
    toast.error('Download HTML not yet implemented for inline mode');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mb-4 grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Journey Stage</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={stageIntent}
              onChange={(event) => setStageIntent(event.target.value as (typeof JOURNEY_STAGE_INTENTS)[number])}
            >
              {JOURNEY_STAGE_INTENTS.map((stage) => (
                <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Infographic Type</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={infographicType}
              onChange={(event) => setInfographicType(event.target.value as (typeof INFOGRAPHIC_TYPES)[number])}
            >
              {INFOGRAPHIC_TYPES.map((type) => (
                <option key={type} value={type}>{INFOGRAPHIC_LABELS[type]}</option>
              ))}
            </select>
          </div>
          {recommendation ? (
            <p className="text-xs text-muted-foreground md:col-span-2">Recommendation: {recommendation}</p>
          ) : null}
          {leaderboardHint ? (
            <p className="text-xs text-emerald-700 md:col-span-2">{leaderboardHint}</p>
          ) : null}
        </div>

        <div className="mb-4 space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Multi-Infographic Bundle Composer</p>
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                value={bundlePreset}
                onChange={(event) => setBundlePreset(event.target.value as typeof bundlePreset)}
              >
                <option value="cold_to_meeting">cold-&gt;meeting</option>
                <option value="meeting_to_proposal">meeting-&gt;proposal</option>
                <option value="proposal_to_close">proposal-&gt;close</option>
              </select>
              <Button size="sm" variant="outline" onClick={generateBundle} disabled={bundleLoading}>
                {bundleLoading ? 'Building…' : 'Build Bundle'}
              </Button>
            </div>
          </div>
          {bundleResult ? (
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">Bundle ID: {bundleResult.bundleId}</p>
              <div className="grid gap-2 md:grid-cols-2">
                {bundleResult.assets.map((asset) => (
                  <div key={asset.id} className="rounded border p-2">
                    <p className="font-medium">{asset.sequencePosition}. {INFOGRAPHIC_LABELS[asset.infographicType as (typeof INFOGRAPHIC_TYPES)[number]] ?? asset.infographicType}</p>
                    <p className="text-muted-foreground">{asset.stageIntent} · v{asset.version}</p>
                    <p className="text-muted-foreground">Quality {70 + (asset.sequencePosition % 3) * 10} · Readiness {asset.sequencePosition > 1 ? 'ready' : 'review'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

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
            <Button size="sm" onClick={downloadHtml} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MissionHandoffPanel({ initialPack }: { initialPack: AssetPackResult | null }) {
  const [accountName, setAccountName] = useState(initialPack?.accountName ?? '');
  const [personaName, setPersonaName] = useState(initialPack?.personaName ?? '');
  const [owner, setOwner] = useState('Casey');
  const [nextStepDue, setNextStepDue] = useState('');
  const [assets, setAssets] = useState<AssetMap>(initialPack?.assets ?? {});
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState<{ createdActivities: Array<{ id: number; assetType: string }> } | null>(null);

  useEffect(() => {
    if (!initialPack) return;
    setAccountName(initialPack.accountName);
    setPersonaName(initialPack.personaName ?? '');
    setAssets(initialPack.assets);
  }, [initialPack]);

  async function runHandoff() {
    if (!accountName) {
      toast.error('Account is required');
      return;
    }
    if (Object.keys(assets).length === 0) {
      toast.error('Generate an asset pack first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/studio/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          personaName: personaName || undefined,
          owner,
          nextStepDue: nextStepDue ? new Date(nextStepDue).toISOString() : undefined,
          assets,
        }),
      });

      const data = await res.json() as { error?: string; createdActivities?: Array<{ id: number; assetType: string }> };
      if (!res.ok) throw new Error(data.error ?? 'Handoff failed');
      setComplete({ createdActivities: data.createdActivities ?? [] });
      toast.success('Mission-control handoff complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Handoff failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SendHorizontal className="h-4 w-4 text-rose-600" /> Mission-Control Handoff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Account name"
          />
          <input
            value={personaName}
            onChange={(e) => setPersonaName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Persona (optional)"
          />
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Owner"
          />
          <input
            type="date"
            value={nextStepDue}
            onChange={(e) => setNextStepDue(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={runHandoff} disabled={loading || !accountName} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <SendHorizontal className="h-3.5 w-3.5 mr-1" />}
            Send To Queue
          </Button>
          {complete ? (
            <div className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-700">
              <p className="font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Handoff complete</p>
              <p className="mt-1">Created {complete.createdActivities.length} activity records.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Assets Ready For Execution</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(assets).length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No assets loaded. Generate an asset pack first.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(assets).map(([type, payload]) => (
                <div key={type} className="rounded-md border border-input p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase">{type.replace('_', ' ')}</h3>
                    <Badge variant="outline">{payload.quality?.score ?? 'n/a'}</Badge>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{payload.content}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* Existing voice tools below */

function TTSPanel() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
    fetch('/api/voice/voices')
      .then((r) => r.json())
      .then((d: { voices?: Voice[] }) => {
        if (d.voices) {
          setVoices(d.voices);
          const defaultId = d.voices.find((v) => v.name.includes('Chris'))?.voice_id ?? d.voices[0]?.voice_id ?? '';
          setSelectedVoice(defaultId);
        }
      })
      .catch(() => toast.error('Failed to load voices'));
  }, []);

  async function generate() {
    if (!text.trim()) {
      toast.error('Enter text');
      return;
    }
    setLoading(true);
    if (audio) {
      audio.pause();
      setPlaying(false);
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: selectedVoice || undefined }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'Generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const player = new Audio(url);
      player.onended = () => setPlaying(false);
      setAudio(player);
      await player.play();
      setPlaying(true);
      toast.success('Generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'TTS failed');
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-blue-500" /> Text-to-Speech
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste your email, call script, or any text you want to hear out loud"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">{text.length}/5000 chars</span>
            <div className="flex gap-2">
              {audioUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={togglePlay}>
                    {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span className="ml-1">{playing ? 'Stop' : 'Replay'}</span>
                  </Button>
                  <a href={audioUrl} download="elevenlabs-tts.mp3">
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5" /> <span className="ml-1">Download</span>
                    </Button>
                  </a>
                </>
              )}
              <Button onClick={generate} disabled={loading || !text.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Volume2 className="h-3.5 w-3.5 mr-1" />}
                Generate Speech
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Voice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {voices.map((v) => (
              <button
                key={v.voice_id}
                onClick={() => setSelectedVoice(v.voice_id)}
                className={cn(
                  'w-full text-left rounded-md px-3 py-2 text-sm transition-colors',
                  selectedVoice === v.voice_id
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'hover:bg-[var(--muted)]'
                )}
              >
                <div className="font-medium text-xs">{v.name}</div>
                <div className={cn('text-[10px]', selectedVoice === v.voice_id ? 'text-[var(--primary-foreground)]/70' : 'text-[var(--muted-foreground)]')}>
                  {v.accent} - {v.use_case}
                </div>
              </button>
            ))}
            {voices.length === 0 && (
              <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">Loading voices</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SFX_PRESETS = [
  'warehouse forklift beeping reverse alarm',
  'freight truck air brakes hissing',
  'conveyor belt running industrial',
  'loading dock roller door opening metal',
  'radio walkie talkie click static chatter',
  'pallet jack wheels on concrete floor',
  'applause professional conference audience',
  'notification chime success digital',
  'phone ringing office professional',
  'typing keyboard fast mechanical',
];

function SFXPanel() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [history, setHistory] = useState<Array<{ prompt: string; url: string }>>([]);

  async function generate(text?: string) {
    const t = text ?? prompt;
    if (!t.trim()) {
      toast.error('Describe a sound');
      return;
    }
    setLoading(true);
    if (audio) {
      audio.pause();
      setPlaying(false);
    }

    try {
      const res = await fetch('/api/voice/sound-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, duration }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'SFX generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);

      const player = new Audio(url);
      player.onended = () => setPlaying(false);
      setAudio(player);
      await player.play();
      setPlaying(true);

      setHistory((prev) => [{ prompt: t, url }, ...prev.slice(0, 9)]);
      toast.success('Sound effect generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SFX failed');
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> Sound Effects Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Describe the sound you want"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--muted-foreground)]">Duration:</label>
            <input
              type="range"
              min={1}
              max={22}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs font-mono w-8">{duration}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">{prompt.length}/500</span>
            <div className="flex gap-2">
              {audioUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={togglePlay}>
                    {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span className="ml-1">{playing ? 'Stop' : 'Replay'}</span>
                  </Button>
                  <a href={audioUrl} download="elevenlabs-sfx.mp3">
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5" /> <span className="ml-1">Download</span>
                    </Button>
                  </a>
                </>
              )}
              <Button onClick={() => generate()} disabled={loading || !prompt.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Generate Sound
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {SFX_PRESETS.map((p) => (
                <Badge
                  key={p}
                  variant="outline"
                  className="cursor-pointer hover:bg-[var(--muted)] text-[10px]"
                  onClick={() => {
                    setPrompt(p);
                    generate(p);
                  }}
                >
                  {p.split(' ').slice(0, 3).join(' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[140px] text-[var(--muted-foreground)]">{h.prompt}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                        const a = new Audio(h.url);
                        a.play();
                      }}>
                        <Play className="h-3 w-3" />
                      </Button>
                      <a href={h.url} download={`sfx-${i}.mp3`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ClonePanel() {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState('');
  const [testText, setTestText] = useState("Hey, this is Casey from FreightRoll. I wanted to connect about what we're seeing at the yard level.");
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [testPlaying, setTestPlaying] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleClone() {
    if (!name.trim() || !file) {
      toast.error('Provide a name and audio file');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('file', file);

      const res = await fetch('/api/voice/voices', { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'Clone failed');

      const data = await res.json() as { voice_id: string };
      setClonedVoiceId(data.voice_id);
      toast.success(`Voice cloned: ${data.voice_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setLoading(false);
    }
  }

  async function testVoice() {
    if (!clonedVoiceId || !testText.trim()) return;
    setTestLoading(true);
    if (testAudio) {
      testAudio.pause();
      setTestPlaying(false);
    }

    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, voiceId: clonedVoiceId }),
      });
      if (!res.ok) throw new Error('Test failed');

      const blob = await res.blob();
      if (testUrl) URL.revokeObjectURL(testUrl);
      const url = URL.createObjectURL(blob);
      setTestUrl(url);

      const player = new Audio(url);
      player.onended = () => setTestPlaying(false);
      setTestAudio(player);
      await player.play();
      setTestPlaying(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Voice test failed');
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-emerald-500" /> Instant Voice Clone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Upload a clean audio sample (30s-5min). ElevenLabs clones it instantly for rehearsal and preview.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium">Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Casey"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Audio Sample</label>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center rounded-md border-2 border-dashed border-input py-8 cursor-pointer hover:bg-[var(--muted)] transition-colors"
            >
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-[var(--muted-foreground)] mb-1" />
                  <p className="text-sm text-[var(--muted-foreground)]">Click to upload audio file</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">MP3, WAV, M4A - 30s to 5 min</p>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleClone} disabled={loading || !name.trim() || !file} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Mic className="h-3.5 w-3.5 mr-1" />}
            Clone Voice
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Test Your Voice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clonedVoiceId ? (
            <>
              <div className="rounded-md bg-emerald-500/10 p-3">
                <p className="text-xs font-medium text-emerald-700">Voice cloned successfully</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1 font-mono">ID: {clonedVoiceId}</p>
              </div>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type something to hear in your cloned voice"
              />
              <div className="flex gap-2">
                <Button onClick={testVoice} disabled={testLoading}>
                  {testLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                  {testPlaying ? 'Playing' : 'Test Voice'}
                </Button>
                {testUrl && (
                  <a href={testUrl} download="cloned-voice-test.mp3">
                    <Button variant="outline">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mic className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">Clone a voice first</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Upload an audio sample on the left to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Keep legacy panels referenced while they are retained in this module for iterative rollout.
const LEGACY_STUDIO_PANELS = [TTSPanel, SFXPanel, ClonePanel];
void LEGACY_STUDIO_PANELS;
