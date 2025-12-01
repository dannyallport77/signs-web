import { NextRequest, NextResponse } from 'next/server';

interface SocialMediaLinks {
  google?: { reviewUrl?: string; mapsUrl?: string };
  facebook?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
  instagram?: { profileUrl?: string; verified?: boolean };
  tiktok?: { profileUrl?: string; verified?: boolean };
  twitter?: { profileUrl?: string; verified?: boolean };
  linkedin?: { profileUrl?: string; verified?: boolean };
  tripadvisor?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustpilot?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  yell?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  checkatrade?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  ratedpeople?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustatrader?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
}

// In-memory cache for verification results (expires after 24 hours)
const verificationCache: Map<string, { verified: boolean; timestamp: number }> = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Helper to verify if a URL is legitimate
async function verifyUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  const cached = verificationCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.verified;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);
    const verified = response.status >= 200 && response.status < 400;
    verificationCache.set(url, { verified, timestamp: Date.now() });
    return verified;
  } catch (error) {
    verificationCache.set(url, { verified: false, timestamp: Date.now() });
    console.log(`Failed to verify URL ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const businessName = request.nextUrl.searchParams.get('businessName');
    const address = request.nextUrl.searchParams.get('address');

    if (!businessName) {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    const links: SocialMediaLinks = {};
    const businessNameClean = businessName.replace(/\s+/g, '').toLowerCase();
    const businessNameHyphen = businessName.replace(/\s+/g, '-').toLowerCase();

    const facebookUrl = `https://www.facebook.com/${businessNameClean}`;
    const instagramUrl = `https://www.instagram.com/${businessNameClean}`;
    const twitterUrl = `https://twitter.com/${businessNameClean}`;
    const tiktokUrl = `https://www.tiktok.com/@${businessNameClean}`;
    const linkedinUrl = `https://www.linkedin.com/company/${businessNameHyphen}`;

    // Verify all URLs in parallel with timeout
    const verifyPromise = Promise.all([
      verifyUrl(facebookUrl),
      verifyUrl(instagramUrl),
      verifyUrl(twitterUrl),
      verifyUrl(tiktokUrl),
      verifyUrl(linkedinUrl),
    ]);

    const verificationTimeout = new Promise<boolean[]>((resolve) => {
      setTimeout(() => resolve([false, false, false, false, false]), 10000);
    });

    const [fbValid, igValid, twitterValid, tiktokValid, linkedinValid] = await Promise.race([
      verifyPromise,
      verificationTimeout,
    ]);

    links.facebook = { profileUrl: facebookUrl, reviewUrl: facebookUrl, verified: fbValid };
    links.instagram = { profileUrl: instagramUrl, verified: igValid };
    links.twitter = { profileUrl: twitterUrl, verified: twitterValid };
    links.tiktok = { profileUrl: tiktokUrl, verified: tiktokValid };
    links.linkedin = { profileUrl: linkedinUrl, verified: linkedinValid };

    const googleQuery = `${businessName} reviews${address ? ` ${address}` : ''}`.trim();
    const googleReviewUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
    const googleMapsSearch = `https://www.google.com/maps/search/${encodeURIComponent(businessName + (address ? ` ${address}` : ''))}`;
    links.google = {
      reviewUrl: googleReviewUrl,
      mapsUrl: googleMapsSearch,
    };

    // Review platforms (always available)
    links.tripadvisor = {
      profileUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      reviewUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      searchUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      verified: true,
    };
    links.trustpilot = {
      profileUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`,
      reviewUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`,
      searchUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`,
      verified: true,
    };
    links.yell = {
      profileUrl: `https://www.yell.com/search/uk?query=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      reviewUrl: `https://www.yell.com/search/uk?query=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      searchUrl: `https://www.yell.com/search/uk?query=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      verified: true,
    };
    links.checkatrade = {
      profileUrl: `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`,
      reviewUrl: `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`,
      searchUrl: `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`,
      verified: true,
    };
    links.ratedpeople = {
      profileUrl: `https://www.ratedpeople.com/search/${businessNameHyphen}`,
      reviewUrl: `https://www.ratedpeople.com/search/${businessNameHyphen}`,
      searchUrl: `https://www.ratedpeople.com/search/${businessNameHyphen}`,
      verified: true,
    };
    links.trustatrader = {
      profileUrl: `https://www.trustatrader.com/search?query=${encodeURIComponent(businessName)}`,
      reviewUrl: `https://www.trustatrader.com/search?query=${encodeURIComponent(businessName)}`,
      searchUrl: `https://www.trustatrader.com/search?query=${encodeURIComponent(businessName)}`,
      verified: true,
    };

    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search social media';
    console.error('Social media search error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
