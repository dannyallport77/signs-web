import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.stockItem.findMany({
      include: {
        _count: {
          select: { movements: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate low stock items
    const lowStockCount = items.filter((item: { quantity: number; minQuantity: number }) => item.quantity <= item.minQuantity).length;

    return NextResponse.json({ 
      success: true, 
      data: items,
      stats: {
        total: items.length,
        lowStock: lowStockCount
      }
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, sku, quantity = 0, minQuantity = 10, location } = body;

    if (!name || !sku) {
      return NextResponse.json(
        { error: 'Name and SKU are required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existing = await prisma.stockItem.findUnique({
      where: { sku }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    const item = await prisma.stockItem.create({
      data: {
        name,
        description,
        sku,
        quantity: parseInt(quantity),
        minQuantity: parseInt(minQuantity),
        location,
      }
    });

    // Create initial stock movement if quantity > 0
    if (parseInt(quantity) > 0) {
      await prisma.stockMovement.create({
        data: {
          stockItemId: item.id,
          userId: (session.user as any).id,
          type: 'in',
          quantity: parseInt(quantity),
          reason: 'Initial stock',
        }
      });
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Failed to create stock item' }, { status: 500 });
  }
}
