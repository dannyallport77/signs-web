import { NextRequest, NextResponse } from 'next/server';

interface SocialMediaLinks {
  google?: { reviewUrl?: string; mapsUrl?: string };
  facebook?: { profileUrl?: string; reviewUrl?: string };
  instagram?: { profileUrl?: string };
  tiktok?: { profileUrl?: string };
  twitter?: { profileUrl?: string };
  linkedin?: { profileUrl?: string };
  tripadvisor?: { reviewUrl?: string; searchUrl?: string; note?: string };
  trustpilot?: { reviewUrl?: string; searchUrl?: string; note?: string };
  yell?: { profileUrl?: string; searchUrl?: string; note?: string };
  checkatrade?: { profileUrl?: string; searchUrl?: string; note?: string };
  ratedpeople?: { profileUrl?: string; searchUrl?: string; note?: string };
  trustatrader?: { profileUrl?: string; searchUrl?: string; note?: string };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessName = request.nextUrl.searchParams.get('businessName');
    const address = request.nextUrl.searchParams.get('address');
    const placeId = request.nextUrl.searchParams.get('placeId');

    if (!businessName) {
      return NextResponse.json(
        { error: 'businessName is required' },
        { status: 400 }
      );
    }

    const links: SocialMediaLinks = {};

    // Search for various social media platforms
    // This uses web search patterns to find common social media profiles

    const searchPatterns = {
      facebook: [
        `facebook.com/${businessName.replace(/\s+/g, '')}`,
        `facebook.com/pages/${businessName.replace(/\s+/g, '')}`,
        `facebook.com/${businessName.replace(/\s+/g, '-')}`,
      ],
      instagram: [
        `instagram.com/${businessName.replace(/\s+/g, '')}`,
        `instagram.com/${businessName.replace(/\s+/g, '-')}`,
      ],
      twitter: [
        `twitter.com/${businessName.replace(/\s+/g, '')}`,
        `twitter.com/${businessName.replace(/\s+/g, '-')}`,
      ],
      tiktok: [
        `tiktok.com/@${businessName.replace(/\s+/g, '')}`,
        `tiktok.com/@${businessName.replace(/\s+/g, '-')}`,
      ],
      linkedin: [
        `linkedin.com/company/${businessName.replace(/\s+/g, '-')}`,
      ],
    };

    // Add search URLs for review platforms
    links.tripadvisor = {
      searchUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      note: 'Search TripAdvisor for this business',
    };

    links.trustpilot = {
      searchUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`,
      note: 'Search Trustpilot for this business',
    };

    links.yell = {
      searchUrl: `https://www.yell.com/search/uk?query=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`,
      note: 'Search Yell for this business',
    };

    links.checkatrade = {
      searchUrl: `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`,
      note: 'Search Checkatrade for this business',
    };

    links.ratedpeople = {
      searchUrl: `https://www.ratedpeople.com/search/${businessName.replace(/\s+/g, '-')}`,
      note: 'Search Rated People for this business',
    };

    links.trustatrader = {
      searchUrl: `https://www.trustatrader.com/search?query=${encodeURIComponent(businessName)}`,
      note: 'Search TrustATrader for this business',
    };

    // Try to find social media profiles (these are guesses based on name patterns)
    for (const [platform, patterns] of Object.entries(searchPatterns)) {
      if (platform === 'facebook') {
        links.facebook = {
          profileUrl: `https://www.facebook.com/${businessName.replace(/\s+/g, '')}`,
        };
      } else if (platform === 'instagram') {
        links.instagram = {
          profileUrl: `https://www.instagram.com/${businessName.replace(/\s+/g, '').toLowerCase()}`,
        };
      } else if (platform === 'twitter') {
        links.twitter = {
          profileUrl: `https://twitter.com/${businessName.replace(/\s+/g, '').toLowerCase()}`,
        };
      } else if (platform === 'tiktok') {
        links.tiktok = {
          profileUrl: `https://www.tiktok.com/@${businessName.replace(/\s+/g, '').toLowerCase()}`,
        };
      } else if (platform === 'linkedin') {
        links.linkedin = {
          profileUrl: `https://www.linkedin.com/company/${businessName.replace(/\s+/g, '-').toLowerCase()}`,
        };
      }
    }

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
