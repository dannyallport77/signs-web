import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const smartLink = await prisma.smartLink.findUnique({
      where: { slug }
    });

    if (!smartLink) {
      return new NextResponse('Link not found', { status: 404 });
    }

    if (!smartLink.active || smartLink.suspended) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Disabled</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f3f4f6; color: #1f2937; }
              .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 90%; width: 400px; text-align: center; }
              h1 { font-size: 1.5rem; margin-bottom: 1rem; }
              p { color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Temporarily Unavailable</h1>
              <p>This tag has been disabled or suspended by the administrator.</p>
            </div>
          </body>
        </html>
        `,
        { 
          status: 403,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Log the scan to unified NFCTagInteraction (fire and forget)
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    nfcTagInteractionService.logRead({
      siteId: smartLink.placeId,
      businessName: smartLink.businessName,
      actionType: 'smart_link',
      userAgent,
      ipAddress,
      metadata: {
        smartLinkId: smartLink.id,
        slug: smartLink.slug,
        targetUrl: smartLink.targetUrl,
      }
    }).catch(err => console.error('Failed to log scan:', err));

    // Redirect to target
    return NextResponse.redirect(smartLink.targetUrl);

  } catch (error) {
    console.error('Error processing smart link:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
