import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const tag = await prisma.preprogrammedTag.findUnique({
      where: { slug }
    });

    if (!tag) {
      return new NextResponse('Tag not found', { status: 404 });
    }

    // Log the scan
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Fire and forget to not slow down redirect
    prisma.preprogrammedTagScan.create({
      data: {
        preprogrammedTagId: tag.id,
        userAgent,
        ipAddress,
        referrer,
        wasLinked: tag.status === 'linked'
      }
    }).catch(err => console.error('Failed to log scan:', err));

    // If tag is deactivated
    if (tag.status === 'deactivated') {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tag Deactivated</title>
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
              <h1>Tag Deactivated</h1>
              <p>This tag has been deactivated.</p>
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

    // If tag is not yet linked to a business
    if (tag.status === 'unlinked' || !tag.targetUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tag ${tag.tagUid} - Review Signs</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
              .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 40px rgb(0 0 0 / 0.3); max-width: 90%; width: 400px; text-align: center; color: #1f2937; }
              .tag-id { background: #f3f4f6; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-family: monospace; font-size: 1.25rem; font-weight: bold; color: #4f46e5; margin: 1rem 0; display: inline-block; }
              h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #1f2937; }
              .subtitle { color: #6b7280; margin-bottom: 1.5rem; }
              .info { background: #fef3c7; padding: 1rem; border-radius: 0.5rem; color: #92400e; margin-top: 1rem; font-size: 0.875rem; }
              .logo { font-size: 2rem; margin-bottom: 0.5rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">🏷️</div>
              <h1>Review Signs Tag</h1>
              <p class="subtitle">This tag is ready to be activated</p>
              <div class="tag-id">${tag.tagUid}</div>
              <div class="info">
                <strong>Tag ID:</strong> ${tag.tagUid}<br>
                <small>Contact your Review Signs representative to link this tag to your business.</small>
              </div>
            </div>
          </body>
        </html>
        `,
        { 
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Tag is linked - redirect to target URL
    return NextResponse.redirect(tag.targetUrl);

  } catch (error) {
    console.error('Error processing preprogrammed tag:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
