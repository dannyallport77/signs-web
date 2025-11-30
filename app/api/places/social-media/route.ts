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

// Helper to verify if a URL is legitimate (checks for 404, redirects, etc)
async function verifyUrl(url: string, timeoutMs: number = 3000): Promise<boolean> {
  // Create a timeout promise that rejects after timeoutMs
  const timeoutPromise = new Promise<boolean>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );

  try {
    const controller = new AbortController();
    const fetchPromise = (async () => {
      try {
        // Try HEAD request first (faster, doesn't download body)
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ReviewSigns/1.0)',
          },
        });

        return response.status >= 200 && response.status < 400;
      } catch (headError) {
        // If HEAD fails or times out, consider unverified
        return false;
      }
    })();

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    // Network errors, timeouts, etc - consider unverified
    console.log(`Failed to verify URL ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Allow requests from mobile app and web - no auth required for public data
    const businessName = request.nextUrl.searchParams.get('businessName');
    const address = request.nextUrl.searchParams.get('address');
    const placeId = request.nextUrl.searchParams.get('placeId');
    const verify = request.nextUrl.searchParams.get('verify') === 'true';

    if (!businessName) {
      return NextResponse.json(
        { error: 'businessName is required' },
        { status: 400 }
      );
    }

    const links: SocialMediaLinks = {};

    // Generate suggested profiles
    const businessNameClean = businessName.replace(/\s+/g, '').toLowerCase();
    const businessNameHyphen = businessName.replace(/\s+/g, '-').toLowerCase();

    // Social media profiles
    const facebookUrl = `https://www.facebook.com/${businessNameClean}`;
    const instagramUrl = `https://www.instagram.com/${businessNameClean}`;
    const twitterUrl = `https://twitter.com/${businessNameClean}`;
    const tiktokUrl = `https://www.tiktok.com/@${businessNameClean}`;
    const linkedinUrl = `https://www.linkedin.com/company/${businessNameHyphen}`;

    // Always return all platforms - let mobile app verify in background if needed
    links.facebook = {
      profileUrl: facebookUrl,
      verified: false,
    };

    links.instagram = {
      profileUrl: instagramUrl,
      verified: false,
    };

    links.twitter = {
      profileUrl: twitterUrl,
      verified: false,
    };

    links.tiktok = {
      profileUrl: tiktokUrl,
      verified: false,
    };

    links.linkedin = {
      profileUrl: linkedinUrl,
      verified: false,
    };

    // Review platforms with search URLs (always available but unverified)
    links.tripadvisor = {
      searchUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      note: 'Search TripAdvisor for this business',
      verified: false,
    };

    links.trustpilot = {
      searchUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`,
      note: 'Search Trustpilot for this business',
      verified: false,
    };

    links.yell = {
      searchUrl: `https://www.yell.com/search/uk?query=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      note: 'Search Yell for this business',
      verified: false,
    };

    links.checkatrade = {
      searchUrl: `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`,
      note: 'Search Checkatrade for this business',
      verified: false,
    };

    links.ratedpeople = {
      searchUrl: `https://www.ratedpeople.com/search/${businessNameHyphen}`,
      note: 'Search Rated People for this business',
      verified: false,
    };

    links.trustatrader = {
      searchUrl: `https://www.trustatrader.com/search?query=${encodeURIComponent(businessName)}`,
      note: 'Search TrustATrader for this business',
      verified: false,
    };

    return NextResponse.json({
      success: true,
      data: links,
    });
  } catch (error: any) {
    console.error('Social media search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search social media' },
      { status: 500 }
    );
  }
}
