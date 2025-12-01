import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface SocialMediaLinks {
  google?: { reviewUrl?: string; mapsUrl?: string };
  facebook?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
  instagram?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
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

// Helper to verify URL exists and returns 200
async function verifyUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
}

// Try multiple URL patterns for a platform
async function tryMultipleUrls(urls: string[], timeoutMs: number = 2000): Promise<string | null> {
  for (const url of urls) {
    if (await verifyUrl(url, timeoutMs)) {
      return url;
    }
  }
  return null;
}

// Search Google via SerpAPI to find actual business page URLs
async function findUrlViaSerpAPI(businessName: string, platform: string, address?: string): Promise<string | null> {
  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    console.warn('SERPAPI_KEY not configured, skipping Google search');
    return null;
  }

  try {
    const searchQuery = `${businessName} ${platform}${address ? ` ${address}` : ''}`;
    const url = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${serpApiKey}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Extract URLs from organic results
    const organicResults = data.organic_results || [];
    
    // Platform domain patterns to match
    const platformDomains: Record<string, string[]> = {
      facebook: ['facebook.com/', 'fb.com/'],
      instagram: ['instagram.com/'],
      twitter: ['twitter.com/', 'x.com/'],
      tiktok: ['tiktok.com/@'],
      linkedin: ['linkedin.com/company/', 'linkedin.com/in/'],
      trustpilot: ['trustpilot.com/review/', 'uk.trustpilot.com/review/'],
      tripadvisor: ['tripadvisor.com/Restaurant_Review', 'tripadvisor.com/Hotel_Review', 'tripadvisor.com/Attraction_Review', 'tripadvisor.co.uk/Restaurant_Review', 'tripadvisor.co.uk/Hotel_Review'],
      yell: ['yell.com/biz/'],
      checkatrade: ['checkatrade.com/trades/'],
      ratedpeople: ['ratedpeople.com/tradesman/', 'ratedpeople.com/profile/'],
      trustatrader: ['trustatrader.com/trader/'],
    };
    
    const domains = platformDomains[platform.toLowerCase()];
    if (!domains) return null;
    
    // Find first matching URL
    for (const result of organicResults) {
      const link = result.link || '';
      for (const domain of domains) {
        if (link.includes(domain) && !link.includes('/search')) {
          // Clean URL (remove tracking params)
          return link.split('?')[0].split('#')[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding ${platform} via SerpAPI:`, error);
    return null;
  }
}

// Determine if a business is likely a tradesperson/contractor
function isTradeBusiness(businessName: string): boolean {
  const tradeKeywords = [
    'plumber', 'plumbing', 'electrician', 'electrical', 'builder', 'building', 'carpenter', 'carpentry',
    'painter', 'painting', 'decorator', 'roofer', 'roofing', 'heating', 'boiler', 'gas', 'hvac',
    'locksmith', 'glazier', 'plasterer', 'tiler', 'handyman', 'joiner', 'bricklayer', 'landscaper',
    'gardener', 'fencing', 'drainage', 'bathroom', 'kitchen', 'installer', 'contractor', 'construction',
    'maintenance', 'repair', 'remodeling', 'renovation', 'services'
  ];
  
  const nameLower = businessName.toLowerCase();
  return tradeKeywords.some(keyword => nameLower.includes(keyword));
}

// Determine if a business is hospitality/tourism related
function isHospitalityBusiness(businessName: string): boolean {
  const hospitalityKeywords = [
    'hotel', 'motel', 'inn', 'resort', 'lodge', 'accommodation', 'b&b', 'bed and breakfast',
    'restaurant', 'cafe', 'coffee', 'bar', 'pub', 'bistro', 'grill', 'diner', 'eatery',
    'pizza', 'burger', 'sushi', 'thai', 'chinese', 'indian', 'italian', 'mexican',
    'takeaway', 'fast food', 'bakery', 'patisserie', 'tea room', 'brasserie',
    'attraction', 'museum', 'gallery', 'tour', 'spa', 'salon'
  ];
  
  const nameLower = businessName.toLowerCase();
  return hospitalityKeywords.some(keyword => nameLower.includes(keyword));
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
    
    // Determine business type
    const isTrade = isTradeBusiness(businessName);
    const isHospitality = isHospitalityBusiness(businessName);

    // Social media platforms - try to find verified accounts via SerpAPI
    // Try basic URL patterns first, then search via Google
    const facebookGuessUrl = `https://www.facebook.com/${businessNameClean}`;
    const facebookUrl = await tryMultipleUrls([facebookGuessUrl], 3000) || 
                       await findUrlViaSerpAPI(businessName, 'facebook', address);
    links.facebook = { 
      profileUrl: facebookUrl || facebookGuessUrl, 
      reviewUrl: facebookUrl || facebookGuessUrl, 
      verified: !!facebookUrl 
    };

    const instagramGuessUrl = `https://www.instagram.com/${businessNameClean}`;
    const instagramUrl = await tryMultipleUrls([instagramGuessUrl], 3000) || 
                        await findUrlViaSerpAPI(businessName, 'instagram', address);
    links.instagram = { 
      profileUrl: instagramUrl || instagramGuessUrl, 
      reviewUrl: instagramUrl || instagramGuessUrl, 
      verified: !!instagramUrl 
    };

    const twitterGuessUrl = `https://twitter.com/${businessNameClean}`;
    const twitterUrl = await tryMultipleUrls([twitterGuessUrl], 3000) || 
                      await findUrlViaSerpAPI(businessName, 'twitter', address);
    links.twitter = { 
      profileUrl: twitterUrl || twitterGuessUrl, 
      reviewUrl: twitterUrl || twitterGuessUrl, 
      verified: !!twitterUrl 
    };

    const tiktokGuessUrl = `https://www.tiktok.com/@${businessNameClean}`;
    const tiktokUrl = await tryMultipleUrls([tiktokGuessUrl], 3000) || 
                     await findUrlViaSerpAPI(businessName, 'tiktok', address);
    links.tiktok = { 
      profileUrl: tiktokUrl || tiktokGuessUrl, 
      reviewUrl: tiktokUrl || tiktokGuessUrl, 
      verified: !!tiktokUrl 
    };

    const linkedinGuessUrl = `https://www.linkedin.com/company/${businessNameHyphen}`;
    const linkedinUrl = await tryMultipleUrls([linkedinGuessUrl], 3000) || 
                       await findUrlViaSerpAPI(businessName, 'linkedin', address);
    links.linkedin = { 
      profileUrl: linkedinUrl || linkedinGuessUrl, 
      reviewUrl: linkedinUrl || linkedinGuessUrl, 
      verified: !!linkedinUrl 
    };

    const googleQuery = `${businessName} reviews${address ? ` ${address}` : ''}`.trim();
    const googleReviewUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
    const googleMapsSearch = `https://www.google.com/maps/search/${encodeURIComponent(businessName + (address ? ` ${address}` : ''))}`;
    links.google = {
      reviewUrl: googleReviewUrl,
      mapsUrl: googleMapsSearch,
    };

    // Review platforms - try direct URL patterns with verification
    // Filter platforms based on business type to avoid irrelevant searches
    // Returns verified URLs when found, search URLs as fallback
    
    // Trustpilot - universal platform (all business types)
    const trustpilotSearchUrl = `https://www.trustpilot.com/search?query=${encodeURIComponent(businessName)}`;
    const trustpilotSlug = businessNameHyphen.replace(/[^a-z0-9-]/g, '');
    let trustpilotUrl = await tryMultipleUrls([
      `https://www.trustpilot.com/review/${trustpilotSlug}`,
      `https://uk.trustpilot.com/review/${trustpilotSlug}`,
      `https://www.trustpilot.com/review/${businessNameHyphen}`,
      `https://www.trustpilot.com/review/www.${businessNameHyphen}.com`,
      `https://www.trustpilot.com/review/${businessNameClean}`,
    ], 2000);
    
    // If no direct URL found, try Google search via SerpAPI
    if (!trustpilotUrl) {
      trustpilotUrl = await findUrlViaSerpAPI(businessName, 'trustpilot', address);
    }
    
    links.trustpilot = {
      profileUrl: trustpilotUrl || trustpilotSearchUrl,
      reviewUrl: trustpilotUrl || trustpilotSearchUrl,
      searchUrl: trustpilotSearchUrl,
      verified: !!trustpilotUrl,
    };

    // TripAdvisor - hospitality only (restaurants, hotels, attractions)
    if (isHospitality) {
      const tripadvisorSearchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}${address ? `+${encodeURIComponent(address)}` : ''}`;
      let tripadvisorUrl = await tryMultipleUrls([
        `https://www.tripadvisor.com/${businessNameHyphen}`,
        `https://www.tripadvisor.co.uk/${businessNameHyphen}`,
      ], 2000);
      
      if (!tripadvisorUrl) {
        tripadvisorUrl = await findUrlViaSerpAPI(businessName, 'tripadvisor', address);
      }
      
      links.tripadvisor = {
        profileUrl: tripadvisorUrl || tripadvisorSearchUrl,
        reviewUrl: tripadvisorUrl || tripadvisorSearchUrl,
        searchUrl: tripadvisorSearchUrl,
        verified: !!tripadvisorUrl,
      };
    }

    // Trade-specific platforms (only for trade businesses)
    if (isTrade) {
      // Yell - try direct business page, then SerpAPI
      const yellSearchUrl = `https://www.yell.com/search?keywords=${encodeURIComponent(businessName)}`;
      let yellUrl = await tryMultipleUrls([
        `https://www.yell.com/biz/${businessNameHyphen}/`,
        `https://www.yell.com/biz/${businessNameClean}/`,
      ], 2000);
      
      if (!yellUrl) {
        yellUrl = await findUrlViaSerpAPI(businessName, 'yell', address);
      }
      
      links.yell = {
        profileUrl: yellUrl || yellSearchUrl,
        reviewUrl: yellUrl || yellSearchUrl,
        searchUrl: yellSearchUrl,
        verified: !!yellUrl,
      };

      // Checkatrade - try direct trades page, then SerpAPI
      const checkatradeSearchUrl = `https://www.checkatrade.com/search?query=${encodeURIComponent(businessName)}`;
      let checkatradeUrl = await tryMultipleUrls([
        `https://www.checkatrade.com/trades/${businessNameHyphen}`,
        `https://www.checkatrade.com/trades/${businessNameClean}`,
      ], 2000);
      
      if (!checkatradeUrl) {
        checkatradeUrl = await findUrlViaSerpAPI(businessName, 'checkatrade', address);
      }
      
      links.checkatrade = {
        profileUrl: checkatradeUrl || checkatradeSearchUrl,
        reviewUrl: checkatradeUrl || checkatradeSearchUrl,
        searchUrl: checkatradeSearchUrl,
        verified: !!checkatradeUrl,
      };

      // Rated People - try direct tradesman page, then SerpAPI
      const ratedpeopleSearchUrl = `https://www.ratedpeople.com/search?keywords=${encodeURIComponent(businessName)}`;
      let ratedpeopleUrl = await tryMultipleUrls([
        `https://www.ratedpeople.com/tradesman/${businessNameHyphen}`,
        `https://www.ratedpeople.com/tradesman/${businessNameClean}`,
      ], 2000);
      
      if (!ratedpeopleUrl) {
        ratedpeopleUrl = await findUrlViaSerpAPI(businessName, 'ratedpeople', address);
      }
      
      links.ratedpeople = {
        profileUrl: ratedpeopleUrl || ratedpeopleSearchUrl,
        reviewUrl: ratedpeopleUrl || ratedpeopleSearchUrl,
        searchUrl: ratedpeopleSearchUrl,
        verified: !!ratedpeopleUrl,
      };

      // TrustATrader - try direct trader page, then SerpAPI
      const trustatraderSearchUrl = `https://www.trustatrader.com/search?keywords=${encodeURIComponent(businessName)}`;
      let trustatraderUrl = await tryMultipleUrls([
        `https://www.trustatrader.com/trader/${businessNameHyphen}`,
        `https://www.trustatrader.com/trader/${businessNameClean}`,
      ], 2000);
      
      if (!trustatraderUrl) {
        trustatraderUrl = await findUrlViaSerpAPI(businessName, 'trustatrader', address);
      }
      
      links.trustatrader = {
        profileUrl: trustatraderUrl || trustatraderSearchUrl,
        reviewUrl: trustatraderUrl || trustatraderSearchUrl,
        searchUrl: trustatraderSearchUrl,
        verified: !!trustatraderUrl,
      };
    }

    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search social media';
    console.error('Social media search error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
