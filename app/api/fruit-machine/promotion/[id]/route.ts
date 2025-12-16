import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing promotion ID' },
        { status: 400 }
      );
    }

    // Try finding in new table first
    const fruitMachinePromotion = await prisma.fruitMachinePromotion.findUnique({
      where: { id },
    });

    if (fruitMachinePromotion) {
      // Normalize response to match what clients might expect
      // If clients expect 'giftName', we might need to map the first prize
      return NextResponse.json({
        ...fruitMachinePromotion,
        // Map prizes to prizeOptions for mobile app compatibility if needed
        prizeOptions: fruitMachinePromotion.prizes,
        // Legacy compatibility fields (optional, pick first prize)
        giftName: Array.isArray(fruitMachinePromotion.prizes) && fruitMachinePromotion.prizes.length > 0 
          ? (fruitMachinePromotion.prizes[0] as any).name 
          : 'Mystery Prize',
        giftEmoji: Array.isArray(fruitMachinePromotion.prizes) && fruitMachinePromotion.prizes.length > 0 
          ? (fruitMachinePromotion.prizes[0] as any).emoji 
          : '🎁',
      });
    }

    // Fallback to legacy table
    const promotion = await prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotion' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      enabled,
      startsAt,
      endsAt,
      name,
      winProbability,
      monthlyBudget,
      prizes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing promotion ID' },
        { status: 400 }
      );
    }

    // Check if promotion exists
    const existingPromotion = await prisma.fruitMachinePromotion.findUnique({
      where: { id },
    });

    if (!existingPromotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Update the promotion
    const updateData: any = {};
    
    if (enabled !== undefined) {
      updateData.enabled = enabled;
    }
    if (startsAt !== undefined) {
      updateData.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (endsAt !== undefined) {
      updateData.endsAt = endsAt ? new Date(endsAt) : null;
    }
    if (name !== undefined) {
      updateData.name = name;
    }
    if (winProbability !== undefined) {
      updateData.winProbability = winProbability;
    }
    if (monthlyBudget !== undefined) {
      updateData.monthlyBudget = monthlyBudget ? parseFloat(monthlyBudget) : null;
    }
    if (prizes !== undefined) {
      updateData.prizes = prizes;
    }

    const updatedPromotion = await prisma.fruitMachinePromotion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedPromotion);
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { error: 'Failed to update promotion' },
      { status: 500 }
    );
  }
}
