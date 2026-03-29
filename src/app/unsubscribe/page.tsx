'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const emailLogId = searchParams.get('id') || '';

  const [unsubscribed, setUnsubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUnsubscribe() {
    if (!email) {
      toast.error('No email address provided');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          emailLogId: emailLogId ? parseInt(emailLogId) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to unsubscribe');
      }

      setUnsubscribed(true);
      toast.success('You have been unsubscribed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unsubscribe');
    } finally {
      setLoading(false);
    }
  }

  if (unsubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Successfully Unsubscribed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {email} has been removed from our mailing list.
            </p>
            <p className="text-sm text-muted-foreground">
              You will no longer receive emails from YardFlow by FreightRoll.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Unsubscribe from YardFlow Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We're sorry to see you go. If you unsubscribe, you will no longer receive emails from YardFlow by FreightRoll.
          </p>
          {email && (
            <p className="text-sm font-medium">
              Email: <span className="text-primary">{email}</span>
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleUnsubscribe}
              disabled={loading || !email}
              className="flex-1"
            >
              {loading ? 'Unsubscribing...' : 'Unsubscribe'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If you unsubscribed by mistake, please contact us at{' '}
            <a href="mailto:casey@yardflow.ai" className="text-primary hover:underline">
              casey@yardflow.ai
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
