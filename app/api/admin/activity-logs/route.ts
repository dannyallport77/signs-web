import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    if (userId) {
      where.OR = [
        { userId },
        { targetUserId: userId },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Get user names for display
    const userIds = [...new Set([
      ...logs.map(l => l.userId).filter(Boolean),
      ...logs.map(l => l.targetUserId).filter(Boolean),
    ])] as string[];

    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Enrich logs with user info
    const enrichedLogs = logs.map(log => ({
      ...log,
      user: log.userId ? userMap[log.userId] : null,
      targetUser: log.targetUserId ? userMap[log.targetUserId] : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: enrichedLogs,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get activity stats for dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      last24HoursCount,
      authFailedCount,
      criticalCount,
      typeBreakdown,
    ] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.activityLog.count({ where: { type: 'auth_failed', createdAt: { gte: last7Days } } }),
      prisma.activityLog.count({ where: { severity: 'critical', createdAt: { gte: last7Days } } }),
      prisma.activityLog.groupBy({
        by: ['type'],
        _count: true,
        where: { createdAt: { gte: last7Days } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalLogs,
        last24HoursCount,
        authFailedCount,
        criticalCount,
        typeBreakdown: typeBreakdown.map(t => ({ type: t.type, count: t._count })),
      },
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
