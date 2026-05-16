export type HomeAccountSource = {
  name: string;
  owner: string;
  next_action: string | null;
  due_date: Date | string | null;
};

export type HomeActivitySource = {
  account_name: string | null;
  owner: string | null;
  activity_type: string;
  next_step: string | null;
  next_step_due: Date | string | null;
  notes?: string | null;
  outcome?: string | null;
};

export type HomeFocusItem = {
  type: 'Account' | 'Activity';
  account: string;
  owner: string;
  summary: string;
  due: Date;
  dueLabel: string;
  urgency: 'overdue' | 'today' | 'upcoming';
};

export function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameCalendarDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function formatDueLabel(due: Date, today: Date) {
  const diffDays = Math.round((startOfDay(due).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
}

function parseDueDate(value: Date | string | null) {
  if (!value) return null;
  const due = new Date(value);
  return Number.isNaN(due.getTime()) ? null : due;
}

export function buildFocusItems(
  accounts: HomeAccountSource[],
  activities: HomeActivitySource[],
  now = new Date(),
): HomeFocusItem[] {
  const today = startOfDay(now);

  const items = [
    ...accounts
      .filter((account) => account.next_action && account.due_date)
      .map((account) => ({
        type: 'Account' as const,
        account: account.name,
        owner: account.owner,
        summary: account.next_action ?? 'Next action ready',
        due: parseDueDate(account.due_date),
      })),
    ...activities
      .filter((activity) => activity.account_name && activity.next_step && activity.next_step_due)
      .map((activity) => ({
        type: 'Activity' as const,
        account: activity.account_name ?? 'Unknown account',
        owner: activity.owner ?? 'Unassigned',
        summary: activity.next_step ?? 'Follow up',
        due: parseDueDate(activity.next_step_due),
      })),
  ]
    .filter((item): item is Omit<typeof item, 'due'> & { due: Date } => item.due !== null)
    .sort((left, right) => left.due.getTime() - right.due.getTime())
    .filter((item, index, allItems) => index === allItems.findIndex((candidate) => (
      candidate.account === item.account &&
      candidate.summary === item.summary &&
      candidate.due.getTime() === item.due.getTime()
    )));

  return items.map((item) => {
    const dueTime = startOfDay(item.due).getTime();
    const urgency = dueTime < today.getTime()
      ? 'overdue'
      : dueTime === today.getTime()
        ? 'today'
        : 'upcoming';

    return {
      ...item,
      dueLabel: formatDueLabel(item.due, today),
      urgency,
    };
  });
}
