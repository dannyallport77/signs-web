import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Pixel tracking endpoint for email opens
 * This endpoint is called via a tracking pixel in emails
 * GET /api/invoices/track/[token] - records email open
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Find invoice by tracking token
    const invoice = await prisma.invoice.findUnique({
      where: { trackingToken: token },
    });

    if (!invoice) {
      // Return 1x1 transparent pixel (fail silently)
      return new Response(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Record this open
    await prisma.invoiceOpen.create({
      data: {
        invoiceId: invoice.id,
        userAgent,
        ipAddress: ip === 'unknown' ? null : ip,
      },
    });

    // Update invoice with open tracking
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        emailOpened: true,
        emailOpenedAt: invoice.emailOpenedAt || new Date(), // Keep first open time
        openCount: invoice.openCount + 1,
        lastOpenedAt: new Date(),
      },
    });

    // Return 1x1 transparent pixel
    return new Response(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error tracking email open:', error);
    // Still return pixel on error (fail silently)
    return new Response(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
        },
      }
    );
  }
}
