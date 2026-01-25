import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const role = (session.user as any).role;
  if (typeof role !== 'string' || role.toLowerCase() !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, session };
}
