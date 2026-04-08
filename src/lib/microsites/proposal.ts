import { getAccountMicrositeData } from './accounts';
import { materializeMicrositeSections } from './roi';
import type {
  CTABlock,
  HeroSection,
  MicrositeSection,
  NetworkMapSection,
  ProblemSection,
  ProofSection,
  ProofStat,
  ROIHeadlineStat,
  ROISection,
  ROISourceNote,
} from './schema';

type SectionOf<T extends MicrositeSection['type']> = Extract<MicrositeSection, { type: T }>;

export interface MicrositeProposalSummaryStat {
  label: string;
  value: string;
  detail?: string;
}

export interface MicrositeProposalBrief {
  slug: string;
  accountName: string;
  vertical: string;
  tier: string;
  band: string;
  priorityScore: number;
  pageTitle: string;
  metaDescription: string;
  accentColor?: string;
  proposalPath: string;
  exportHtmlPath: string;
  exportJsonPath: string;
  bookingLink?: string;
  hero: HeroSection;
  cta: CTABlock;
  sections: MicrositeSection[];
  problem?: ProblemSection;
  proof?: ProofSection;
  network?: NetworkMapSection;
  roi?: ROISection;
  focusPoints: string[];
  summaryStats: MicrositeProposalSummaryStat[];
  proofStats: ProofStat[];
  sourceNotes: ROISourceNote[];
}

function findSection<T extends MicrositeSection['type']>(
  sections: MicrositeSection[],
  type: T,
): SectionOf<T> | undefined {
  return sections.find((section): section is SectionOf<T> => section.type === type);
}

