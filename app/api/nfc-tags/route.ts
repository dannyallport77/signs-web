import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';
import { activityLogger, getRequestInfo } from '@/lib/activity-log';

export async function POST(request: Request) {
  console.log('\n========== /api/nfc-tags POST called ==========');
  try {
    const body = await request.json();
    console.log('[NFC-TAGS] Request body:', JSON.stringify(body, null, 2));
    const { 
      businessName, 
      businessAddress, 
      placeId, 
      reviewUrl, 
      latitude, 
      longitude,
      writtenBy,
      tagUid,
      salePrice,
      isTrial,
      trialDays,
      trialEndPrice,
    } = body;

    if (!businessName || !placeId || !reviewUrl) {
      return NextResponse.json(
        { error: 'Business name, placeId, and reviewUrl are required' },
        { status: 400 }
      );
    }

    // Determine action type from reviewUrl
    let actionType = 'google';
    if (reviewUrl) {
      const url = reviewUrl.toLowerCase();
      if (url.includes('facebook')) actionType = 'facebook';
      else if (url.includes('instagram')) actionType = 'instagram';
      else if (url.includes('tripadvisor')) actionType = 'tripadvisor';
      else if (url.includes('trustpilot')) actionType = 'trustpilot';
      else if (url.includes('yelp')) actionType = 'yelp';
    }

    // Look up customer site for this placeId
    const customerSite = await prisma.customerSite.findUnique({
      where: { placeId }
    });

    // Create or update NFCTag record with trial/sale info
    let nfcTag;
    if (tagUid) {
      // Check if tag already exists by UID
      nfcTag = await prisma.nFCTag.findFirst({
        where: { tagUid }
      });

      if (nfcTag) {
        // Update existing tag
        nfcTag = await prisma.nFCTag.update({
          where: { id: nfcTag.id },
          data: {
            businessName,
            businessAddress,
            placeId,
            reviewUrl,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            writtenBy,
            writtenAt: new Date(),
            customerSiteId: customerSite?.id,
            // Update sale/trial info if changed
            salePrice: isTrial ? null : (salePrice ? parseFloat(salePrice) : null),
            isTrial: isTrial ?? true,
            trialStartDate: new Date(),
            trialDays: trialDays ?? 7,
            trialEndPrice: trialEndPrice ?? 30,
          }
        });
      } else {
        // Create new tag
        nfcTag = await prisma.nFCTag.create({
          data: {
            businessName,
            businessAddress,
            placeId,
            reviewUrl,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            writtenBy,
            tagUid,
            customerSiteId: customerSite?.id,
            salePrice: isTrial ? null : (salePrice ? parseFloat(salePrice) : null),
            isTrial: isTrial ?? true,
            trialStartDate: new Date(),
            trialDays: trialDays ?? 7,
            trialEndPrice: trialEndPrice ?? 30,
          }
        });
      }
    }

    // Log to NFCTagInteraction (unified system)
    const interaction = await nfcTagInteractionService.logWrite({
      nfcTagId: nfcTag?.id,
      tagUid,
      siteId: placeId,
      businessName,
      businessAddress,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      actionType,
      targetUrl: reviewUrl,
      userId: writtenBy,
    });

    // Log to activity log
    await activityLogger.tagWritten(
      writtenBy,
      `Tag programmed for ${businessName}`,
      { tagUid, placeId, businessName, actionType, reviewUrl, isTrial, salePrice },
      getRequestInfo(request)
    ).catch(err => console.error('[ActivityLog] Error:', err));

    return NextResponse.json({ 
      success: true, 
      data: {
        ...interaction,
        nfcTag,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging NFC tag:', error);
    return NextResponse.json(
      { error: 'Failed to log NFC tag' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'erased', 'all'
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get NFCTag records directly for complete data
    const nfcTags = await prisma.nFCTag.findMany({
      where,
      orderBy: { writtenAt: 'desc' },
      take: limit,
      include: {
        customerSite: {
          select: {
            customerName: true,
            customerEmail: true,
            customerPhone: true,
          }
        }
      }
    });

    // Format response
    const tags = nfcTags.map(tag => ({
      id: tag.id,
      businessName: tag.businessName,
      businessAddress: tag.businessAddress,
      placeId: tag.placeId,
      reviewUrl: tag.reviewUrl,
      latitude: tag.latitude,
      longitude: tag.longitude,
      writtenAt: tag.writtenAt,
      writtenBy: tag.writtenBy,
      tagUid: tag.tagUid,
      status: tag.status,
      erasedAt: tag.erasedAt,
      erasedBy: tag.erasedBy,
      salePrice: tag.salePrice,
      isTrial: tag.isTrial,
      isPaid: tag.isPaid,
      customerSite: tag.customerSite,
    }));

    // Get counts by status
    const [activeCount, erasedCount, totalCount] = await Promise.all([
      prisma.nFCTag.count({ where: { status: 'active' } }),
      prisma.nFCTag.count({ where: { status: 'erased' } }),
      prisma.nFCTag.count(),
    ]);

    return NextResponse.json({ 
      success: true, 
      data: tags,
      counts: {
        active: activeCount,
        erased: erasedCount,
        total: totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching NFC tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFC tags' },
      { status: 500 }
    );
  }
}
