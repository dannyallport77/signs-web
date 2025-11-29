import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const signTypeId = searchParams.get('signTypeId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Build where clause
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (userId) where.userId = userId;
    if (signTypeId) where.signTypeId = signTypeId;
    if (status) where.status = status;

    // If not admin, only show user's own transactions
    if (payload.role !== 'admin') {
      where.userId = payload.userId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        signType: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transform to match expected format
    const transformedTransactions = transactions.map(tx => ({
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

    return NextResponse.json({
      success: true,
      data: transformedTransactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      userId,
      signTypeId,
      businessName,
      businessAddress,
      placeId,
      reviewUrl,
      locationLat,
      locationLng,
      notes
    } = body;

    // Validate required fields
    if (!signTypeId || !businessName || !placeId || !reviewUrl || locationLat === undefined || locationLng === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use provided userId or session userId
    const transactionUserId = userId || payload.userId;

    const transaction = await prisma.transaction.create({
      data: {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: transactionUserId,
        signTypeId,
        businessName,
        businessAddress,
        placeId,
        reviewUrl,
        locationLat,
        locationLng,
        status: 'pending',
        notes,
          updatedAt: new Date()
      },
      include: {
        signType: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Transform response
    const transformedTransaction = {
      id: transaction.id,
      userId: transaction.userId,
      signTypeId: transaction.signTypeId,
      signTypeName: transaction.signType.name,
      businessName: transaction.businessName,
      businessAddress: transaction.businessAddress,
      placeId: transaction.placeId,
      reviewUrl: transaction.reviewUrl,
      status: transaction.status,
      salePrice: transaction.salePrice,
      locationLat: transaction.locationLat,
      locationLng: transaction.locationLng,
      notes: transaction.notes,
      programmedAt: transaction.programmedAt.toISOString(),
      erasedAt: transaction.erasedAt?.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: transformedTransaction
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}