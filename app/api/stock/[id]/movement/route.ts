import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, quantity, reason, notes } = body;

    if (!type || !quantity) {
      return NextResponse.json(
        { error: 'Type and quantity are required' },
        { status: 400 }
      );
    }

    const parsedQuantity = parseInt(quantity);

    // Get current stock
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: params.id }
    });

    if (!stockItem) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    // Calculate new quantity
    let newQuantity = stockItem.quantity;
    if (type === 'in') {
      newQuantity += parsedQuantity;
    } else if (type === 'out') {
      newQuantity -= parsedQuantity;
      if (newQuantity < 0) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        );
      }
    } else if (type === 'adjustment') {
      newQuantity = parsedQuantity;
    }

    // Create movement and update stock in a transaction
    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          stockItemId: params.id,
          userId: (session.user as any).id,
          type,
          quantity: parsedQuantity,
          reason,
          notes,
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.stockItem.update({
        where: { id: params.id },
        data: { quantity: newQuantity }
      })
    ]);

    return NextResponse.json({ success: true, data: movement }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 });
  }
}
