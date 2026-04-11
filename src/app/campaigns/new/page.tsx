import Link from 'next/link';
import { ArrowRight, CalendarRange, Sparkles, Target } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCampaignAction } from '../actions';
import { CAMPAIGN_TEMPLATES, getCampaignTemplate } from '@/lib/campaigns/templates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New Campaign' };

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const search = await searchParams;
  const template = getCampaignTemplate(search.template);
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + template.defaultDurationDays);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: 'New Campaign' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Campaign</h1>
          <p className="text-sm text-muted-foreground">
            Launch a reusable outreach motion with a template, clear dates, and a strong angle.
          </p>
        </div>
        <Link href="/campaigns">
          <Button variant="outline" size="sm" className="gap-1.5">
            Back to Campaigns <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {CAMPAIGN_TEMPLATES.map((item) => (
          <Link key={item.key} href={`/campaigns/new?template=${item.key}`}>
            <Card className={item.key === template.key ? 'border-cyan-600 shadow-sm' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{item.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{item.description}</p>
                <p className="text-xs">{item.defaultTouchCount} touches · intervals {item.suggestedIntervals.join(', ')} days</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> {template.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCampaignAction} className="space-y-5">
            <input type="hidden" name="template_key" value={template.key} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={`${template.label} ${start.getFullYear()}`}
                  placeholder="Q2 Expansion Push"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input id="owner" name="owner" defaultValue="Casey" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="campaign_type">Type</Label>
                <select id="campaign_type" name="campaign_type" defaultValue={template.defaultCampaignType} className="flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm">
                  <option value="trade_show">Trade Show</option>
                  <option value="cold_outbound">Cold Outbound</option>
                  <option value="warm_intro">Warm Intro</option>
                  <option value="seasonal_push">Seasonal Push</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={template.defaultStatus} className="flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start</Label>
                <Input id="start_date" name="start_date" type="date" defaultValue={toDateInput(start)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End</Label>
                <Input id="end_date" name="end_date" type="date" defaultValue={toDateInput(end)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target_account_count">Target accounts</Label>
                <Input id="target_account_count" name="target_account_count" type="number" min={0} defaultValue={template.defaultTargetAccounts} />
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Template defaults</p>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="inline-flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" /> {template.defaultDurationDays} day window</p>
                  <p className="inline-flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Required fields: {template.requiredFields.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messaging_angle">Messaging angle</Label>
              <Textarea
                id="messaging_angle"
                name="messaging_angle"
                rows={4}
                defaultValue={template.defaultMessagingAngle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key_dates">Key dates / notes</Label>
              <Textarea
                id="key_dates"
                name="key_dates"
                rows={3}
                defaultValue={`Template: ${template.label}\nSuggested cadence: ${template.suggestedIntervals.join(', ')} days\nAI angle: ${template.aiPromptAngle}`}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="gap-1.5">
                Create Campaign <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
