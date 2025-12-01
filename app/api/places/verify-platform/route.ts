import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for verification results (expires after 1 hour)
const verificationCache: Map<string, { verified: boolean; url?: string; timestamp: number }> = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Helper to verify if a URL is legitimate
async function verifyUrl(url: string, timeoutMs: number = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD for faster checks
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
}

// Extracts the first direct review link from a Trustpilot search response
function extractTrustpilotReviewUrl(html: string): string | undefined {
  const match = html.match(/href="(\/review\/[^"?#]+)"/i);
  if (!match) {
    return undefined;
  }
  try {
    return new URL(match[1], 'https://www.trustpilot.com').toString();
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const platform = request.nextUrl.searchParams.get('platform');
    const businessName = request.nextUrl.searchParams.get('businessName');
    const address = request.nextUrl.searchParams.get('address');

    if (!platform || !businessName) {
      return NextResponse.json({ error: 'platform and businessName are required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${platform}:${businessName}:${address || ''}`;
    const cached = verificationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ 
        success: true, 
        platform,
        verified: cached.verified,
        url: cached.url 
      });
    }

    const businessNameClean = businessName.replace(/\s+/g, '').toLowerCase();
    const businessNameHyphen = businessName.replace(/\s+/g, '-').toLowerCase();
    
    let url: string | undefined;
    let verified = false;

    switch (platform) {
      case 'facebook':
        // Facebook blocks programmatic verification - return unverified
        verified = false;
        url = undefined;
        break;

      case 'instagram':
        url = `https://www.instagram.com/${businessNameClean}`;
        verified = await verifyUrl(url);
        break;

      case 'twitter':
        url = `https://twitter.com/${businessNameClean}`;
        verified = await verifyUrl(url);
        break;

      case 'tiktok':
        url = `https://www.tiktok.com/@${businessNameClean}`;
        verified = await verifyUrl(url);
        break;

      case 'linkedin':
        url = `https://www.linkedin.com/company/${businessNameHyphen}`;
        verified = await verifyUrl(url);
        break;

      case 'tripadvisor':
        // Try to find the business on TripAdvisor by searching
        url = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`;
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          const html = await response.text();
          // Check if we get actual results (not just the search page)
          verified = html.includes('data-locationid') || html.includes('location-review-review-list');
        } catch {
          verified = false;
        }
        break;

      case 'trustpilot':
        // Try to find the business on Trustpilot
        try {
          // Try direct business page first
          const trustpilotSlug = businessNameHyphen.replace(/[^a-z0-9-]/g, '');
          const directUrl = `https://www.trustpilot.com/review/${trustpilotSlug}`;
          const directResponse = await fetch(directUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            redirect: 'manual'
          });
          if (directResponse.status === 200) {
            url = directUrl;
            verified = true;
          } else {
            // Fall back to search
            const searchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`;
            const searchResponse = await fetch(searchUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const html = await searchResponse.text();
            const reviewLink = extractTrustpilotReviewUrl(html);
            if (reviewLink) {
              url = reviewLink;
              verified = true;
            } else {
              url = searchUrl;
              verified = false;
            }
          }
        } catch {
          verified = false;
        }
        break;

      case 'yell':
        // Try to find the business on Yell
        url = `https://www.yell.com/biz/${businessNameHyphen}/`;
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            redirect: 'manual'
          });
          verified = response.status === 200;
          if (!verified) {
            // Try search if direct URL fails
            url = `https://www.yell.com/search?keywords=${encodeURIComponent(businessName)}`;
          }
        } catch {
          verified = false;
        }
        break;

      case 'checkatrade':
        // Try to find on Checkatrade
        try {
          const searchUrl = `https://www.checkatrade.com/trades/${businessNameHyphen}`;
          const response = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            redirect: 'manual'
          });
          if (response.status === 200) {
            url = searchUrl;
            verified = true;
          } else {
            url = `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`;
            verified = false;
          }
        } catch {
          verified = false;
        }
        break;

      case 'ratedpeople':
        // Try to find on Rated People
        url = `https://www.ratedpeople.com/tradesman/${businessNameHyphen}`;
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            redirect: 'manual'
          });
          verified = response.status === 200;
        } catch {
          verified = false;
        }
        break;

      case 'trustatrader':
        // Try to find on TrustATrader
        try {
          const directUrl = `https://www.trustatrader.com/trader/${businessNameHyphen}`;
          const response = await fetch(directUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            redirect: 'manual'
          });
          if (response.status === 200) {
            url = directUrl;
            verified = true;
          } else {
            url = `https://www.trustatrader.com/search?keywords=${encodeURIComponent(businessName)}`;
            verified = false;
          }
        } catch {
          verified = false;
        }
        break;

      default:
        return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
    }

    // Cache the result
    verificationCache.set(cacheKey, { verified, url, timestamp: Date.now() });

    return NextResponse.json({ 
      success: true, 
      platform,
      verified,
      url 
    });
  } catch (error: any) {
    console.error('Platform verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
