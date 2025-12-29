import { NextResponse } from 'next/server';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';
import { activityLogger, getRequestInfo } from '@/lib/activity-log';

/**
 * GET /api/nfc-interactions
 * Query NFC tag interactions (both writes and reads)
 * 
 * Query params:
 * - siteId: filter by site/place ID
 * - nfcTagId: filter by specific tag
 * - type: filter by interaction type (write, read)
 * - actionType: filter by action type (google, instagram, fruit_machine, etc.)
 * - promotionResult: filter by promotion result (win, lose)
 * - startDate: filter from date (ISO string)
 * - endDate: filter to date (ISO string)
 * - limit: number of results (default: 100)
 * - offset: pagination offset (default: 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      siteId: searchParams.get('siteId') || undefined,
      nfcTagId: searchParams.get('nfcTagId') || undefined,
      interactionType: (searchParams.get('type') as 'write' | 'read') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      promotionResult: searchParams.get('promotionResult') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await nfcTagInteractionService.query(filters);

    return NextResponse.json({
      success: true,
      total: result.total,
      data: result.interactions,
    });
  } catch (error) {
    console.error('Error fetching NFC interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFC interactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nfc-interactions
 * Log a new NFC tag interaction (write or read)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      interactionType,
      nfcTagId,
      siteId,
      businessName,
      businessAddress,
      latitude,
      longitude,
      actionType,
      promotionId,
      promotionResult,
      prizeType,
      prizeName,
      prizeValue,
      targetUrl,
      tagData,
      userId,
      deviceInfo,
      userAgent,
      ipAddress,
    } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    if (!interactionType || !['write', 'read'].includes(interactionType)) {
      return NextResponse.json(
        { error: 'interactionType must be "write" or "read"' },
        { status: 400 }
      );
    }

    let interaction;

    if (interactionType === 'write') {
      console.log('[NFC] Processing tag write:', { businessName, siteId, userId });
      
      interaction = await nfcTagInteractionService.logWrite({
        nfcTagId,
        siteId,
        businessName,
        businessAddress,
        latitude,
        longitude,
        actionType,
        targetUrl,
        tagData,
        userId,
        deviceInfo,
      });

      // Log to activity log
      console.log('[NFC] Logging to activity log...');
      await activityLogger.tagWritten(
        userId,
        `Tag programmed for ${businessName || siteId}`,
        { nfcTagId, siteId, businessName, actionType, targetUrl },
        getRequestInfo(request)
      ).catch(err => console.error('[ActivityLog] Error:', err));
      console.log('[NFC] Activity log complete');
    } else {
      if (!actionType) {
        return NextResponse.json(
          { error: 'actionType is required for read interactions' },
          { status: 400 }
        );
      }

      interaction = await nfcTagInteractionService.logRead({
        nfcTagId,
        siteId,
        businessName,
        businessAddress,
        latitude,
        longitude,
        actionType,
        promotionId,
        promotionResult,
        prizeType,
        prizeName,
        prizeValue,
        targetUrl,
        tagData,
        userAgent: userAgent || request.headers.get('user-agent') || undefined,
        ipAddress: ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      });
    }

    return NextResponse.json({ success: true, data: interaction }, { status: 201 });
  } catch (error) {
    console.error('Error logging NFC interaction:', error);
    return NextResponse.json(
      { error: 'Failed to log NFC interaction' },
      { status: 500 }
    );
  }
}
