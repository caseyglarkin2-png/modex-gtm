/**
 * The human actor of a request is the signed-in session, never a request
 * field. Routes that record who reviewed, owned or created something call
 * this and answer 401 on null; a client-supplied actor/owner/createdBy is
 * ignored (ops closeout, 2026-09-27).
 */
import { auth } from '@/lib/auth';

export async function sessionActorEmail(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}
