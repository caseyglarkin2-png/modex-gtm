import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SprintBoardProps<T> = {
  title: ReactNode;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  headerAction?: ReactNode;
  emptyMessage?: ReactNode;
  maxItems?: number;
  itemKey?: (item: T, index: number) => string | number;
  itemClassName?: string;
  contentClassName?: string;
  className?: string;
};

export function SprintBoard<T>({
  title,
  items,
  renderItem,
  headerAction,
  emptyMessage = 'Nothing here yet.',
  maxItems = 6,
  itemKey,
  itemClassName = 'rounded-lg border border-[var(--border)] p-3',
  contentClassName = 'space-y-2',
  className,
}: SprintBoardProps<T>) {
  const visible = items.slice(0, maxItems);
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{emptyMessage}</p>
        ) : (
          <div className={contentClassName}>
            {visible.map((item, index) => (
              <div
                key={itemKey ? itemKey(item, index) : index}
                className={cn(itemClassName)}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
