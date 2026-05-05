import { NextRequest, NextResponse } from 'next/server';
import { fetchAccountIdentityReport, serializeAccountIdentityReportCsv } from '@/lib/revops/account-identity-report';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const report = await fetchAccountIdentityReport();
  const format = req.nextUrl.searchParams.get('format')?.toLowerCase();

  if (format === 'csv') {
    return new NextResponse(serializeAccountIdentityReportCsv(report), {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="account-identity-report.csv"',
      },
    });
  }

  return NextResponse.json(report, {
    headers: {
      'content-disposition': 'attachment; filename="account-identity-report.json"',
    },
  });
}
