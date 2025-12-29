import { prisma } from './prisma';

export type ActivityType = 
  | 'auth_failed'
  | 'auth_success'
  | 'auth_logout'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_deactivated'
  | 'user_reactivated'
  | 'tag_written'
  | 'tag_erased'
  | 'transaction_created'
  | 'invoice_sent'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'admin_action'
  | 'api_error';

export type Severity = 'info' | 'warning' | 'error' | 'critical';

interface LogActivityParams {
  type: ActivityType;
  action: string;
  userId?: string;
  targetUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: Severity;
}

export async function logActivity(params: LogActivityParams) {
  const {
    type,
    action,
    userId,
    targetUserId,
    ipAddress,
    userAgent,
    metadata,
    severity = 'info',
  } = params;

  try {
    await prisma.activityLog.create({
      data: {
        type,
        action,
        userId,
        targetUserId,
        ipAddress,
        userAgent,
        metadata: metadata || undefined,
        severity,
      },
    });
  } catch (error) {
    // Don't let logging failures break the app
    console.error('[ActivityLog] Failed to log activity:', error);
  }
}

export interface RequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

// Helper to extract IP and user agent from request
export function getRequestInfo(request: Request): RequestInfo {
  const headers = request.headers;
  const ipAddress = 
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    undefined;
  
  const userAgent = headers.get('user-agent') || undefined;

  return { ipAddress, userAgent };
}

// Pre-built logging functions for common events
export const activityLogger = {
  authFailed: (
    action: string,
    metadata?: Record<string, any>,
    requestInfo?: RequestInfo
  ) => logActivity({
    type: 'auth_failed',
    action,
    userId: metadata?.userId,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
    metadata,
    severity: metadata?.reason === 'user_not_found' || metadata?.reason === 'user_deactivated' ? 'warning' : 'info',
  }),

  authSuccess: (params: {
    userId: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }) => logActivity({
    type: 'auth_success',
    action: `User logged in: ${params.email}`,
    userId: params.userId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    metadata: { email: params.email },
    severity: 'info',
  }),

  userCreated: (params: {
    userId: string;
    email: string;
    createdBy?: string;
  }) => logActivity({
    type: 'user_created',
    action: `New user created: ${params.email}`,
    userId: params.createdBy,
    targetUserId: params.userId,
    metadata: { email: params.email },
    severity: 'info',
  }),

  userDeleted: (params: {
    userId: string;
    email: string;
    deletedBy?: string;
  }) => logActivity({
    type: 'user_deleted',
    action: `User deleted: ${params.email}`,
    userId: params.deletedBy,
    targetUserId: params.userId,
    metadata: { email: params.email },
    severity: 'warning',
  }),

  userDeactivated: (params: {
    userId: string;
    email: string;
    deactivatedBy?: string;
  }) => logActivity({
    type: 'user_deactivated',
    action: `User deactivated: ${params.email}`,
    userId: params.deactivatedBy,
    targetUserId: params.userId,
    metadata: { email: params.email },
    severity: 'warning',
  }),

  tagWritten: (
    userId: string | undefined,
    action: string,
    metadata?: Record<string, any>,
    requestInfo?: RequestInfo
  ) => logActivity({
    type: 'tag_written',
    action,
    userId: userId || undefined,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
    metadata,
    severity: 'info',
  }),

  transactionCreated: (params: {
    userId: string;
    transactionId: string;
    amount?: number;
    businessName?: string;
  }) => logActivity({
    type: 'transaction_created',
    action: `Transaction created: ${params.businessName || 'Unknown'} - £${params.amount?.toFixed(2) || '0.00'}`,
    userId: params.userId,
    metadata: { transactionId: params.transactionId, amount: params.amount, businessName: params.businessName },
    severity: 'info',
  }),

  adminAction: (params: {
    userId: string;
    action: string;
    metadata?: Record<string, any>;
  }) => logActivity({
    type: 'admin_action',
    action: params.action,
    userId: params.userId,
    metadata: params.metadata,
    severity: 'info',
  }),
};
