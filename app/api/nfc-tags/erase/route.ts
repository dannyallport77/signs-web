import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';
import { getRequestUser } from '@/lib/request-auth';

/**
 * POST /api/nfc-tags/erase
 * Mark an existing tag as erased when it's being overwritten
 */
export async function POST(request: Request) {
  try {
    const requestUser = await getRequestUser(request);
    if (!requestUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      existingUrl,
      tagUid,
      erasedBy,
      newBusinessName,
      newPlaceId,
    } = body;

    if (!existingUrl && !tagUid) {
      return NextResponse.json(
        { error: 'Either existingUrl or tagUid is required' },
        { status: 400 }
      );
    }

    const erasedAt = new Date();
    const resolvedErasedBy = erasedBy || requestUser.name || requestUser.email || 'Mobile App';
    let erasedTag = null;

    // Try to find the existing tag by URL or tagUid
    if (existingUrl) {
      // Extract slug from URL if it's a review-signs URL
      // URLs look like: https://review-signs.co.uk/p/abc123 or similar
      const urlMatch = existingUrl.match(/\/p\/([a-zA-Z0-9]+)/);
      const slug = urlMatch ? urlMatch[1] : null;

      if (slug) {
        // Find preprogrammed tag by slug
        const preprogrammedTag = await prisma.preprogrammedTag.findUnique({
          where: { slug }
        });

        if (preprogrammedTag && preprogrammedTag.tagUid) {
          // Find NFCTag by tagUid
          erasedTag = await prisma.nFCTag.findFirst({
            where: { tagUid: preprogrammedTag.tagUid }
          });
        }
      }

      // Also try to match by reviewUrl directly
      if (!erasedTag) {
        erasedTag = await prisma.nFCTag.findFirst({
          where: { reviewUrl: existingUrl }
        });
      }
    }

    // Try by tagUid if we still haven't found it
    if (!erasedTag && tagUid) {
      erasedTag = await prisma.nFCTag.findFirst({
        where: { tagUid }
      });
    }

    // If we found the tag, mark it as erased
    if (erasedTag) {
      await prisma.nFCTag.update({
        where: { id: erasedTag.id },
        data: {
          status: 'erased',
          erasedAt,
          erasedBy: resolvedErasedBy,
        }
      });

      // Log the erasure interaction
      await nfcTagInteractionService.logRead({
        siteId: erasedTag.placeId,
        businessName: erasedTag.businessName,
        businessAddress: erasedTag.businessAddress || undefined,
        actionType: 'tag_erased',
        userAgent: 'Mobile App',
        ipAddress: 'mobile',
        tagData: {
          erasedTagId: erasedTag.id,
          erasedTagUid: tagUid,
          previousUrl: existingUrl,
          newBusinessName,
          newPlaceId,
          erasedAt: erasedAt.toISOString(),
          erasedBy: resolvedErasedBy,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Tag marked as erased',
        erasedTag: {
          id: erasedTag.id,
          businessName: erasedTag.businessName,
          placeId: erasedTag.placeId,
          erasedAt: erasedAt.toISOString(),
        },
      });
    }

    // Tag not found in database - log for tracking purposes
    console.log('[Erase] Tag not found in database:', { existingUrl, tagUid });
    
    // Still log the erasure attempt for unknown tags
    await nfcTagInteractionService.logRead({
      siteId: newPlaceId || 'unknown',
      businessName: newBusinessName || 'Unknown',
      actionType: 'tag_erased_unknown',
      userAgent: 'Mobile App',
      ipAddress: 'mobile',
      tagData: {
        previousUrl: existingUrl,
        tagUid,
        erasedAt: erasedAt.toISOString(),
        erasedBy: resolvedErasedBy,
        note: 'Tag was not found in database - may be from before tracking system',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Erasure logged (tag not found in database)',
      wasInDatabase: false,
    });
  } catch (error) {
    console.error('Error marking tag as erased:', error);
    return NextResponse.json(
      { error: 'Failed to mark tag as erased' },
      { status: 500 }
    );
  }
}
