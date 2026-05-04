import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function GeneratedContentLoading() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Content Studio', href: '/studio' }, { label: 'Generated Content' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generated Content</h1>
        <p className="text-sm text-muted-foreground">Loading content workspace...</p>
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
