import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';

interface SocialMediaLinks {
  google?: { reviewUrl?: string; mapsUrl?: string };
  facebook?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; verified?: boolean };
  instagram?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; verified?: boolean };
  tiktok?: { profileUrl?: string; searchUrl?: string; verified?: boolean };
  twitter?: { profileUrl?: string; searchUrl?: string; verified?: boolean };
  youtube?: { profileUrl?: string; searchUrl?: string; verified?: boolean };
  linkedin?: { profileUrl?: string; searchUrl?: string; verified?: boolean };
  tripadvisor?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustpilot?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  yelp?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  yell?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  checkatrade?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  ratedpeople?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustatrader?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
}

const CACHE_KEY_DELIMITER = '::';
const CACHE_VERSION = 'v3';

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

    // Find Yelp
    for (const link of allLinks) {
      if (link.includes('yelp.com/biz/') || link.includes('yelp.co.uk/biz/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        links.yelp = { profileUrl: url, reviewUrl: url, verified: true };
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

    // Helper to check if URL matches business name
    const checkUrlMatch = () => {
      const urlLower = url.toLowerCase();
      const urlMatchCount = nameWords.filter(word => urlLower.includes(word)).length;
      const urlMatchRatio = urlMatchCount / nameWords.length;
      return urlMatchRatio >= 0.4;
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    let htmlLower = '';
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        htmlLower = html.toLowerCase();
      } else {
        console.warn(`Verification fetch failed for ${url} (${response.status}), falling back to URL check`);
      }
    } catch (error) {
      console.warn(`Verification network error for ${url}, falling back to URL check`);
    } finally {
      clearTimeout(timeoutId);
    }
    
    // If we have HTML content, check it
    if (htmlLower) {
      // Check if at least 50% of significant words appear in the page
      const matchCount = nameWords.filter(word => htmlLower.includes(word)).length;
      const matchRatio = matchCount / nameWords.length;
      
      if (matchRatio >= 0.5) return true;
    }
    
    // Fallback: Check URL itself for business name words
    // This handles cases where scraping is blocked (403/429) or content is dynamic
    return checkUrlMatch();
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
    console.warn('No AI keys available (OPENAI_API_KEY or GEMINI_API_KEY)');
    return null;
  }

  try {
    // Improved prompt with more specific instructions
    const prompt = `You are a business research assistant. Find the exact ${platform} URL for this business.

Business: ${businessName}
${address ? `Location: ${address}` : ''}
${website ? `Website: ${website}` : ''}

Search strategy:
1. For ${platform}, find the official business review/profile page
2. Return the exact URL only
3. Common patterns:
   - Facebook: https://www.facebook.com/[business-name]
   - Instagram: https://www.instagram.com/[business-name]
   - TikTok: https://www.tiktok.com/@[business-name]
   - Twitter/X: https://twitter.com/[business-name]
   - YouTube: https://www.youtube.com/c/[business-name]
   - LinkedIn: https://www.linkedin.com/company/[business-name]
   - Trustpilot: https://www.trustpilot.com/review/[domain]
   - TripAdvisor: https://www.tripadvisor.com/[business-slug]
   - Yelp: https://www.yelp.com/biz/[business-slug]

Return ONLY:
- The direct URL if found (must start with http)
- Or "NOT_FOUND" if cannot verify the business has this platform

Do NOT guess or make up URLs.`;

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
            console.log(`✅ OpenAI found ${platform} for ${businessName}: ${url}`);
          }
        } else {
          console.warn(`OpenAI request failed: ${response.status}`);
        }
      } catch (error) {
        console.error('OpenAI search failed:', error);
      }
    }

    // Try Gemini if OpenAI failed or not available
    if (!url && geminiKey) {
      try {
        console.log(`🤖 Trying Gemini for ${platform} (${businessName})...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
              candidateCount: 1,
            },
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          console.log(`Gemini response for ${platform}: "${content}"`);
          if (content && content !== 'NOT_FOUND' && content.startsWith('http')) {
            url = content;
            console.log(`✅ Gemini found ${platform} for ${businessName}: ${url}`);
          } else if (content) {
            console.log(`⚠️ Gemini returned non-URL for ${platform}: ${content.substring(0, 100)}`);
          }
        } else {
          const errorText = await response.text();
          console.warn(`Gemini request failed: ${response.status} - ${errorText.substring(0, 200)}`);
        }
      } catch (error) {
        console.error('Gemini search failed:', error);
      }
    }

    // Verify the URL actually works before returning it
    if (url && await verifyUrl(url, 5000)) {
      console.log(`✅ Verified ${platform} URL works: ${url}`);
      return url;
    } else if (url) {
      console.warn(`⚠️ ${platform} URL found but failed verification: ${url}`);
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

// Platform domain patterns for matching URLs
const platformDomains: Record<string, string[]> = {
  facebook: ['facebook.com/', 'fb.com/'],
  instagram: ['instagram.com/'],
  twitter: ['twitter.com/', 'x.com/'],
  youtube: ['youtube.com/channel/', 'youtube.com/c/', 'youtube.com/user/', 'youtube.com/@'],
  tiktok: ['tiktok.com/@'],
  linkedin: ['linkedin.com/company/', 'linkedin.com/in/'],
  trustpilot: ['trustpilot.com/review/', 'uk.trustpilot.com/review/'],
  tripadvisor: ['tripadvisor.com/Restaurant_Review', 'tripadvisor.com/Hotel_Review', 'tripadvisor.com/Attraction_Review', 'tripadvisor.co.uk/Restaurant_Review', 'tripadvisor.co.uk/Hotel_Review'],
  yelp: ['yelp.com/biz/', 'yelp.co.uk/biz/'],
  yell: ['yell.com/biz/'],
  checkatrade: ['checkatrade.com/trades/'],
  ratedpeople: ['ratedpeople.com/tradesman/', 'ratedpeople.com/profile/'],
  trustatrader: ['trustatrader.com/trader/'],
};

// Search Google via Custom Search API to find actual business page URLs
async function findUrlViaGoogleSearch(businessName: string, platform: string, address?: string): Promise<string | null> {
  // Use GOOGLE_PLACES_API_KEY for Custom Search (same key)
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID; // Custom Search Engine ID
  
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not configured, skipping Google Custom Search');
    return null;
  }
  
  if (!searchEngineId) {
    console.warn('GOOGLE_SEARCH_ENGINE_ID not configured, skipping Google Custom Search');
    return null;
  }

  const performSearch = async (query: string): Promise<string | null> => {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Google Custom Search returned ${response.status} for ${platform}: ${errorText}`);
        return null;
      }
      
      const data = await response.json();
      
      // Check for errors
      if (data.error) {
        console.warn(`Google Custom Search error for ${platform}: ${data.error.message}`);
        return null;
      }
      
      // Extract URLs from search results
      const items = data.items || [];
      
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
      
      const domains = platformDomains[platform.toLowerCase()];
      if (!domains) return null;
      
      // Find first matching URL
      for (const result of items) {
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
            // Special handling for Facebook to avoid groups/posts
            if (platform.toLowerCase() === 'facebook') {
              if (link.includes('/groups/') || link.includes('/posts/') || link.includes('/photo.php') || link.includes('/permalink.php')) {
                console.log(`Skipping Facebook group/post URL: ${link}`);
                continue;
              }
            }

            // Clean URL (remove tracking params)
            const cleanUrl = (result.link || '').split('?')[0].split('#')[0];
            console.log(`Google Custom Search found ${platform}: ${cleanUrl}`);
            return cleanUrl;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding ${platform} via Google Custom Search:`, error);
      return null;
    }
  };

  // Strategy 0: Site-specific search (most accurate)
  const domains = platformDomains[platform.toLowerCase()];
  if (domains && domains.length > 0) {
    // Extract domain from the first pattern (e.g. "trustpilot.com/review/" -> "trustpilot.com")
    const domain = domains[0].split('/')[0];
    // Try with quoted business name first for exact match
    let siteQuery = `site:${domain} "${businessName}" ${address || ''}`;
    let result = await performSearch(siteQuery);
    if (result) return result;
  }

  // Strategy 1: Full search with address
  let result = await performSearch(`${businessName} ${platform} ${address || ''}`);
  if (result) return result;

  // Strategy 2: Clean business name + city (if available in address)
  const cleanName = cleanBusinessName(businessName);
  if (cleanName !== businessName) {
    let fallbackQuery = `${cleanName} ${platform}`;
    
    // Try to add city if possible
    if (address) {
      const parts = address.split(',');
      if (parts.length > 1) {
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

    // Social media platforms - try to find verified accounts via Google Custom Search
    // Try Google search first, then try AI as fallback, never guess without verification
    // Second-level verification: check page content matches business name
    
    const searchQuery = `${businessName} ${address || ''}`.trim();

    if (!links.facebook) {
      let facebookUrl = (await findUrlViaGoogleSearch(businessName, 'facebook', address ?? undefined)) ?? undefined;
      
      // If Google Search didn't find it, try AI search
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

    // Instagram - search via Google Custom Search, then AI, only show if verified
    if (!links.instagram) {
      let instagramUrl = (await findUrlViaGoogleSearch(businessName, 'instagram', address ?? undefined)) ?? undefined;
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

    // Twitter/X - search via Google Custom Search, then AI, only show if verified
    if (!links.twitter) {
      let twitterUrl = (await findUrlViaGoogleSearch(businessName, 'twitter', address ?? undefined)) ?? undefined;
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

    // YouTube - search via Google Custom Search, then AI, only show if verified
    if (!links.youtube) {
      let youtubeUrl = (await findUrlViaGoogleSearch(businessName, 'youtube', address ?? undefined)) ?? undefined;
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

    // TikTok - search via Google Custom Search, then AI, only show if verified
    if (!links.tiktok) {
      let tiktokUrl = (await findUrlViaGoogleSearch(businessName, 'tiktok', address ?? undefined)) ?? undefined;
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

    // LinkedIn - search via Google Custom Search, then AI, only show if verified
    if (!links.linkedin) {
      let linkedinUrl = (await findUrlViaGoogleSearch(businessName, 'linkedin', address ?? undefined)) ?? undefined;
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
    // Priority: 1) Scraped from website, 2) Google Custom Search, 3) AI search
    let trustpilotUrl = links.trustpilot?.reviewUrl || links.trustpilot?.profileUrl;
    
    if (!trustpilotUrl) {
      // Try Google search via Google Custom Search
      trustpilotUrl = (await findUrlViaGoogleSearch(businessName, 'trustpilot', address ?? undefined)) ?? undefined;
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

    // TripAdvisor - search for all businesses
    // ONLY use verified URLs, never guess
    if (!links.tripadvisor) {
      let tripadvisorUrl = (await findUrlViaGoogleSearch(businessName, 'tripadvisor', address ?? undefined)) ?? undefined;
      
      if (!tripadvisorUrl) {
        tripadvisorUrl = (await findUrlViaAI(businessName, 'tripadvisor', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      // Only include if verified AND page content matches business name
      if (tripadvisorUrl && await verifyUrlMatchesBusiness(tripadvisorUrl, businessName)) {
        links.tripadvisor = {
          profileUrl: tripadvisorUrl,
          reviewUrl: tripadvisorUrl,
          verified: true,
        };
      }
    }

    // Yelp - search for all businesses
    // ONLY use verified URLs, never guess
    if (!links.yelp) {
      let yelpUrl = (await findUrlViaGoogleSearch(businessName, 'yelp', address ?? undefined)) ?? undefined;
      
      if (!yelpUrl) {
        yelpUrl = (await findUrlViaAI(businessName, 'yelp', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      // Only include if verified AND page content matches business name
      if (yelpUrl && await verifyUrlMatchesBusiness(yelpUrl, businessName)) {
        links.yelp = {
          profileUrl: yelpUrl,
          reviewUrl: yelpUrl,
          verified: true,
        };
      }
    }

    // Yell - search for all businesses
    if (!links.yell) {
      let yellUrl = (await findUrlViaGoogleSearch(businessName, 'yell', address ?? undefined)) ?? undefined;
      
      if (!yellUrl) {
        yellUrl = (await findUrlViaAI(businessName, 'yell', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      if (yellUrl && await verifyUrlMatchesBusiness(yellUrl, businessName)) {
        links.yell = {
          profileUrl: yellUrl,
          reviewUrl: yellUrl,
          verified: true,
        };
      }
    }

    // Checkatrade - search for all businesses
    if (!links.checkatrade) {
      let checkatradeUrl = (await findUrlViaGoogleSearch(businessName, 'checkatrade', address ?? undefined)) ?? undefined;
      
      if (!checkatradeUrl) {
        checkatradeUrl = (await findUrlViaAI(businessName, 'checkatrade', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      if (checkatradeUrl && await verifyUrlMatchesBusiness(checkatradeUrl, businessName)) {
        links.checkatrade = {
          profileUrl: checkatradeUrl,
          reviewUrl: checkatradeUrl,
          verified: true,
        };
      }
    }

    // Rated People - search for all businesses
    if (!links.ratedpeople) {
      let ratedpeopleUrl = (await findUrlViaGoogleSearch(businessName, 'ratedpeople', address ?? undefined)) ?? undefined;
      
      if (!ratedpeopleUrl) {
        ratedpeopleUrl = (await findUrlViaAI(businessName, 'ratedpeople', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      if (ratedpeopleUrl && await verifyUrlMatchesBusiness(ratedpeopleUrl, businessName)) {
        links.ratedpeople = {
          profileUrl: ratedpeopleUrl,
          reviewUrl: ratedpeopleUrl,
          verified: true,
        };
      }
    }

    // TrustATrader - search for all businesses
    if (!links.trustatrader) {
      let trustatraderUrl = (await findUrlViaGoogleSearch(businessName, 'trustatrader', address ?? undefined)) ?? undefined;
      
      if (!trustatraderUrl) {
        trustatraderUrl = (await findUrlViaAI(businessName, 'trustatrader', address ?? undefined, website ?? undefined)) ?? undefined;
      }
      
      if (trustatraderUrl && await verifyUrlMatchesBusiness(trustatraderUrl, businessName)) {
        links.trustatrader = {
          profileUrl: trustatraderUrl,
          reviewUrl: trustatraderUrl,
          verified: true,
        };
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
