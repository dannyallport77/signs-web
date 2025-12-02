import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'socialMediaCachingEnabled' },
    });

    const enabled = setting?.value !== 'false';

    return NextResponse.json({
      success: true,
      caching: {
        enabled,
        description: 'Whether to cache social media search results (30 days)',
      },
    });
  } catch (error) {
    console.error('Error fetching caching setting:', error);
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });
    }

    await prisma.systemSettings.upsert({
      where: { key: 'socialMediaCachingEnabled' },
      create: {
        key: 'socialMediaCachingEnabled',
        value: enabled ? 'true' : 'false',
        type: 'boolean',
        description: 'Whether to cache social media search results',
      },
      update: {
        value: enabled ? 'true' : 'false',
      },
    });

    return NextResponse.json({
      success: true,
      caching: {
        enabled,
        message: `Caching ${enabled ? 'enabled' : 'disabled'}`,
      },
    });
  } catch (error) {
    console.error('Error updating caching setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
