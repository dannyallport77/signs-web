import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ slug: string; platformId: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug, platformId } = await context.params;
    const platform = await prisma.reviewPlatform.findFirst({
      where: {
        id: platformId,
        enabled: true,
        menu: {
          slug,
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
