import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';

interface SocialMediaLinks {
  google?: { reviewUrl?: string; mapsUrl?: string };
  facebook?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
  instagram?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
  tiktok?: { profileUrl?: string; verified?: boolean };
  twitter?: { profileUrl?: string; verified?: boolean };
  youtube?: { profileUrl?: string; verified?: boolean };
  linkedin?: { profileUrl?: string; verified?: boolean };
  tripadvisor?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustpilot?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  yell?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  checkatrade?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  ratedpeople?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustatrader?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
}

const CACHE_KEY_DELIMITER = '::';
const CACHE_VERSION = 'v2';

function buildCacheKey(businessName: string, address?: string | null, website?: string | null): string {
  const normalize = (value?: string | null) => {
    if (!value) return 'none';
    return value.trim().toLowerCase();
  };
  return [CACHE_VERSION, normalize(businessName), normalize(address), normalize(website)].join(CACHE_KEY_DELIMITER);
}

// Get caching setting from database
async function isCachingEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'socialMediaCachingEnabled' },
    });
    return setting?.value !== 'false';
  } catch (error) {
    console.error('Error checking caching setting:', error);
    return true; // Default to enabled
  }
}

// Get cached social media links
async function getCachedLinks(businessName: string, address?: string, website?: string): Promise<SocialMediaLinks | null> {
  try {
    const cacheKey = buildCacheKey(businessName, address, website);
    const cache = await prisma.socialMediaCache.findUnique({
      where: { id: cacheKey },
    });

    if (!cache) return null;

    // Check if expired
    if (new Date() > cache.expiresAt) {
      // Delete expired cache
      await prisma.socialMediaCache.delete({ where: { id: cache.id } });
      return null;
    }

    return JSON.parse(cache.data);
  } catch (error) {
    console.error('Error getting cached links:', error);
    return null;
  }
}

