import { NextRequest, NextResponse } from 'next/server';

interface SocialMediaLinks {
  google?: { reviewUrl?: string; mapsUrl?: string };
  facebook?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
  instagram?: { profileUrl?: string; verified?: boolean };
  tiktok?: { profileUrl?: string; verified?: boolean };
  twitter?: { profileUrl?: string; verified?: boolean };
  linkedin?: { profileUrl?: string; verified?: boolean };
  tripadvisor?: { reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustpilot?: { reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  yell?: { profileUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  checkatrade?: { profileUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  ratedpeople?: { profileUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustatrader?: { profileUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
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

    if (fbValid) links.facebook = { profileUrl: facebookUrl, verified: true };
    if (igValid) links.instagram = { profileUrl: instagramUrl, verified: true };
    if (twitterValid) links.twitter = { profileUrl: twitterUrl, verified: true };
    if (tiktokValid) links.tiktok = { profileUrl: tiktokUrl, verified: true };
    if (linkedinValid) links.linkedin = { profileUrl: linkedinUrl, verified: true };

    // Review platforms (always available)
    links.tripadvisor = {
      searchUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      verified: true,
    };
    links.trustpilot = {
      searchUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`,
      verified: true,
    };
    links.yell = {
      searchUrl: `https://www.yell.com/search/uk?query=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      verified: true,
    };
    links.checkatrade = {
      searchUrl: `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`,
      verified: true,
    };
    links.ratedpeople = {
      searchUrl: `https://www.ratedpeople.com/search/${businessNameHyphen}`,
      verified: true,
    };
    links.trustatrader = {
      searchUrl: `https://www.trustatrader.com/search?query=${encodeURIComponent(businessName)}`,
      verified: true,
    };

    return NextResponse.json({ success: true, data: links });
  } catch (error: any) {
    console.error('Social media search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search social media' }, { status: 500 });
  }
}
