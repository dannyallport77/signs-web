import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        movements: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching stock item:', error);
    return NextResponse.json({ error: 'Failed to fetch stock item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, minQuantity, location, quantity } = body;

    // If quantity is being updated, handle stock movement
    if (quantity !== undefined) {
      const currentItem = await prisma.stockItem.findUnique({
        where: { id }
      });

      if (currentItem && currentItem.quantity !== parseInt(quantity)) {
        await prisma.stockMovement.create({
          data: {
            stockItemId: id,
            userId: (session.user as any).id,
            type: 'adjustment',
            quantity: parseInt(quantity),
            reason: 'Manual edit',
            notes: `Changed from ${currentItem.quantity} to ${quantity}`
          }
        });
      }
    }

    const item = await prisma.stockItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(minQuantity !== undefined && { minQuantity: parseInt(minQuantity) }),
        ...(location !== undefined && { location }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
      }
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json({ error: 'Failed to update stock item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.stockItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Stock item deleted' });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json({ error: 'Failed to delete stock item' }, { status: 500 });
  }
}
