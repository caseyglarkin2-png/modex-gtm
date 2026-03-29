'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'tts' | 'sfx' | 'clone' | 'models' | 'assets' | 'rehearsal' | 'prompts' | 'handoff';

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

export function StudioClient({ accounts, personasByAccount }: StudioClientProps) {
  const [tab, setTab] = useState<Tab>('assets');
  const [latestPack, setLatestPack] = useState<AssetPackResult | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg bg-[var(--muted)] p-1 w-fit">
        {([
          { id: 'assets' as Tab, label: 'Asset Pack', icon: Layers3 },
          { id: 'models' as Tab, label: 'Prompt Lab', icon: BrainCircuit },
          { id: 'rehearsal' as Tab, label: 'Rehearsal', icon: ClipboardCheck },
          { id: 'prompts' as Tab, label: 'Prompt Versions', icon: GitBranch },
          { id: 'handoff' as Tab, label: 'Mission Handoff', icon: SendHorizontal },
          { id: 'tts' as Tab, label: 'Text-to-Speech', icon: Volume2 },
          { id: 'sfx' as Tab, label: 'Sound Effects', icon: Sparkles },
          { id: 'clone' as Tab, label: 'Voice Clone', icon: Mic },
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
          onGenerated={(pack) => {
            setLatestPack(pack);
            setTab('handoff');
          }}
        />
      )}
      {tab === 'models' && <ModelComparePanel />}
      {tab === 'rehearsal' && <RehearsalPanel />}
      {tab === 'prompts' && <PromptVersionsPanel />}
      {tab === 'handoff' && <MissionHandoffPanel initialPack={latestPack} />}
      {tab === 'tts' && <TTSPanel />}
      {tab === 'sfx' && <SFXPanel />}
      {tab === 'clone' && <ClonePanel />}
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
  onGenerated,
}: {
  accounts: StudioAccount[];
  personasByAccount: Record<string, StudioPersona[]>;
  onGenerated: (pack: AssetPackResult) => void;
}) {
  const [accountName, setAccountName] = useState(accounts[0]?.name ?? '');
  const [personaName, setPersonaName] = useState('');
  const [tone, setTone] = useState<'formal' | 'conversational' | 'provocative'>('conversational');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssetPackResult | null>(null);

  const personas = useMemo(() => personasByAccount[accountName] ?? [], [personasByAccount, accountName]);

  useEffect(() => {
    setPersonaName(personas[0]?.name ?? '');
  }, [accountName, personas]);

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

  async function loadVersions() {
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
  }

  useEffect(() => {
    loadVersions();
  }, [template]);

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
