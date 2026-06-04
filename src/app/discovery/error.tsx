'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DiscoveryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Something went wrong loading the Discovery Hub.
          </p>
          <Button onClick={reset} className="mt-4">Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
