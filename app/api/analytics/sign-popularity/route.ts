import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyMobileToken } from '@/lib/auth-mobile';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyMobileToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const role = typeof payload.role === 'string' ? payload.role.toLowerCase() : '';
    const userId = typeof payload.userId === 'string' ? payload.userId : undefined;

    const signPopularity = await prisma.$queryRaw`
      SELECT
        st.name as sign_type,
        COUNT(t.id) as quantity,
        COALESCE(SUM(t.sale_price), 0) as revenue
      FROM transactions t
      JOIN sign_types st ON t.sign_type_id = st.id
      WHERE t.status = 'success'
        ${role !== 'admin' && userId ? Prisma.sql`AND t.user_id = ${userId}` : Prisma.sql``}
      GROUP BY st.id, st.name
      ORDER BY quantity DESC
    `;

    return NextResponse.json({
      success: true,
      data: signPopularity
    });

  } catch (error) {
    console.error('Error fetching sign popularity:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}