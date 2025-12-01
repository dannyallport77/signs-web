import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string; platformId: string } }
) {
  try {
    const platform = await prisma.reviewPlatform.findFirst({
      where: {
        id: params.platformId,
        enabled: true,
        menu: {
          slug: params.slug,
        },
      },
    });

    if (!platform || !platform.url) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    return NextResponse.redirect(platform.url);
  } catch (error) {
    console.error('Failed to redirect review platform:', error);
    return NextResponse.json({ error: 'Failed to open platform' }, { status: 500 });
  }
}
