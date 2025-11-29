import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      businessName, 
      businessAddress, 
      placeId, 
      reviewUrl, 
      latitude, 
      longitude,
      writtenBy 
    } = body;

    if (!businessName || !placeId || !reviewUrl) {
      return NextResponse.json(
        { error: 'Business name, placeId, and reviewUrl are required' },
        { status: 400 }
      );
    }

    const nfcTag = await prisma.nFCTag.create({
      data: {
        businessName,
        businessAddress,
        placeId,
        reviewUrl,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        writtenBy,
      }
    });

    return NextResponse.json({ success: true, data: nfcTag }, { status: 201 });
  } catch (error) {
    console.error('Error logging NFC tag:', error);
    return NextResponse.json(
      { error: 'Failed to log NFC tag' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tags = await prisma.nFCTag.findMany({
      orderBy: { writtenAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching NFC tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFC tags' },
      { status: 500 }
    );
  }
}
