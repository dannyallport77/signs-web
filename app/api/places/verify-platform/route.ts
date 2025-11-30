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
        url = `https://www.facebook.com/${businessNameClean}`;
        verified = await verifyUrl(url);
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
      case 'trustpilot':
      case 'yell':
      case 'checkatrade':
      case 'ratedpeople':
      case 'trustatrader':
        // Review platforms - we can't reliably verify without proper business IDs
        // Return false since we don't have actual profile URLs
        verified = false;
        url = undefined;
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
