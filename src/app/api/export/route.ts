import { NextRequest, NextResponse } from 'next/server';
import { getAccounts, getMeetings, getActivities, getOutreachWaves } from '@/lib/data';

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

  let csv: string;
  let filename: string;

  switch (type) {
    case 'meetings': {
      const meetings = getMeetings();
      csv = toCsv(
        ['Date', 'Account', 'Attendees', 'Type', 'Status', 'Outcome', 'Notes'],
        meetings.map((m) => [m.date, m.account, m.attendees, m.meeting_type, m.status, m.outcome, m.notes]),
      );
      filename = 'modex-meetings.csv';
      break;
    }
    case 'pipeline': {
      const accounts = getAccounts();
      csv = toCsv(
        ['Account', 'Band', 'Research', 'Outreach', 'Meeting Status'],
        accounts.map((a) => [a.name, a.priority_band, a.research_status, a.outreach_status, a.meeting_status]),
      );
      filename = 'modex-pipeline.csv';
      break;
    }
    case 'activities': {
      const activities = getActivities();
      csv = toCsv(
        ['Date', 'Account', 'Persona', 'Type', 'Outcome', 'Next Step', 'Due', 'Owner'],
        activities.map((a) => [a.activity_date, a.account, a.persona ?? '', a.activity_type, a.outcome ?? '', a.next_step ?? '', a.next_step_due ?? '', a.owner ?? '']),
      );
      filename = 'modex-activities.csv';
      break;
    }
    case 'waves': {
      const waves = getOutreachWaves();
      csv = toCsv(
        ['Wave', 'Account', 'Primary Persona', 'Channel', 'Status', 'Start Date'],
        waves.map((w) => [String(w.wave_order), w.account, w.primary_persona_lane, w.channel_mix, w.status, w.start_date ?? '']),
      );
      filename = 'modex-waves.csv';
      break;
    }
    default:
      return NextResponse.json({ error: 'Invalid type. Use: meetings, pipeline, activities, waves' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
