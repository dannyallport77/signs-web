import { NextResponse } from 'next/server';
import { verifyMobileTokenWithReason, AuthResult } from './auth-mobile';

const AUTH_ERROR_MESSAGES = {
  user_not_found: 'Your account has been removed from our system.',
  user_deactivated: 'Your account has been deactivated.',
  token_expired: 'Your session has expired. Please log in again.',
  invalid_token: 'Invalid authentication token.',
};

export async function authenticateRequest(authHeader: string | null): Promise<
  | { success: true; payload: any }
  | { success: false; response: NextResponse }
> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          authErrorReason: 'missing_token',
          message: 'No authentication token provided.'
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  const result = await verifyMobileTokenWithReason(token);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: AUTH_ERROR_MESSAGES[result.reason],
          authErrorReason: result.reason,
          message: AUTH_ERROR_MESSAGES[result.reason]
        },
        { status: 401 }
      ),
    };
  }

  return { success: true, payload: result.payload };
}
