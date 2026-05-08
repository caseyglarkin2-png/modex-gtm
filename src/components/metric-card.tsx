import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type MetricCardProps = {
  label: string;
  value: ReactNode;
  tone?: string;
  size?: 'sm' | 'md';
  variant?: 'card' | 'plain';
  align?: 'left' | 'center';
  detail?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  href?: string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  tone = 'text-[var(--foreground)]',
  size = 'sm',
  variant = 'card',
  align,
  detail,
  icon: Icon,
  href,
  className,
}: MetricCardProps) {
  const effectiveAlign = align ?? (detail ? 'left' : 'center');
  const valueClass = size === 'sm' ? 'text-2xl' : 'text-3xl';
  const labelClass = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const padding = Icon ? 'p-5' : 'p-4';
  const alignClass = Icon ? '' : effectiveAlign === 'left' ? 'text-left' : 'text-center';

  const inner = (
    <div className={cn(Icon ? 'flex items-center justify-between gap-3' : '', alignClass)}>
      <div>
        <p className={cn('uppercase tracking-wide text-[var(--muted-foreground)]', labelClass)}>
          {label}
        </p>
        <p className={cn(size === 'sm' ? 'mt-2' : 'mt-1', 'font-bold', valueClass, tone)}>
          {value}
        </p>
        {detail ? (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</p>
        ) : null}
      </div>
      {Icon ? (
        <div className="rounded-lg bg-[var(--accent)] p-2.5">
          <Icon className="h-5 w-5 text-[var(--muted-foreground)]" />
        </div>
      ) : null}
    </div>
  );

  const wrapper =
    variant === 'card' ? (
      <Card className={className}>
        <CardContent className={padding}>{inner}</CardContent>
      </Card>
    ) : (
      <div className={cn('rounded-lg border border-[var(--border)]', padding, className)}>
        {inner}
      </div>
    );

  return href ? (
    <Link href={href} className="block transition hover:opacity-90">
      {wrapper}
    </Link>
  ) : (
    wrapper
  );
}
