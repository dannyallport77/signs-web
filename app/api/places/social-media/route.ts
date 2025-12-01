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
    const trustpilotSlug = businessNameHyphen.replace(/[^a-z0-9-]/g, '');

    // Social media platforms - basic profile URL construction (no verification to avoid delays)
    const facebookUrl = `https://www.facebook.com/${businessNameClean}`;
    const instagramUrl = `https://www.instagram.com/${businessNameClean}`;
    const twitterUrl = `https://twitter.com/${businessNameClean}`;
    const tiktokUrl = `https://www.tiktok.com/@${businessNameClean}`;
    const linkedinUrl = `https://www.linkedin.com/company/${businessNameHyphen}`;

    links.facebook = { profileUrl: facebookUrl, reviewUrl: facebookUrl, verified: false };
    links.instagram = { profileUrl: instagramUrl, verified: false };
    links.twitter = { profileUrl: twitterUrl, verified: false };
    links.tiktok = { profileUrl: tiktokUrl, verified: false };
    links.linkedin = { profileUrl: linkedinUrl, verified: false };

    const googleQuery = `${businessName} reviews${address ? ` ${address}` : ''}`.trim();
    const googleReviewUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
    const googleMapsSearch = `https://www.google.com/maps/search/${encodeURIComponent(businessName + (address ? ` ${address}` : ''))}`;
    links.google = {
      reviewUrl: googleReviewUrl,
      mapsUrl: googleMapsSearch,
    };

    // Review platforms - try direct URLs first, fallback to search
    // TripAdvisor
    const tripadvisorSearchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`;
    links.tripadvisor = {
      profileUrl: tripadvisorSearchUrl,
      reviewUrl: tripadvisorSearchUrl,
      searchUrl: tripadvisorSearchUrl,
      verified: false,
    };

    // Trustpilot - try direct URL first
    const trustpilotDirectUrl = `https://www.trustpilot.com/review/${trustpilotSlug}`;
    const trustpilotSearchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`;
    try {
      const tpCheck = await fetch(trustpilotDirectUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(3000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (tpCheck.status === 200) {
        links.trustpilot = {
          profileUrl: trustpilotDirectUrl,
          reviewUrl: trustpilotDirectUrl,
          searchUrl: trustpilotSearchUrl,
          verified: true,
        };
      } else {
        links.trustpilot = {
          profileUrl: trustpilotSearchUrl,
          reviewUrl: trustpilotSearchUrl,
          searchUrl: trustpilotSearchUrl,
          verified: false,
        };
      }
    } catch {
      links.trustpilot = {
        profileUrl: trustpilotSearchUrl,
        reviewUrl: trustpilotSearchUrl,
        searchUrl: trustpilotSearchUrl,
        verified: false,
      };
    }

    // Yell - try direct business page
    const yellDirectUrl = `https://www.yell.com/biz/${businessNameHyphen}/`;
    const yellSearchUrl = `https://www.yell.com/search?keywords=${encodeURIComponent(businessName)}`;
    links.yell = {
      profileUrl: yellDirectUrl,
      reviewUrl: yellDirectUrl,
      searchUrl: yellSearchUrl,
      verified: false,
    };

    // Checkatrade - try trades page
    const checkatradeDirectUrl = `https://www.checkatrade.com/trades/${businessNameHyphen}`;
    const checkatradeSearchUrl = `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`;
    links.checkatrade = {
      profileUrl: checkatradeDirectUrl,
      reviewUrl: checkatradeDirectUrl,
      searchUrl: checkatradeSearchUrl,
      verified: false,
    };

    // Rated People - try tradesman page
    const ratedpeopleDirectUrl = `https://www.ratedpeople.com/tradesman/${businessNameHyphen}`;
    links.ratedpeople = {
      profileUrl: ratedpeopleDirectUrl,
      reviewUrl: ratedpeopleDirectUrl,
      searchUrl: ratedpeopleDirectUrl,
      verified: false,
    };

    // TrustATrader - try trader page
    const trustatraderDirectUrl = `https://www.trustatrader.com/trader/${businessNameHyphen}`;
    const trustatraderSearchUrl = `https://www.trustatrader.com/search?keywords=${encodeURIComponent(businessName)}`;
    links.trustatrader = {
      profileUrl: trustatraderDirectUrl,
      reviewUrl: trustatraderDirectUrl,
      searchUrl: trustatraderSearchUrl,
      verified: false,
    };

    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search social media';
    console.error('Social media search error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