function dedupeSourceNotes(...groups: Array<ROISourceNote[] | undefined>): ROISourceNote[] {
  const seen = new Set<string>();
  const notes: ROISourceNote[] = [];

  for (const group of groups) {
    for (const note of group ?? []) {
      const key = `${note.id}:${note.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      notes.push(note);
    }
  }

  return notes;
}

function getHeadlineStat(roi: ROISection | undefined, id: ROIHeadlineStat['id']) {
  return roi?.headlineStats?.find((stat) => stat.id === id);
}

function buildSummaryStats(
  network: NetworkMapSection | undefined,
  roi: ROISection | undefined,
): MicrositeProposalSummaryStat[] {
  const stats: MicrositeProposalSummaryStat[] = [];
  const netYearOneGain = getHeadlineStat(roi, 'net-year-1-gain');
  const yearOneRoi = getHeadlineStat(roi, 'year-one-roi');
  const costOfInaction = getHeadlineStat(roi, 'cost-of-inaction');

  if (network?.facilityCount) {
    stats.push({
      label: 'Network footprint',
      value: network.facilityCount,
      detail: network.geographicSpread,
    });
  }

  if (network?.dailyTrailerMoves) {
    stats.push({
      label: 'Daily trailer moves',
      value: network.dailyTrailerMoves,
      detail: network.peakMultiplier ? `Peak: ${network.peakMultiplier}` : undefined,
    });
  }

  if (roi?.totalAnnualSavings) {
    stats.push({
      label: 'Modeled annual value',
      value: roi.totalAnnualSavings,
      detail: netYearOneGain?.value ? `Net year 1 gain ${netYearOneGain.value}` : undefined,
    });
  } else if (netYearOneGain) {
    stats.push({
      label: netYearOneGain.label,
      value: netYearOneGain.value,
      detail: netYearOneGain.footnote,
    });
  }

  if (roi?.paybackPeriod) {
    stats.push({
      label: 'Payback period',
      value: roi.paybackPeriod,
      detail: yearOneRoi?.value ? `Year 1 ROI ${yearOneRoi.value}` : undefined,
    });
  } else if (yearOneRoi) {
    stats.push({
      label: yearOneRoi.label,
      value: yearOneRoi.value,
      detail: yearOneRoi.footnote,
    });
  }

  if (stats.length < 4 && costOfInaction) {
    stats.push({
      label: costOfInaction.label,
      value: costOfInaction.value,
      detail: costOfInaction.footnote,
    });
  }

  return stats.slice(0, 4);
}

function buildProofStats(proof: ProofSection | undefined): ProofStat[] {
  const visualStats = proof?.proofVisual?.stats?.slice(0, 4);
  if (visualStats && visualStats.length > 0) {
    return visualStats;
  }

  const metricBlock = proof?.blocks.find((block) => block.type === 'metric' && block.stats?.length);
  return metricBlock?.stats?.slice(0, 4) ?? [];
}

function buildFocusPoints(problem: ProblemSection | undefined, proofStats: ProofStat[]): string[] {
  const focusPoints = problem?.painPoints.slice(0, 4).map((point) => point.headline) ?? [];

  if (focusPoints.length > 0) {
    return focusPoints;
  }

  return proofStats.slice(0, 4).map((stat) => stat.label);
}

export function resolveMicrositeProposalBrief(slug: string): MicrositeProposalBrief | null {
  const data = getAccountMicrositeData(slug);
  if (!data) return null;

  const sections = materializeMicrositeSections(data, data.sections);
  const hero = findSection(sections, 'hero');
  if (!hero) return null;

  const problem = findSection(sections, 'problem');
  const proof = findSection(sections, 'proof');
  const network = findSection(sections, 'network-map');
  const roi = findSection(sections, 'roi');
  const proofStats = buildProofStats(proof);

  return {
    slug: data.slug,
    accountName: data.accountName,
    vertical: data.vertical,
    tier: data.tier,
    band: data.band,
    priorityScore: data.priorityScore,
    pageTitle: data.pageTitle,
    metaDescription: data.metaDescription,
    accentColor: data.theme?.accentColor,
    proposalPath: `/proposal/${data.slug}`,
    exportHtmlPath: `/api/export?type=proposal&slug=${data.slug}&format=html`,
    exportJsonPath: `/api/export?type=proposal&slug=${data.slug}&format=json`,
    bookingLink: hero.cta.calendarLink,
    hero,
    cta: hero.cta,
    sections,
    problem,
    proof,
    network,
    roi,
    focusPoints: buildFocusPoints(problem, proofStats),
    summaryStats: buildSummaryStats(network, roi),
    proofStats,
    sourceNotes: dedupeSourceNotes(data.roiModel?.sourceNotes, roi?.assumptionNotes, roi?.sourceNotes),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderListItems(items: string[], className: string) {
  return items
    .map((item) => `<li class="${className}">${escapeHtml(item)}</li>`)
    .join('');
}

export function renderMicrositeProposalHtml(proposal: MicrositeProposalBrief): string {
  const summaryStatsHtml = proposal.summaryStats
    .map(
      (stat) => `
        <div class="stat-card">
          <div class="stat-label">${escapeHtml(stat.label)}</div>
          <div class="stat-value">${escapeHtml(stat.value)}</div>
          ${stat.detail ? `<div class="stat-detail">${escapeHtml(stat.detail)}</div>` : ''}
        </div>`,
    )
    .join('');

  const proofStatsHtml = proposal.proofStats
    .map(
      (stat) => `
        <div class="proof-card">
          <div class="proof-value">${escapeHtml(stat.value)}</div>
          <div class="proof-label">${escapeHtml(stat.label)}</div>
          ${stat.context ? `<div class="proof-context">${escapeHtml(stat.context)}</div>` : ''}
        </div>`,
    )
    .join('');

  const roiLinesHtml = proposal.roi?.roiLines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.label)}</td>
          <td>${escapeHtml(line.before)}</td>
          <td>${escapeHtml(line.after)}</td>
          <td>${escapeHtml(line.delta)}</td>
        </tr>`,
    )
    .join('') ?? '';

  const sourceNotesHtml = proposal.sourceNotes
    .map(
      (note) => `
        <div class="source-note">
          <div class="source-label">${escapeHtml(note.label)}</div>
          <div class="source-detail">${escapeHtml(note.detail)}</div>
          <div class="source-meta">${escapeHtml(note.confidence.toUpperCase())}${note.citation ? ` | ${escapeHtml(note.citation)}` : ''}</div>
        </div>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(`${proposal.accountName} YardFlow Proposal`)}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f172a;
        --panel: #111827;
        --panel-alt: #0b1220;
        --line: rgba(148, 163, 184, 0.22);
        --text: #e2e8f0;
        --muted: #94a3b8;
        --accent: ${proposal.accentColor ?? '#06B6D4'};
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 30%), var(--bg);
        color: var(--text);
        font-family: "SF Pro Display", "Segoe UI", sans-serif;
      }

      .page {
        max-width: 1120px;
        margin: 0 auto;
        padding: 40px 24px 56px;
      }

      .hero {
        padding: 32px;
        border: 1px solid var(--line);
        border-radius: 28px;
        background: linear-gradient(140deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.88));
      }

      .eyebrow,
      .section-label,
      .stat-label,
      .source-meta,
      .table-label {
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--muted);
      }

      h1 {
        margin: 18px 0 0;
        font-size: 48px;
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .summary {
        margin-top: 18px;
        max-width: 760px;
        font-size: 18px;
        line-height: 1.6;
        color: #cbd5e1;
      }

      .meta-row,
      .focus-list,
      .stats-grid,
      .proof-grid,
      .source-grid {
        display: grid;
        gap: 16px;
      }

      .meta-row {
        margin-top: 16px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .chip,
      .stat-card,
      .proof-card,
      .panel,
      .source-note {
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(15, 23, 42, 0.72);
      }

      .chip {
        padding: 12px 14px;
        font-size: 13px;
      }

      .grid-two {
        display: grid;
        gap: 20px;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
      }

      .section {
        margin-top: 24px;
      }

      .stats-grid,
      .proof-grid,
      .source-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .stat-card,
      .proof-card,
      .source-note,
      .panel {
        padding: 18px;
      }

      .stat-value,
      .proof-value {
        margin-top: 10px;
        font-size: 28px;
        font-weight: 700;
        color: white;
      }

      .stat-detail,
      .proof-context,
      .source-detail,
      p,
      li {
        font-size: 14px;
        line-height: 1.7;
        color: #cbd5e1;
      }

      .focus-list {
        margin: 0;
        padding-left: 18px;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
      }

      .table th,
      .table td {
        padding: 12px 10px;
        border-top: 1px solid var(--line);
        text-align: left;
        font-size: 14px;
      }

      .table th {
        color: var(--muted);
        font-weight: 600;
      }

      .footer-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid var(--line);
      }

      a.button {
        display: inline-block;
        padding: 12px 18px;
        border-radius: 999px;
        background: var(--accent);
        color: #020617;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
      }

      @media (max-width: 900px) {
        h1 { font-size: 36px; }
        .grid-two { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div class="eyebrow">YardFlow by FreightRoll | Board-ready proposal</div>
        <h1>${escapeHtml(proposal.accountName)} yard execution proposal</h1>
        <p class="summary">${escapeHtml(proposal.hero.subheadline)}</p>

        <div class="meta-row">
          <div class="chip">${escapeHtml(`${proposal.band}-Band | ${proposal.tier}`)}</div>
          <div class="chip">${escapeHtml(`Priority score ${String(proposal.priorityScore)}`)}</div>
          <div class="chip">${escapeHtml(`Vertical ${proposal.vertical}`)}</div>
        </div>

        <div class="section">
          <div class="stats-grid">${summaryStatsHtml}</div>
        </div>
      </section>

      <section class="section grid-two">
        <div class="panel">
          <div class="section-label">Commercial thesis</div>
          <p>${escapeHtml(proposal.hero.headline)}</p>
          ${proposal.problem ? `<p>${escapeHtml(proposal.problem.narrative)}</p>` : ''}
          <div class="section-label" style="margin-top: 20px;">Board conversation prompts</div>
          <ul class="focus-list">${renderListItems(proposal.focusPoints, '')}</ul>
        </div>

        <div class="panel">
          <div class="section-label">Network reality</div>
          ${proposal.network ? `<p>${escapeHtml(proposal.network.narrative)}</p>` : '<p>Facility-specific yard evidence is configured in the live microsite model.</p>'}
          ${proposal.network?.dailyTrailerMoves ? `<p><strong>Daily trailer moves:</strong> ${escapeHtml(proposal.network.dailyTrailerMoves)}</p>` : ''}
          ${proposal.network?.geographicSpread ? `<p><strong>Footprint:</strong> ${escapeHtml(proposal.network.geographicSpread)}</p>` : ''}
        </div>
      </section>

      ${proposal.proofStats.length > 0 ? `
        <section class="section">
          <div class="section-label">Proof from live deployment</div>
          <div class="proof-grid">${proofStatsHtml}</div>
        </section>` : ''}

      ${proposal.roi?.roiLines?.length ? `
        <section class="section panel">
          <div class="section-label">ROI model</div>
          <p>${escapeHtml(proposal.roi.narrative)}</p>
          <table class="table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current</th>
                <th>With YardFlow</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>${roiLinesHtml}</tbody>
          </table>
        </section>` : ''}

      ${proposal.sourceNotes.length > 0 ? `
        <section class="section">
          <div class="section-label">Evidence trail</div>
          <div class="source-grid">${sourceNotesHtml}</div>
        </section>` : ''}

      <section class="section panel">
        <div class="section-label">Next step</div>
        <p>${escapeHtml(proposal.cta.subtext)}</p>
        <div class="footer-row">
          <div class="table-label">Live brief path: ${escapeHtml(proposal.proposalPath)}</div>
          ${proposal.bookingLink ? `<a class="button" href="${escapeHtml(proposal.bookingLink)}">${escapeHtml(proposal.cta.buttonLabel)}</a>` : ''}
        </div>
      </section>
    </main>
  </body>
</html>`;
}