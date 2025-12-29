import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth-mobile';
import { logActivity, getRequestInfo, ActivityType } from '@/lib/activity-log';

type Severity = 'info' | 'warning' | 'error' | 'critical';

const VALID_SEVERITIES: Severity[] = ['info', 'warning', 'error', 'critical'];

/**
 * POST /api/mobile/activity-log
 * Log activity events from the mobile app
 */
export async function POST(request: NextRequest) {
  try {
    // Verify auth token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyMobileToken(token, request);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { type, action, metadata, severity = 'info' } = body;

    if (!type || !action) {
      return NextResponse.json(
        { error: 'type and action are required' },
        { status: 400 }
      );
    }

    // Validate severity level
    const validSeverity: Severity = VALID_SEVERITIES.includes(severity) ? severity : 'info';

    // Get user info from token
    const userId = payload.userId as string;
    const userEmail = payload.email as string;
    const userName = payload.name as string;

    // Get request info
    const requestInfo = getRequestInfo(request);

    // Log the activity
    await logActivity({
      type: type as ActivityType,
      action,
      userId,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      metadata: {
        ...metadata,
        userEmail,
        userName,
        source: 'mobile_app',
      },
      severity: validSeverity,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging mobile activity:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
