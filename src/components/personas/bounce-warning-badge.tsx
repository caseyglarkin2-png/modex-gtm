'use client';

import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

interface BounceWarningBadgeProps {
  emailValid?: boolean | null;
  email?: string | null;
}

export function BounceWarningBadge({ emailValid, email }: BounceWarningBadgeProps) {
  if (emailValid !== false) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="gap-1 cursor-help">
            <AlertCircle className="h-3 w-3" />
            Email Bounced
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Email {email} hard bounced.</p>
          <p className="text-xs mt-1">Consider updating contact info.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
