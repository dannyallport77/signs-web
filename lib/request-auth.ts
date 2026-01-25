import { auth } from '@/lib/auth';
import { verifyMobileToken } from '@/lib/auth-mobile';

export type RequestUser = {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  source: 'session' | 'mobile';
};

export async function getRequestUser(request: Request): Promise<RequestUser | null> {
  const session = await auth();
  if (session?.user) {
    const user = session.user as any;
    if (typeof user.id !== 'string') {
      return null;
    }
    return {
      userId: user.id,
      email: typeof user.email === 'string' ? user.email : undefined,
      name: typeof user.name === 'string' ? user.name : undefined,
      role: typeof user.role === 'string' ? user.role : undefined,
      source: 'session',
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyMobileToken(token, request);
    if (payload && typeof payload.userId === 'string') {
      return {
        userId: payload.userId,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        role: typeof payload.role === 'string' ? payload.role : undefined,
        source: 'mobile',
      };
    }
  }

  return null;
}

export function isAdmin(user: RequestUser | null): boolean {
  if (!user || typeof user.role !== 'string') {
    return false;
  }
  return user.role.toLowerCase() === 'admin';
}
