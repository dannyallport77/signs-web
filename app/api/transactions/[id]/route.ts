import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth-mobile';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Find the transaction
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only update their own transactions
    if (role !== 'admin' && (!userId || existingTransaction.userId !== userId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updateData: any = {};

    // Handle status updates
    if (body.status) {
      updateData.status = body.status;

      // If marking as erased, set erasedAt
      if (body.status === 'erased') {
        updateData.erasedAt = new Date();
      }

      // If marking as success, set salePrice
      if (body.status === 'success' && body.salePrice !== undefined) {
        updateData.salePrice = body.salePrice;
      }
    }

    // Handle other fields
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.salePrice !== undefined) updateData.salePrice = body.salePrice;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
