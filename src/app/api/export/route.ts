import { NextRequest, NextResponse } from 'next/server';
import {
  dbGetAccounts,
  dbGetMeetings,
  dbGetActivities,
  dbGetMicrositeEngagements,
  dbGetOutreachWaves,
} from '@/lib/db';
import {
  buildMicrositeSessionSignals,
} from '@/lib/microsites/analytics';
import {
  renderMicrositeProposalHtml,
  resolveMicrositeProposalBrief,
} from '@/lib/microsites/proposal';

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map((v) => escape(v ?? '')).join(','));
  }
  return lines.join('\n');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'meetings';

  if (type === 'proposal') {
    const slug = searchParams.get('slug');
    const format = searchParams.get('format') ?? 'html';

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug for proposal export' }, { status: 400 });
    }

    const proposal = resolveMicrositeProposalBrief(slug);
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal export is only available for microsite-backed accounts' }, { status: 404 });
    }

    if (format === 'json') {
      return NextResponse.json(proposal, {
        headers: {
          'Content-Disposition': `attachment; filename="${slug}-yardflow-proposal.json"`,
        },
      });
    }

    return new NextResponse(renderMicrositeProposalHtml(proposal), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-yardflow-proposal.html"`,
      },
    });
  }

  let csv: string;
  let filename: string;

  switch (type) {
    case 'meetings': {
      const meetings = await dbGetMeetings();
      csv = toCsv(
        ['Date', 'Account', 'Persona', 'Status', 'Objective', 'Notes'],
        meetings.map((m) => [m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : '', m.account_name ?? '', m.persona ?? '', m.meeting_status ?? '', m.objective ?? '', m.notes ?? '']),
      );
      filename = 'modex-meetings.csv';
      break;
    }
    case 'pipeline': {
      const accounts = await dbGetAccounts();
      csv = toCsv(
        ['Account', 'Band', 'Research', 'Outreach', 'Meeting Status'],
        accounts.map((a) => [a.name, a.priority_band ?? '', a.research_status ?? '', a.outreach_status ?? '', a.meeting_status ?? '']),
      );
      filename = 'modex-pipeline.csv';
      break;
    }
    case 'activities': {
      const activities = await dbGetActivities();
      csv = toCsv(
        ['Date', 'Account', 'Persona', 'Type', 'Outcome', 'Next Step', 'Due', 'Owner'],
        activities.map((a) => [a.activity_date ? new Date(a.activity_date).toLocaleDateString() : '', a.account_name, a.persona ?? '', a.activity_type, a.outcome ?? '', a.next_step ?? '', a.next_step_due ? new Date(a.next_step_due).toLocaleDateString() : '', a.owner ?? '']),
      );
      filename = 'modex-activities.csv';
      break;
    }
    case 'waves': {
      const waves = await dbGetOutreachWaves();
      csv = toCsv(
        ['Wave', 'Account', 'Primary Persona', 'Channel', 'Status', 'Start Date'],
        waves.map((w) => [String(w.wave_order), w.account_name, w.primary_persona_lane ?? '', w.channel_mix ?? '', w.status ?? '', w.start_date ? new Date(w.start_date).toLocaleDateString() : '']),
      );
      filename = 'modex-waves.csv';
      break;
    }
    case 'microsites': {
      const engagements = await dbGetMicrositeEngagements();
      csv = toCsv(
        ['Updated', 'Created', 'Account', 'Account Slug', 'Person', 'Person Slug', 'Variant Slug', 'Path', 'Session ID', 'Last CTA', 'CTA IDs', 'Sections Viewed', 'Variant History', 'Proposal Viewed', 'ROI Viewed', 'Proposal Exported', 'Scroll Depth %', 'Duration Seconds', 'Metadata'],
        engagements.map((engagement) => {
          const signals = buildMicrositeSessionSignals({
            path: engagement.path,
            sections_viewed: engagement.sections_viewed,
            cta_ids: engagement.cta_ids,
          });

          return [
            new Date(engagement.updated_at).toLocaleString(),
            new Date(engagement.created_at).toLocaleString(),
            engagement.account_name,
            engagement.account_slug,
            engagement.person_name ?? '',
            engagement.person_slug ?? '',
            engagement.variant_slug ?? '',
            engagement.path,
            engagement.session_id,
            engagement.last_cta_id ?? '',
            engagement.cta_ids.join(' | '),
            engagement.sections_viewed.join(' | '),
            engagement.variant_history.join(' | '),
            signals.proposalViewed ? 'yes' : 'no',
            signals.roiViewed ? 'yes' : 'no',
            signals.exportClicked ? 'yes' : 'no',
            String(engagement.scroll_depth_pct),
            String(engagement.duration_seconds),
            engagement.metadata ? JSON.stringify(engagement.metadata) : '',
          ];
        }),
      );
      filename = 'modex-microsite-engagement.csv';
      break;
    }
    default:
      return NextResponse.json({ error: 'Invalid type. Use: meetings, pipeline, activities, waves, microsites, proposal' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