// Save social media links to cache
async function cacheLinks(businessName: string, address: string | undefined, website: string | undefined, data: SocialMediaLinks): Promise<void> {
  try {
    // Cache for 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const cacheKey = buildCacheKey(businessName, address, website);
    
    await prisma.socialMediaCache.upsert({
      where: { id: cacheKey },
      create: {
        id: cacheKey,
        businessName,
        address: address || null,
        website: website || null,
        data: JSON.stringify(data),
        expiresAt,
      },
      update: {
        data: JSON.stringify(data),
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error caching links:', error);
  }
}


// Scrape a website for social media links
async function scrapeWebsiteForSocialMedia(websiteUrl: string, timeoutMs: number = 5000): Promise<Partial<SocialMediaLinks>> {
  const links: Partial<SocialMediaLinks> = {};
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return links;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for social media links in href attributes
    const allLinks = new Set<string>();
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href) allLinks.add(href.toLowerCase());
    });

    // Find Facebook
    for (const link of allLinks) {
      if (link.includes('facebook.com/') || link.includes('fb.com/')) {
        try {
          const urlObj = new URL(link.startsWith('http') ? link : `https://${link}`);
          // Strip query params and hash to get clean profile URL
          const url = urlObj.origin + urlObj.pathname;
          const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
          
          links.facebook = { 
            profileUrl: url, 
            reviewUrl: `${cleanUrl}/reviews`,
            verified: true 
          };
          break;
        } catch (e) {
          // Fallback if URL parsing fails
          const url = link.startsWith('http') ? link : `https://${link}`;
          links.facebook = { profileUrl: url, verified: true };
        }
      }
    }

    // Find Instagram
    for (const link of allLinks) {
      if (link.includes('instagram.com/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.instagram = { profileUrl: url, verified: true };
        break;
      }
    }

    // Find Twitter
    for (const link of allLinks) {
      if (link.includes('twitter.com/') || link.includes('x.com/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.twitter = { profileUrl: url, verified: true };
        break;
      }
    }

    // Find YouTube
    for (const link of allLinks) {
      if (link.includes('youtube.com/') || link.includes('youtu.be/')) {
        // Filter out specific video links if possible, but for now accept channel/user/c/@ links
        if (link.includes('/channel/') || link.includes('/c/') || link.includes('/user/') || link.includes('/@')) {
          const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
          links.youtube = { profileUrl: url, verified: true };
          break;
        }
      }
    }

    // Find TikTok
    for (const link of allLinks) {
      if (link.includes('tiktok.com/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.tiktok = { profileUrl: url, verified: true };
        break;
      }
    }

    // Find LinkedIn - handle multiple URL formats and regional domains
    for (const link of allLinks) {
      if (link.includes('linkedin.com/')) {
        try {
          // Clean up LinkedIn URLs - remove query params and fragments
          let cleanedUrl = link.split('?')[0].split('#')[0];
          // Ensure it starts with https
          if (!cleanedUrl.startsWith('http')) {
            cleanedUrl = `https://${cleanedUrl}`;
          }
          // Normalize regional LinkedIn domains to standard linkedin.com
          cleanedUrl = cleanedUrl.replace(/https?:\/\/[a-z]{2}\.linkedin\.com\//i, 'https://www.linkedin.com/');
          cleanedUrl = cleanedUrl.replace(/https?:\/\/linkedin\.com\//i, 'https://www.linkedin.com/');
          // Remove trailing slashes after company/in identifier
          cleanedUrl = cleanedUrl.replace(/([/in|/company][/a-z0-9-]*)\/$/, '$1');
          
          const url = new URL(cleanedUrl).href;
          links.linkedin = { profileUrl: url, verified: true };
          break;
        } catch (error) {
          console.error('Error parsing LinkedIn URL:', error);
        }
      }
    }

    // Find Trustpilot
    for (const link of allLinks) {
      if (link.includes('trustpilot.com/review/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.trustpilot = { profileUrl: url, reviewUrl: url, verified: true };
        break;
      }
    }

    // Find Checkatrade
    for (const link of allLinks) {
      if (link.includes('checkatrade.com/trades/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.checkatrade = { profileUrl: url, reviewUrl: url, verified: true };
        break;
      }
    }

    // Find Rated People
    for (const link of allLinks) {
      if (link.includes('ratedpeople.com/tradesman/') || link.includes('ratedpeople.com/profile/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.ratedpeople = { profileUrl: url, reviewUrl: url, verified: true };
        break;
      }
    }

    // Find TrustATrader
    for (const link of allLinks) {
      if (link.includes('trustatrader.com/trader/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.trustatrader = { profileUrl: url, reviewUrl: url, verified: true };
        break;
      }
    }

    // Find Yell
    for (const link of allLinks) {
      if (link.includes('yell.com/biz/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.yell = { profileUrl: url, reviewUrl: url, verified: true };
        break;
      }
    }

    return links;
  } catch (error) {
    console.error(`Error scraping website for social media:`, error);
    return links;
  }
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

// Second-level verification: Check if the page content actually matches the business
async function verifyUrlMatchesBusiness(url: string, businessName: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) return false;
    
    const html = await response.text();
    const htmlLower = html.toLowerCase();
    
    // Clean business name - remove common suffixes and get core words
    const cleanName = businessName
      .toLowerCase()
      .replace(/\s+(ltd|limited|inc|llc|plc|restaurant|cafe|bar|pub|hotel|grill|house)\.?$/gi, '')
      .trim();
    
    // Split into words and filter short ones
    const nameWords = cleanName
      .split(/[\s,&-]+/)
      .filter(word => word.length >= 3)
      .filter(word => !['the', 'and', 'for'].includes(word));
    
    if (nameWords.length === 0) return false;
    
    // Check if at least 60% of significant words appear in the page
    const matchCount = nameWords.filter(word => htmlLower.includes(word)).length;
    const matchRatio = matchCount / nameWords.length;
    
    // Also check URL itself for business name words
    const urlLower = url.toLowerCase();
    const urlMatchCount = nameWords.filter(word => urlLower.includes(word)).length;
    const urlMatchRatio = urlMatchCount / nameWords.length;
    
    // Pass if either:
    // 1. 60%+ of words found in page content, OR
    // 2. 50%+ of words found in URL itself
    return matchRatio >= 0.6 || urlMatchRatio >= 0.5;
  } catch (error) {
    console.error('Error verifying URL matches business:', error);
    return false;
  }
}

// Combined verification: URL exists AND matches business
async function verifyUrlWithBusinessMatch(url: string, businessName: string, timeoutMs: number = 5000): Promise<boolean> {
  // First check if URL is accessible
  const exists = await verifyUrl(url, timeoutMs);
  if (!exists) return false;
  
  // Then verify content matches business
  return verifyUrlMatchesBusiness(url, businessName, timeoutMs);
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

// Use AI (OpenAI or Gemini) to find the correct platform URL
async function findUrlViaAI(businessName: string, platform: string, address?: string, website?: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!openaiKey && !geminiKey) {
    return null;
  }

  try {
    const prompt = `Find the exact ${platform} review page URL for this business:
Business Name: ${businessName}
${address ? `Address: ${address}` : ''}
${website ? `Website: ${website}` : ''}

Instructions:
- Search for their official ${platform} page
- Return ONLY the direct ${platform} review/profile URL
- For Trustpilot, it should be in format: https://www.trustpilot.com/review/domain-name
- If you cannot find a verified page, return "NOT_FOUND"
- Do not guess or make up URLs
- Verify the business actually has a ${platform} presence

Response format: Just the URL or "NOT_FOUND"`;

    let url: string | null = null;

    // Try OpenAI first (GPT-4)
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 200,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && content !== 'NOT_FOUND' && content.startsWith('http')) {
            url = content;
          }
        }
      } catch (error) {
        console.error('OpenAI search failed:', error);
      }
    }

    // Try Gemini if OpenAI failed or not available
    if (!url && geminiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 200,
            },
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (content && content !== 'NOT_FOUND' && content.startsWith('http')) {
            url = content;
          }
        }
      } catch (error) {
        console.error('Gemini search failed:', error);
      }
    }

    // Verify the URL actually works before returning it
    if (url && await verifyUrl(url, 5000)) {
      return url;
    }

    return null;
  } catch (error) {
    console.error(`Error finding ${platform} via AI:`, error);
    return null;
  }
}

// Clean business name for better search results
function cleanBusinessName(name: string): string {
  // Remove common separators and everything after them
  let clean = name.split(/[:|–-]/)[0].trim();
  
  // Remove common suffixes
  clean = clean.replace(/\s+(Ltd|Limited|Inc|LLC|Plc)\.?$/i, '');
  
  return clean;
}

// Search Google via SerpAPI to find actual business page URLs
async function findUrlViaSerpAPI(businessName: string, platform: string, address?: string): Promise<string | null> {
  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    console.warn('SERPAPI_KEY not configured, skipping Google search');
    return null;
  }

  const performSearch = async (query: string): Promise<string | null> => {
    try {
      const url = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      // Extract URLs from organic results
      const organicResults = data.organic_results || [];
      
      // Create tokens from address
      const locationTokens = (address || '')
        .split(/[,\s]+/)
        .map((token: string) => token.trim().toLowerCase())
        .filter((token: string) => token.length > 2);

      // Create tokens from business name
      const nameTokens = cleanBusinessName(businessName)
        .toLowerCase()
        .split(/[,\s]+/)
        .filter(token => token.length > 2);
      
      // Platform domain patterns to match
      const platformDomains: Record<string, string[]> = {
        facebook: ['facebook.com/', 'fb.com/'],
        instagram: ['instagram.com/'],
        twitter: ['twitter.com/', 'x.com/'],
        youtube: ['youtube.com/channel/', 'youtube.com/c/', 'youtube.com/user/', 'youtube.com/@'],
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
        const link = (result.link || '').toLowerCase();
        const title = (result.title || '').toLowerCase();
        const snippet = (result.snippet || '').toLowerCase();

        // Check if any address token matches
        const matchesLocation = locationTokens.length === 0 || locationTokens.some(token =>
          link.includes(token) || title.includes(token) || snippet.includes(token)
        );

        // Check if business name matches (more lenient)
        const matchesName = nameTokens.some(token => 
          title.includes(token) || link.includes(token) || snippet.includes(token)
        );

        // Accept if either location matches OR business name matches strongly
        if (!matchesLocation && !matchesName) {
          continue;
        }

        for (const domain of domains) {
          if (link.includes(domain) && !link.includes('/search')) {
            // Clean URL (remove tracking params)
            const cleanUrl = (result.link || '').split('?')[0].split('#')[0];
            return cleanUrl;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding ${platform} via SerpAPI:`, error);
      return null;
    }
  };

  // Strategy 1: Full search with address
  let result = await performSearch(`${businessName} ${platform} ${address || ''}`);
  if (result) return result;

  // Strategy 2: Clean business name + city (if available in address)
  const cleanName = cleanBusinessName(businessName);
  if (cleanName !== businessName) {
    // Extract city from address (simple heuristic: last part of address usually)
    // Or just use the clean name + platform
    let fallbackQuery = `${cleanName} ${platform}`;
    
    // Try to add city if possible
    if (address) {
      const parts = address.split(',');
      if (parts.length > 1) {
        // Try to find the city (usually 2nd to last or 3rd to last)
        // For "Bolton BL2 2SE", "Bolton" is good.
        const cityCandidate = parts.find(p => !p.match(/\d/) && p.trim().length > 3);
        if (cityCandidate) {
          fallbackQuery += ` ${cityCandidate.trim()}`;
        }
      }
    }

    result = await performSearch(fallbackQuery);
  }

  return result;
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
    const website = request.nextUrl.searchParams.get('website');
    const placeId = request.nextUrl.searchParams.get('placeId');
    const skipCache = request.nextUrl.searchParams.get('skipCache') === 'true';

    if (!businessName) {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    // Check cache if enabled
    const cachingEnabled = await isCachingEnabled();
    if (cachingEnabled && !skipCache) {
      const cached = await getCachedLinks(businessName, address ?? undefined, website ?? undefined);
      if (cached) {
        return NextResponse.json({ success: true, data: cached, cached: true });
      }
    }

    let links: SocialMediaLinks = {};
    
    // If website is provided, try to scrape it for actual social media links first
    if (website) {
      try {
        const scrapedLinks = await scrapeWebsiteForSocialMedia(website, 3000);
        links = scrapedLinks;
      } catch (error) {
        console.error('Error scraping website:', error);
      }
    }
    
    const businessNameClean = businessName.replace(/\s+/g, '').toLowerCase();
    const businessNameHyphen = businessName.replace(/\s+/g, '-').toLowerCase();
    
    // Determine business type
    const isTrade = isTradeBusiness(businessName);
    const isHospitality = isHospitalityBusiness(businessName);

    // Social media platforms - try to find verified accounts via SerpAPI
    // Try Google search first, then try AI as fallback, never guess without verification
    // Second-level verification: check page content matches business name
    
    if (!links.facebook) {
      let facebookUrl = (await findUrlViaSerpAPI(businessName, 'facebook', address ?? undefined)) ?? undefined;
      
      // If SerpAPI didn't find it, try AI search
      if (!facebookUrl) {
        facebookUrl = (await findUrlViaAI(businessName, 'facebook', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      // Second-level verification: check if page content matches business
      if (facebookUrl && await verifyUrlMatchesBusiness(facebookUrl, businessName, 5000)) {
        const cleanUrl = facebookUrl.endsWith('/') ? facebookUrl.slice(0, -1) : facebookUrl;
        links.facebook = { 
          profileUrl: facebookUrl, 
          reviewUrl: `${cleanUrl}/reviews`,
          verified: true 
        };
      }
    }

    // Instagram - search via SerpAPI, then AI, only show if verified
    if (!links.instagram) {
      let instagramUrl = (await findUrlViaSerpAPI(businessName, 'instagram', address ?? undefined)) ?? undefined;
      if (!instagramUrl) {
        instagramUrl = (await findUrlViaAI(businessName, 'instagram', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      // Second-level verification
      if (instagramUrl && await verifyUrlMatchesBusiness(instagramUrl, businessName, 5000)) {
        links.instagram = { 
          profileUrl: instagramUrl, 
          verified: true 
        };
      }
    }

    // Twitter/X - search via SerpAPI, then AI, only show if verified
    if (!links.twitter) {
      let twitterUrl = (await findUrlViaSerpAPI(businessName, 'twitter', address ?? undefined)) ?? undefined;
      if (!twitterUrl) {
        twitterUrl = (await findUrlViaAI(businessName, 'twitter', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      // Second-level verification
      if (twitterUrl && await verifyUrlMatchesBusiness(twitterUrl, businessName, 5000)) {
        links.twitter = { 
          profileUrl: twitterUrl, 
          verified: true 
        };
      }
    }

    // YouTube - search via SerpAPI, then AI, only show if verified
    if (!links.youtube) {
      let youtubeUrl = (await findUrlViaSerpAPI(businessName, 'youtube', address ?? undefined)) ?? undefined;
      if (!youtubeUrl) {
        youtubeUrl = (await findUrlViaAI(businessName, 'youtube', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      // Second-level verification
      if (youtubeUrl && await verifyUrlMatchesBusiness(youtubeUrl, businessName, 5000)) {
        links.youtube = { 
          profileUrl: youtubeUrl, 
          verified: true 
        };
      }
    }

    // TikTok - search via SerpAPI, then AI, only show if verified
    if (!links.tiktok) {
      let tiktokUrl = (await findUrlViaSerpAPI(businessName, 'tiktok', address ?? undefined)) ?? undefined;
      if (!tiktokUrl) {
        tiktokUrl = (await findUrlViaAI(businessName, 'tiktok', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      // Second-level verification
      if (tiktokUrl && await verifyUrlMatchesBusiness(tiktokUrl, businessName, 5000)) {
        links.tiktok = { 
          profileUrl: tiktokUrl, 
          verified: true 
        };
      }
    }

    // LinkedIn - search via SerpAPI, then AI, only show if verified
    if (!links.linkedin) {
      let linkedinUrl = (await findUrlViaSerpAPI(businessName, 'linkedin', address ?? undefined)) ?? undefined;
      if (!linkedinUrl) {
        linkedinUrl = (await findUrlViaAI(businessName, 'linkedin', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      // Second-level verification
      if (linkedinUrl && await verifyUrlMatchesBusiness(linkedinUrl, businessName, 5000)) {
        links.linkedin = { 
          profileUrl: linkedinUrl, 
          verified: true 
        };
      }
    }

    const googleQuery = `${businessName} reviews${address ? ` ${address}` : ''}`.trim();
    const googleReviewUrl = placeId 
      ? `https://search.google.com/local/writereview?placeid=${placeId}`
      : `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
      
    const googleMapsSearch = placeId
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : `https://www.google.com/maps/search/${encodeURIComponent(businessName + (address ? ` ${address}` : ''))}`;

    links.google = {
      reviewUrl: googleReviewUrl,
      mapsUrl: googleMapsSearch,
    };

    // Review platforms - try direct URL patterns with verification
    // Filter platforms based on business type to avoid irrelevant searches
    // Returns verified URLs when found, search URLs as fallback
    
    // Trustpilot - ONLY use verified URLs, never guess
    // Priority: 1) Scraped from website, 2) SerpAPI, 3) AI search
    let trustpilotUrl = links.trustpilot?.reviewUrl || links.trustpilot?.profileUrl;
    
    if (!trustpilotUrl) {
      // Try Google search via SerpAPI
      trustpilotUrl = (await findUrlViaSerpAPI(businessName, 'trustpilot', address ?? undefined)) ?? undefined;
    }
    
    if (!trustpilotUrl) {
      // Try AI-powered search as last resort
      trustpilotUrl = (await findUrlViaAI(businessName, 'trustpilot', address ?? undefined, website ?? undefined)) ?? undefined;
    }
    
    // Second-level verification for Trustpilot
    if (trustpilotUrl && await verifyUrlMatchesBusiness(trustpilotUrl, businessName, 5000)) {
      links.trustpilot = {
        profileUrl: trustpilotUrl,
        reviewUrl: trustpilotUrl,
        verified: true,
      };
    } else {
      delete links.trustpilot; // Remove if verification failed
    }

    // TripAdvisor - hospitality only (restaurants, hotels, attractions)
    // ONLY use verified URLs, never guess
    if (isHospitality) {
      let tripadvisorUrl = (await findUrlViaSerpAPI(businessName, 'tripadvisor', address ?? undefined)) ?? undefined;
      
      if (!tripadvisorUrl) {
        tripadvisorUrl = (await findUrlViaAI(businessName, 'tripadvisor', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      // Only include if verified AND page content matches business name
      if (tripadvisorUrl) {
        const isVerified = await verifyUrlMatchesBusiness(tripadvisorUrl, businessName);
        if (isVerified) {
          links.tripadvisor = {
            profileUrl: tripadvisorUrl,
            reviewUrl: tripadvisorUrl,
            verified: true,
          };
        } else {
          console.log(`TripAdvisor URL ${tripadvisorUrl} failed business name verification`);
        }
      }
    }

    // Trade-specific platforms (only for trade businesses)
    // ONLY use verified URLs, never guess
    if (isTrade) {
      // Yell - SerpAPI or AI search only
      if (!links.yell) {
        let yellUrl = (await findUrlViaSerpAPI(businessName, 'yell', address ?? undefined)) ?? undefined;
        
        if (!yellUrl) {
          yellUrl = (await findUrlViaAI(businessName, 'yell', address ?? undefined, website ?? undefined)) ?? undefined;
        }
        
        if (yellUrl) {
          const isVerified = await verifyUrlMatchesBusiness(yellUrl, businessName);
          if (isVerified) {
            links.yell = {
              profileUrl: yellUrl,
              reviewUrl: yellUrl,
              verified: true,
            };
          } else {
            console.log(`Yell URL ${yellUrl} failed business name verification`);
          }
        }
      }

      // Checkatrade - SerpAPI or AI search only
      if (!links.checkatrade) {
        let checkatradeUrl = (await findUrlViaSerpAPI(businessName, 'checkatrade', address ?? undefined)) ?? undefined;
        
        if (!checkatradeUrl) {
          checkatradeUrl = (await findUrlViaAI(businessName, 'checkatrade', address ?? undefined, website ?? undefined)) ?? undefined;
        }
        
        if (checkatradeUrl) {
          const isVerified = await verifyUrlMatchesBusiness(checkatradeUrl, businessName);
          if (isVerified) {
            links.checkatrade = {
              profileUrl: checkatradeUrl,
              reviewUrl: checkatradeUrl,
              verified: true,
            };
          } else {
            console.log(`Checkatrade URL ${checkatradeUrl} failed business name verification`);
          }
        }
      }

      // Rated People - SerpAPI or AI search only
      if (!links.ratedpeople) {
        let ratedpeopleUrl = (await findUrlViaSerpAPI(businessName, 'ratedpeople', address ?? undefined)) ?? undefined;
        
        if (!ratedpeopleUrl) {
          ratedpeopleUrl = (await findUrlViaAI(businessName, 'ratedpeople', address ?? undefined, website ?? undefined)) ?? undefined;
        }
        
        if (ratedpeopleUrl) {
          const isVerified = await verifyUrlMatchesBusiness(ratedpeopleUrl, businessName);
          if (isVerified) {
            links.ratedpeople = {
              profileUrl: ratedpeopleUrl,
              reviewUrl: ratedpeopleUrl,
              verified: true,
            };
          } else {
            console.log(`Rated People URL ${ratedpeopleUrl} failed business name verification`);
          }
        }
      }

      // TrustATrader - SerpAPI or AI search only
      if (!links.trustatrader) {
        let trustatraderUrl = (await findUrlViaSerpAPI(businessName, 'trustatrader', address ?? undefined)) ?? undefined;
        
        if (!trustatraderUrl) {
          trustatraderUrl = (await findUrlViaAI(businessName, 'trustatrader', address ?? undefined, website ?? undefined)) ?? undefined;
        }
        
        if (trustatraderUrl) {
          const isVerified = await verifyUrlMatchesBusiness(trustatraderUrl, businessName);
          if (isVerified) {
            links.trustatrader = {
              profileUrl: trustatraderUrl,
              reviewUrl: trustatraderUrl,
              verified: true,
            };
          } else {
            console.log(`TrustATrader URL ${trustatraderUrl} failed business name verification`);
          }
        }
      }
    }

    // Cache results before returning
    if (cachingEnabled) {
      await cacheLinks(businessName, address ?? undefined, website ?? undefined, links);
    }

    return NextResponse.json({ success: true, data: links, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search social media';
    console.error('Social media search error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
