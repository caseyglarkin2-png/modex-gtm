/** The account name as the one link to its intelligence page (/gap/accounts/:slug), from anywhere in GAP. */
import Link from 'next/link';
import { accountHref } from '@/lib/gap/account-intel/href';

export function AccountLink({ name, className, children }: { name: string; className?: string; children?: React.ReactNode }) {
  return (
    <Link href={accountHref(name)} data-testid="account-link" className={`underline decoration-dotted underline-offset-2 hover:decoration-solid ${className ?? ''}`}>
      {children ?? name}
    </Link>
  );
}
