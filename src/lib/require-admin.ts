import { notFound } from 'next/navigation';
import { auth } from './auth';

type SessionWithRole = { user?: { role?: string } } | null;

async function getRole(): Promise<string | undefined> {
  const session = (await auth()) as SessionWithRole;
  return session?.user?.role;
}

/**
 * Use in admin/ops Server Components. Renders a 404 for non-admins so the
 * existence of the route is not advertised. Unauthenticated users are already
 * redirected to /login by the NextAuth middleware before this runs.
 */
export async function requireAdminPage(): Promise<void> {
  const role = await getRole();
  if (role !== 'admin') {
    notFound();
  }
}

/**
 * Use at the top of admin/ops Server Actions. Throws so the action returns an
 * error to the caller without performing the privileged work.
 */
export async function requireAdminAction(): Promise<void> {
  const role = await getRole();
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required');
  }
}
