import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      include: {
        items: true,
        opens: {
          orderBy: { openedAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error: any) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const role = ((session?.user as any)?.role || '').toLowerCase();
    if (!session?.user || role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : [];

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No invoice ids provided' }, { status: 400 });
    }

    // Delete dependent records first to avoid FK issues
    await prisma.invoiceOpen.deleteMany({ where: { invoiceId: { in: ids } } });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });

    const deleted = await prisma.invoice.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ success: true, deleted: deleted.count });
  } catch (error: any) {
    console.error('Delete invoices error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
