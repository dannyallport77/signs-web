import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth-mobile';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    let userRole: string = 'user';

    // Try NextAuth session first (for web) - works with cookies automatically
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      // Web user authenticated via NextAuth
      userId = (session.user as any).id;
      userRole = ((session.user as any).role || 'user').toLowerCase();
    } else {
      // Try mobile JWT token
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await verifyMobileToken(token);
        if (payload) {
          userId = (payload as any).userId;
          userRole = ((payload as any).role || 'user').toLowerCase();
        }
      }
    }

    // If still no user, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Get stats using Prisma
    const [totalSales, totalRevenue, failedSales, activeUsers, todaysStats, recentTransactions] = await Promise.all([
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
      }),

      // Get recent transactions
      prisma.transaction.findMany({
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
      })
    ]);

    // Get sign popularity using Prisma groupBy
    const signPopularityData = await prisma.transaction.groupBy({
      by: ['signTypeId'],
      where: {
        ...dateFilter,
        status: 'success'
      },
      _count: true,
      _sum: {
        salePrice: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Fetch sign type names
    const signTypeIds = signPopularityData.map(sp => sp.signTypeId);
    const signTypes = await prisma.signType.findMany({
      where: {
        id: {
          in: signTypeIds
        }
      }
    });

    const signTypeMap = new Map(signTypes.map(st => [st.id, st.name]));
    const signPopularity = signPopularityData.map(sp => ({
      sign_type: signTypeMap.get(sp.signTypeId) || 'Unknown',
      quantity: sp._count,
      revenue: sp._sum.salePrice || 0
    }));

    // Get top users using Prisma groupBy
    const topUsersData = await prisma.transaction.groupBy({
      by: ['userId'],
      where: {
        ...dateFilter
      },
      _count: true,
      _sum: {
        salePrice: true
      },
      orderBy: {
        _sum: {
          salePrice: 'desc'
        }
      },
      take: 10
    });

    // Fetch user details
    const userIds = topUsersData.map(tu => tu.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u.name]));
    const topUsers = topUsersData.map(tu => ({
      user_id: tu.userId,
      name: userMap.get(tu.userId) || 'Unknown',
      total_sales: tu._count,
      total_revenue: tu._sum.salePrice || 0,
      success_rate: 100 // Simplified for now
    }));

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

    // Generate sales trend using Prisma (simplified - group by day)
    const allTransactions = await prisma.transaction.findMany({
      where: {
        ...dateFilter,
        status: 'success'
      },
      select: {
        createdAt: true,
        salePrice: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const salesTrendMap = new Map<string, { sales: number; revenue: number }>();
    allTransactions.forEach(tx => {
      const date = tx.createdAt.toISOString().split('T')[0];
      const existing = salesTrendMap.get(date) || { sales: 0, revenue: 0 };
      salesTrendMap.set(date, {
        sales: existing.sales + 1,
        revenue: existing.revenue + (tx.salePrice || 0)
      });
    });

    const salesTrend = Array.from(salesTrendMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      revenue: data.revenue
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
