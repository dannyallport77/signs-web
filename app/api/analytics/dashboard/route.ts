import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyMobileToken } from '@/lib/auth-mobile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    let payload: any = null;
    let userId: string | null = null;
    let userRole: string = 'user';

    // Try NextAuth session first (for web)
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = session.user.id;
      userRole = session.user.role || 'user';
      payload = { userId, role: userRole };
    } else {
      // Fall back to mobile JWT token
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      payload = await verifyMobileToken(token);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        );
      }
      userId = userId;
      userRole = payload.role || 'user';
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // If not admin, filter by user's transactions
    if (userRole !== 'admin') {
      dateFilter.userId = userId;
    }

    // Get stats
    const [totalSales, totalRevenue, failedSales, activeUsers, todaysStats] = await Promise.all([
      // Total successful sales
      prisma.transaction.count({
        where: {
          ...dateFilter,
          status: 'success'
        }
      }),

      // Total revenue
      prisma.transaction.aggregate({
        where: {
          ...dateFilter,
          status: 'success'
        },
        _sum: {
          salePrice: true
        }
      }),

      // Failed sales
      prisma.transaction.count({
        where: {
          ...dateFilter,
          status: 'failed'
        }
      }),

      // Active users (users with transactions in the period)
      prisma.transaction.findMany({
        where: dateFilter,
        select: {
          userId: true
        },
        distinct: ['userId']
      }),

      // Today's stats
      prisma.transaction.aggregate({
        where: {
          ...dateFilter,
          status: 'success',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        _count: true,
        _sum: {
          salePrice: true
        }
      })
    ]);

    // Get sales trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesTrend = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as sales,
        COALESCE(SUM(sale_price), 0) as revenue
      FROM transactions
      WHERE status = 'success'
        AND created_at >= ${thirtyDaysAgo}
        ${userRole !== 'admin' ? Prisma.sql`AND user_id = ${userId}` : Prisma.sql``}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;

    // Get sign popularity
    const signPopularity = await prisma.$queryRaw`
      SELECT
        st.name as sign_type,
        COUNT(t.id) as quantity,
        COALESCE(SUM(t.sale_price), 0) as revenue
      FROM transactions t
      JOIN sign_types st ON t.sign_type_id = st.id
      WHERE t.status = 'success'
        ${dateFilter.createdAt ? Prisma.sql`AND t.created_at >= ${dateFilter.createdAt.gte} AND t.created_at <= ${dateFilter.createdAt.lte}` : Prisma.sql``}
        ${userRole !== 'admin' ? Prisma.sql`AND t.user_id = ${userId}` : Prisma.sql``}
      GROUP BY st.id, st.name
      ORDER BY quantity DESC
      LIMIT 10
    `;

    // Get top users
    const topUsers = await prisma.$queryRaw`
      SELECT
        u.id as user_id,
        u.name,
        COUNT(t.id) as total_sales,
        COALESCE(SUM(t.sale_price), 0) as total_revenue,
        ROUND(
          (COUNT(CASE WHEN t.status = 'success' THEN 1 END)::decimal /
           NULLIF(COUNT(t.id), 0)) * 100, 2
        ) as success_rate
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
        ${dateFilter.createdAt ? Prisma.sql`AND t.created_at >= ${dateFilter.createdAt.gte} AND t.created_at <= ${dateFilter.createdAt.lte}` : Prisma.sql``}
      WHERE u.active = true
        ${userRole !== 'admin' ? Prisma.sql`AND u.id = ${userId}` : Prisma.sql``}
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: dateFilter,
      include: {
        signType: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const transformedRecent = recentTransactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      signTypeId: tx.signTypeId,
      signTypeName: tx.signType.name,
      businessName: tx.businessName,
      businessAddress: tx.businessAddress,
      placeId: tx.placeId,
      reviewUrl: tx.reviewUrl,
      status: tx.status,
      salePrice: tx.salePrice,
      locationLat: tx.locationLat,
      locationLng: tx.locationLng,
      notes: tx.notes,
      programmedAt: tx.programmedAt.toISOString(),
      erasedAt: tx.erasedAt?.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString()
    }));

    const dashboard = {
      stats: {
        totalSales: totalSales,
        totalRevenue: totalRevenue._sum.salePrice || 0,
        failedSales: failedSales,
        activeUsers: activeUsers.length,
        todaysSales: todaysStats._count,
        todaysRevenue: todaysStats._sum.salePrice || 0
      },
      salesTrend: salesTrend,
      signPopularity: signPopularity,
      topUsers: topUsers,
      recentTransactions: transformedRecent
    };

    return NextResponse.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}