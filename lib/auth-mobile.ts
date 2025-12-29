import { jwtVerify } from 'jose';
import { prisma } from './prisma';
import { activityLogger, getRequestInfo, RequestInfo } from './activity-log';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'development-secret');

export type AuthResult = 
  | { success: true; payload: any }
  | { success: false; reason: 'invalid_token' | 'user_not_found' | 'user_deactivated' | 'token_expired' };

export async function verifyMobileToken(token: string, request?: Request): Promise<any> {
  const result = await verifyMobileTokenWithReason(token, request);
  return result.success ? result.payload : null;
}

export async function verifyMobileTokenWithReason(token: string, request?: Request): Promise<AuthResult> {
  const requestInfo = request ? getRequestInfo(request) : undefined;
  
  try {
    const { payload } = await jwtVerify(token, secret);
    
    // Check if user still exists in database
    const userId = payload.userId as string | undefined;
    const email = payload.email as string | undefined;
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, active: true, email: true }
      });
      
      // Reject if user doesn't exist
      if (!user) {
        console.log(`[Auth] Token rejected: user ${userId} not found in database`);
        
        // Log the auth failure
        await activityLogger.authFailed(
          `Login rejected: user account deleted (${email || userId})`,
          { email, userId, reason: 'user_not_found' },
          requestInfo
        ).catch(console.error);
        
        return { success: false, reason: 'user_not_found' };
      }
      
      // Check if user is deactivated
      if (user.active === false) {
        console.log(`[Auth] Token rejected: user ${userId} is deactivated`);
        
        // Log the auth failure
        await activityLogger.authFailed(
          `Login rejected: user account deactivated (${user.email})`,
          { email: user.email, userId, reason: 'user_deactivated' },
          requestInfo
        ).catch(console.error);
        
        return { success: false, reason: 'user_deactivated' };
      }
    }
    
    return { success: true, payload };
  } catch (error: any) {
    if (error?.code === 'ERR_JWT_EXPIRED') {
      return { success: false, reason: 'token_expired' };
    }
    return { success: false, reason: 'invalid_token' };
  }
}