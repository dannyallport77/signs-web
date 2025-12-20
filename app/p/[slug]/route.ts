import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';
import { nfcTagService } from '@/lib/services/nfcTagService';

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

    // Check if there's an NFCTag record for this preprogrammed tag (for trial tracking)
    let isTrialTag = false;
    let trialDaysRemaining = 0;
    let nfcTagId: string | null = null;
    let needsSoftwareUpdate = false;
    
    if (tag.tagUid) {
      const nfcTag = await nfcTagService.getTag(tag.tagUid);
      
      if (nfcTag) {
        const trialStatus = await nfcTagService.getTrialStatus(tag.tagUid);
        nfcTagId = nfcTag.id;
        
        // Check if tag has incomplete data (missing customer site ID or sale price)
        // Tags written before the customer details feature won't have customerSiteId
        if (!nfcTag.customerSiteId) {
          needsSoftwareUpdate = true;
        }
        
        // If trial is expired and not paid, redirect to trial-expired page
        if (trialStatus.isTrial && !trialStatus.isPaid && trialStatus.isExpired) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
          return NextResponse.redirect(`${baseUrl}/trial-expired?tag=${nfcTag.id}`);
        }
        
        // Check if still on trial (not expired, not paid)
        if (trialStatus.isTrial && !trialStatus.isPaid) {
          isTrialTag = true;
          trialDaysRemaining = trialStatus.daysRemaining;
        }
      } else {
        // NFCTag record doesn't exist - needs software update
        needsSoftwareUpdate = true;
      }
    } else {
      // No tagUid associated - needs software update
      needsSoftwareUpdate = true;
    }
    
    // Show software update message for tags with incomplete data
    if (needsSoftwareUpdate) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Software Update Required - Review Signs</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                margin: 0; 
                padding: 1rem;
                background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
              }
              .card { 
                background: white; 
                padding: 2rem; 
                border-radius: 1.5rem; 
                box-shadow: 0 20px 60px rgb(0 0 0 / 0.2); 
                max-width: 90%; 
                width: 420px; 
                text-align: center; 
              }
              .icon { 
                font-size: 4rem; 
                margin-bottom: 1rem; 
              }
              h1 { 
                font-size: 1.5rem; 
                margin-bottom: 0.75rem; 
                color: #92400e; 
              }
              .message { 
                color: #78350f; 
                margin-bottom: 1.5rem; 
                line-height: 1.6; 
              }
              .phone-box { 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                padding: 1.25rem; 
                border-radius: 1rem; 
                margin-bottom: 1rem;
              }
              .phone-label { 
                color: rgba(255,255,255,0.9); 
                font-size: 0.875rem; 
                margin-bottom: 0.5rem; 
              }
              .phone-number { 
                color: white; 
                font-size: 1.75rem; 
                font-weight: bold; 
                text-decoration: none;
                display: block;
              }
              .phone-number:hover {
                text-decoration: underline;
              }
              .free-badge { 
                display: inline-block;
                background: #fbbf24; 
                color: #78350f; 
                padding: 0.5rem 1rem; 
                border-radius: 2rem; 
                font-weight: 600; 
                font-size: 0.875rem;
                margin-top: 0.5rem;
              }
              .footer { 
                color: #a8a29e; 
                font-size: 0.75rem; 
                margin-top: 1.5rem; 
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">🔄</div>
              <h1>Software Update Required</h1>
              <p class="message">
                Your tag requires a software update to continue working properly. 
                Please call us and we will come and update it for you.
              </p>
              <div class="phone-box">
                <div class="phone-label">Call us now:</div>
                <a href="tel:07484684658" class="phone-number">07484 684658</a>
              </div>
              <span class="free-badge">✓ FREE OF CHARGE</span>
              <p class="footer">Update will be completed immediately</p>
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

    // Log the scan
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Determine action type from target URL
    let actionType = 'preprogrammed_tag';
    if (tag.targetUrl) {
      const url = tag.targetUrl.toLowerCase();
      if (url.includes('google') || url.includes('g.page')) actionType = 'google';
      else if (url.includes('facebook')) actionType = 'facebook';
      else if (url.includes('instagram')) actionType = 'instagram';
      else if (url.includes('tripadvisor')) actionType = 'tripadvisor';
    }

    // Fire and forget to not slow down redirect - log to NFCTagInteraction
    nfcTagInteractionService.logRead({
      siteId: tag.placeId || slug,
      businessName: tag.businessName || undefined,
      businessAddress: tag.businessAddress || undefined,
      actionType,
      targetUrl: tag.targetUrl || undefined,
      userAgent,
      ipAddress,
      tagData: {
        preprogrammedTagId: tag.id,
        tagUid: tag.tagUid,
        slug,
        wasLinked: tag.status === 'linked',
        referrer,
      },
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
    // If it's a trial tag, show the trial banner page first
    if (isTrialTag && tag.targetUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
      const redirectParams = new URLSearchParams({
        url: encodeURIComponent(tag.targetUrl),
        business: encodeURIComponent(tag.businessName || ''),
        trial: 'true',
        days: trialDaysRemaining.toString(),
        ...(nfcTagId && { tag: nfcTagId }),
      });
      return NextResponse.redirect(`${baseUrl}/tag-redirect?${redirectParams.toString()}`);
    }
    
    return NextResponse.redirect(tag.targetUrl);

  } catch (error) {
    console.error('Error processing preprogrammed tag:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
