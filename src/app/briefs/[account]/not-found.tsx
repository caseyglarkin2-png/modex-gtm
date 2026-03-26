import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchX } from 'lucide-react';

export default function BriefNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
            <SearchX className="h-6 w-6 text-[var(--muted-foreground)]" />
          </div>
          <h2 className="text-lg font-semibold">Brief Not Found</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            The meeting brief you&apos;re looking for doesn&apos;t exist or the URL is incorrect.
          </p>
          <Link href="/briefs">
            <Button className="w-full">Back to Briefs</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
