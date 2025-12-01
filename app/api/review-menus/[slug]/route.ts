import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlatformPayload, sanitizePlatforms } from '@/lib/reviewMenuUtils';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const menu = await prisma.reviewPlatformMenu.findUnique({
      where: { slug },
      include: {
        platforms: {
          where: { enabled: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: menu });
  } catch (error) {
    console.error('Failed to fetch review menu', error);
    return NextResponse.json({ error: 'Failed to fetch review menu' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const {
      businessName,
      businessAddress,
      placeId,
      heroTitle,
      heroSubtitle,
      logoUrl,
      platforms,
      wifiSsid,
      wifiPassword,
      wifiSecurity,
      promotionId,
    } = body as {
      businessName?: string;
      businessAddress?: string;
      placeId?: string;
      heroTitle?: string;
      heroSubtitle?: string;
      logoUrl?: string;
      platforms?: PlatformPayload[];
      wifiSsid?: string;
      wifiPassword?: string;
      wifiSecurity?: string;
      promotionId?: string;
    };

    const existingMenu = await prisma.reviewPlatformMenu.findUnique({ where: { slug } });

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    const updateData: Prisma.ReviewPlatformMenuUpdateInput = {};
    if (businessName) updateData.businessName = businessName;
    if (businessAddress !== undefined) updateData.businessAddress = businessAddress;
    if (placeId !== undefined) updateData.placeId = placeId;
    if (heroTitle !== undefined) updateData.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) updateData.heroSubtitle = heroSubtitle;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (wifiSsid !== undefined) updateData.wifiSsid = wifiSsid;
    if (wifiPassword !== undefined) updateData.wifiPassword = wifiPassword;
    if (wifiSecurity !== undefined) updateData.wifiSecurity = wifiSecurity;
    if (promotionId !== undefined) updateData.promotionId = promotionId;

    const sanitizedPlatforms = Array.isArray(platforms) ? sanitizePlatforms(platforms) : null;
    if (sanitizedPlatforms && sanitizedPlatforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform must remain enabled' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const menu = await tx.reviewPlatformMenu.update({
        where: { id: existingMenu.id },
        data: updateData,
      });

      if (sanitizedPlatforms) {
        await tx.reviewPlatform.deleteMany({ where: { menuId: menu.id } });
        await Promise.all(
          sanitizedPlatforms.map((platform) =>
            tx.reviewPlatform.create({
              data: {
                ...platform,
                menuId: menu.id,
              },
            })
          )
        );
      }

      return menu;
    });

    const hydratedMenu = await prisma.reviewPlatformMenu.findUnique({
      where: { id: updated.id },
      include: {
        platforms: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: hydratedMenu });
  } catch (error: unknown) {
    console.error('Failed to update review menu', error);
    const message = error instanceof Error ? error.message : 'Failed to update review menu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
