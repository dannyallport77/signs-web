import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { active, suspended } = body;

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (suspended !== undefined) updateData.suspended = suspended;

    const smartLink = await prisma.smartLink.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: smartLink });
  } catch (error) {
    console.error('Error updating smart link:', error);
    return NextResponse.json(
      { error: 'Failed to update smart link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.smartLink.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting smart link:', error);
    return NextResponse.json(
      { error: 'Failed to delete smart link' },
      { status: 500 }
    );
  }
}
