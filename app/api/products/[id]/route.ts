import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        options: true,
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
