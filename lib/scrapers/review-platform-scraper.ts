/**
 * Review Platform & Social Media Scraper v2.0
 * Enhanced with parallel processing, retry logic, caching, and additional free APIs
 */

import * as cheerio from 'cheerio';

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformLink {
  url: string;
  verified?: boolean;
  foundVia?: 'website' | 'google_cse' | 'searchapi' | 'serpapi' | 'duckduckgo' | 'hunter' | 'bing';
  note?: string;
  confidence?: number; // 0-100 confidence score
}

export interface BusinessPlatforms {
  // Review platforms
  trustpilot?: PlatformLink;
  google?: PlatformLink;
  tripadvisor?: PlatformLink;
  yelp?: PlatformLink;
  checkatrade?: PlatformLink;
  ratedpeople?: PlatformLink;
  trustatrader?: PlatformLink;
  yell?: PlatformLink;
  feefo?: PlatformLink;
  reviews_io?: PlatformLink;
  
  // Social media
  facebook?: PlatformLink;
  instagram?: PlatformLink;
  twitter?: PlatformLink;
  linkedin?: PlatformLink;
  youtube?: PlatformLink;
  tiktok?: PlatformLink;
  pinterest?: PlatformLink;
  threads?: PlatformLink;
}

export interface ScraperOptions {
  website?: string;
  address?: string;
  searchApiKey?: string;
  serpApiKey?: string;
  googleCseId?: string;
  googleApiKey?: string;
  brightDataKey?: string;
  apifyKey?: string;
  scrapingBeeKey?: string;
  hunterApiKey?: string;
  bingApiKey?: string;
  enableCache?: boolean;
  cacheTtlMs?: number;
  maxRetries?: number;
  parallelRequests?: boolean;
  verifyUrls?: boolean;
}

export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTtl: number;

  constructor(defaultTtlMs: number = 30 * 60 * 1000) { // 30 minutes default
    this.defaultTtl = defaultTtlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtl),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const platformCache = new SimpleCache<BusinessPlatforms>(30 * 60 * 1000);
const urlVerificationCache = new SimpleCache<boolean>(60 * 60 * 1000); // 1 hour

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 1000
  ) {}

  async acquire(key: string): Promise<void> {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      // Wait until we can make another request
      const oldestTimestamp = validTimestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp);
      await this.delay(waitTime);
      return this.acquire(key);
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const rateLimiter = new RateLimiter(5, 1000); // 5 requests per second

// ============================================================================
// RETRY LOGIC
// ============================================================================

async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    service?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000, service = 'unknown' } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-retryable errors
      if (error instanceof ScraperError && !error.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      );
      
      console.log(`[${service}] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// ============================================================================
// HTTP UTILITIES
// ============================================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 8000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...fetchOptions.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// FREE APIS - NO KEY REQUIRED
// ============================================================================

/**
 * DuckDuckGo Instant Answer API - FREE, no API key, unlimited
 * Best for: Quick searches without rate limits
 */
export async function findViaDuckDuckGo(
  businessName: string,
  platform: string
): Promise<string | null> {
  try {
    await rateLimiter.acquire('duckduckgo');
    
    const query = `${businessName} ${platform}`;
    const response = await fetchWithTimeout(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
      { timeoutMs: 5000 }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Check AbstractURL or RelatedTopics for relevant links
    if (data.AbstractURL && data.AbstractURL.includes(platform.toLowerCase())) {
      return data.AbstractURL;
    }
    
    // Check related topics
    for (const topic of data.RelatedTopics || []) {
      if (topic.FirstURL && topic.FirstURL.toLowerCase().includes(platform.toLowerCase())) {
        return topic.FirstURL;
      }
    }
    
    return null;
  } catch (error) {
    console.error('DuckDuckGo error:', error);
    return null;
  }
}

/**
 * DuckDuckGo HTML Search - FREE, no API key
 * Scrapes actual search results (filters out ads)
 */
export async function searchViaDuckDuckGoHTML(
  businessName: string,
  siteDomain: string
): Promise<string | null> {
  try {
    await rateLimiter.acquire('duckduckgo_html');
    
    const query = `${businessName} site:${siteDomain}`;
    console.log(`[DDG] Searching: ${query}`);
    
    const response = await fetchWithTimeout(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      { timeoutMs: 8000 }
    );
    
    if (!response.ok) {
      console.log(`[DDG] Response not OK: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Debug: log first 500 chars of HTML to see what we're getting
    console.log(`[DDG] HTML preview: ${html.substring(0, 300)}...`);
    
    // Find organic results only (skip ads)
    // Ads have class 'result--ad' or links containing 'duckduckgo.com/y.js'
    let foundUrl: string | null = null;
    const resultCount = $('.result').length;
    const linkCount = $('.result__a').length;
    console.log(`[DDG] Found ${resultCount} .result elements, ${linkCount} .result__a links for ${siteDomain}`);
    
    $('.result').each((i, el) => {
      if (foundUrl) return; // Already found one
      
      // Skip ads
      if ($(el).hasClass('result--ad')) {
        console.log(`[DDG] Skipping ad result`);
        return;
      }
      
      const link = $(el).find('.result__a').attr('href');
      if (!link) return;
      
      console.log(`[DDG] Checking link: ${link.substring(0, 100)}...`);
      
      // Skip DuckDuckGo ad redirect URLs
      if (link.includes('duckduckgo.com/y.js') || link.includes('ad_provider')) {
        console.log(`[DDG] Skipping ad URL`);
        return;
      }
      
      // Extract actual URL from DuckDuckGo redirect
      const match = link.match(/uddg=([^&]+)/);
      if (match) {
        const decodedUrl = decodeURIComponent(match[1]);
        console.log(`[DDG] Decoded URL: ${decodedUrl}`);
        // Verify it's actually from the target domain
        if (decodedUrl.includes(siteDomain)) {
          foundUrl = decodedUrl;
          console.log(`[DDG] ✓ Found valid URL for ${siteDomain}: ${foundUrl}`);
        }
      } else if (link.includes(siteDomain)) {
        foundUrl = link.startsWith('http') ? link : `https://${link}`;
        console.log(`[DDG] ✓ Found direct URL for ${siteDomain}: ${foundUrl}`);
      }
    });
    
    if (!foundUrl) {
      console.log(`[DDG] ✗ No valid URL found for ${siteDomain}`);
    }
    
    return foundUrl;
  } catch (error) {
    console.error('DuckDuckGo HTML error:', error);
    return null;
  }
}

// ============================================================================
// FREE TIER APIS
// ============================================================================

/**
 * Google Custom Search Engine - 100 queries/day FREE
 */
export async function findViaGoogleCSE(
  businessName: string,
  cseId: string,
  apiKey: string,
  platforms?: string[],
  locationHint: string = 'UK' // Add location hint for better results
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};
  
  console.log(`[Google CSE] Starting search for: ${businessName} (${locationHint})`);
  
  // Extended platform list including UK trade platforms
  const platformsToSearch = platforms || [
    // Review platforms
    'trustpilot.com',
    'tripadvisor.com',
    'yelp.com',
    // UK Trade platforms
    'checkatrade.com',
    'yell.com',
    'trustatrader.com',
    'ratedpeople.com',
    'feefo.com',
    'reviews.io',
    // Social media
    'facebook.com',
    'instagram.com',
    'linkedin.com/company',
    'twitter.com',
    'tiktok.com',
  ];

  // Make requests in parallel for speed
  const searchPromises = platformsToSearch.map(async (domain) => {
    try {
      await rateLimiter.acquire('google_cse');
      
      // Add location hint for UK-based searches to improve accuracy
      const query = `"${businessName}" ${locationHint} site:${domain}`;
      console.log(`[Google CSE] Searching: ${query}`);
      
      const response = await withRetry(
        () => fetchWithTimeout(
          `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cseId}&key=${apiKey}&num=3`,
          { timeoutMs: 10000 }
        ),
        { maxRetries: 2, service: 'google_cse' }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new ScraperError('Rate limited', 'google_cse', 429, true);
        }
        console.log(`[Google CSE] Error response for ${domain}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const platformKey = getPlatformKey(domain);
      
      // Check up to 5 results to find a valid official URL
      const items = data.items || [];
      for (let i = 0; i < Math.min(items.length, 5); i++) {
        const result = items[i];
        if (!result?.link) continue;
        
        // Validate this is an official page, not a random post/video/discovery
        const validation = isValidOfficialUrl(result.link, platformKey, businessName);
        
        if (validation.valid) {
          console.log(`[Google CSE] ✓ Found ${platformKey}: ${result.link}`);
          return {
            key: platformKey,
            link: {
              url: result.link,
              foundVia: 'google_cse' as const,
              verified: false,
              confidence: calculateConfidence(businessName, result.title, result.snippet),
            },
          };
        } else {
          console.log(`[Google CSE] ✗ Skipping ${platformKey} result ${i+1}: ${validation.reason}`);
        }
      }
      
      console.log(`[Google CSE] ✗ No valid results for ${domain}`);
      return null;
    } catch (error) {
      console.error(`Google CSE error for ${domain}:`, error);
      return null;
    }
  });

  const searchResults = await Promise.all(searchPromises);
  
  for (const result of searchResults) {
    if (result) {
      (results as any)[result.key] = result.link;
    }
  }

  return results;
}

/**
 * SearchAPI - 100 queries/month FREE
 */
export async function findViaSearchAPI(
  businessName: string,
  apiKey: string,
  locationHint: string = 'UK'
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  const platforms = [
    // Review platforms
    { name: 'trustpilot', domain: 'trustpilot.com' },
    { name: 'tripadvisor', domain: 'tripadvisor.com' },
    { name: 'yelp', domain: 'yelp.com' },
    // UK Trade platforms
    { name: 'checkatrade', domain: 'checkatrade.com' },
    { name: 'yell', domain: 'yell.com' },
    { name: 'trustatrader', domain: 'trustatrader.com' },
    { name: 'ratedpeople', domain: 'ratedpeople.com' },
    { name: 'feefo', domain: 'feefo.com' },
    { name: 'reviews_io', domain: 'reviews.io' },
    // Social media
    { name: 'facebook', domain: 'facebook.com' },
    { name: 'instagram', domain: 'instagram.com' },
  ];

  const searchPromises = platforms.map(async (platform) => {
    try {
      await rateLimiter.acquire('searchapi');
      
      const query = `"${businessName}" ${locationHint} site:${platform.domain}`;
      const response = await withRetry(
        () => fetchWithTimeout(
          `https://www.searchapi.io/api/v1/search?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=3`,
          { timeoutMs: 10000 }
        ),
        { maxRetries: 2, service: 'searchapi' }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const organicResults = data.organic_results || [];
      
      // Check multiple results to find a valid official URL
      for (let i = 0; i < Math.min(organicResults.length, 5); i++) {
        const result = organicResults[i];
        if (!result?.link) continue;
        
        const validation = isValidOfficialUrl(result.link, platform.name, businessName);
        
        if (validation.valid) {
          return {
            key: platform.name,
            link: {
              url: result.link,
              foundVia: 'searchapi' as const,
              verified: false,
              confidence: calculateConfidence(businessName, result.title, result.snippet),
            },
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`SearchAPI error for ${platform.name}:`, error);
      return null;
    }
  });

  const searchResults = await Promise.all(searchPromises);
  
  for (const result of searchResults) {
    if (result) {
      (results as any)[result.key] = result.link;
    }
  }

  return results;
}

/**
 * SerpAPI - 100 queries/month FREE
 */
export async function findViaSerpAPI(
  businessName: string,
  apiKey: string,
  locationHint: string = 'UK'
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  const platforms = [
    // Review platforms
    { name: 'trustpilot', domain: 'trustpilot.com' },
    { name: 'google', domain: 'google.com/maps' },
    { name: 'tripadvisor', domain: 'tripadvisor.com' },
    { name: 'yelp', domain: 'yelp.com' },
    // UK Trade platforms
    { name: 'checkatrade', domain: 'checkatrade.com' },
    { name: 'yell', domain: 'yell.com' },
    { name: 'trustatrader', domain: 'trustatrader.com' },
    // Social media
    { name: 'linkedin', domain: 'linkedin.com/company' },
  ];

  const searchPromises = platforms.map(async (platform) => {
    try {
      await rateLimiter.acquire('serpapi');
      
      const query = `"${businessName}" ${locationHint} site:${platform.domain}`;
      const response = await withRetry(
        () => fetchWithTimeout(
          `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&engine=google&gl=uk&num=3`,
          { timeoutMs: 10000 }
        ),
        { maxRetries: 2, service: 'serpapi' }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const organicResults = data.organic_results || [];
      
      // Check multiple results to find a valid official URL
      for (let i = 0; i < Math.min(organicResults.length, 5); i++) {
        const result = organicResults[i];
        if (!result?.link) continue;
        
        const validation = isValidOfficialUrl(result.link, platform.name, businessName);
        
        if (validation.valid) {
          return {
            key: platform.name,
            link: {
              url: result.link,
              foundVia: 'serpapi' as const,
              verified: false,
              confidence: calculateConfidence(businessName, result.title, result.snippet),
            },
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`SerpAPI error for ${platform.name}:`, error);
      return null;
    }
  });

  const searchResults = await Promise.all(searchPromises);
  
  for (const result of searchResults) {
    if (result) {
      (results as any)[result.key] = result.link;
    }
  }

  return results;
}

/**
 * Bing Web Search API - 1000 queries/month FREE
 */
export async function findViaBingAPI(
  businessName: string,
  apiKey: string,
  locationHint: string = 'UK'
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  const platforms = [
    // Review platforms
    { name: 'trustpilot', domain: 'trustpilot.com' },
    // UK Trade platforms
    { name: 'checkatrade', domain: 'checkatrade.com' },
    { name: 'yell', domain: 'yell.com' },
    // Social media
    { name: 'facebook', domain: 'facebook.com' },
    { name: 'instagram', domain: 'instagram.com' },
    { name: 'linkedin', domain: 'linkedin.com' },
    { name: 'twitter', domain: 'twitter.com' },
  ];

  const searchPromises = platforms.map(async (platform) => {
    try {
      await rateLimiter.acquire('bing');
      
      const query = `"${businessName}" ${locationHint} site:${platform.domain}`;
      const response = await withRetry(
        () => fetchWithTimeout(
          `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=3&mkt=en-GB`,
          {
            timeoutMs: 10000,
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
            },
          }
        ),
        { maxRetries: 2, service: 'bing' }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const webResults = data.webPages?.value || [];
      
      // Check multiple results to find a valid official URL
      for (let i = 0; i < Math.min(webResults.length, 5); i++) {
        const result = webResults[i];
        if (!result?.url) continue;
        
        const validation = isValidOfficialUrl(result.url, platform.name, businessName);
        
        if (validation.valid) {
          return {
            key: platform.name,
            link: {
              url: result.url,
              foundVia: 'bing' as const,
              verified: false,
              confidence: calculateConfidence(businessName, result.name, result.snippet),
            },
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`Bing API error for ${platform.name}:`, error);
      return null;
    }
  });

  const searchResults = await Promise.all(searchPromises);
  
  for (const result of searchResults) {
    if (result) {
      (results as any)[result.key] = result.link;
    }
  }

  return results;
}

/**
 * Hunter.io - 25 searches/month FREE
 * Find social media from domain
 */
export async function findViaHunter(
  domain: string,
  apiKey: string
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  try {
    await rateLimiter.acquire('hunter');
    
    const response = await withRetry(
      () => fetchWithTimeout(
        `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`,
        { timeoutMs: 10000 }
      ),
      { maxRetries: 2, service: 'hunter' }
    );

    if (!response.ok) return results;

    const data = await response.json();
    const domainData = data.data;

    // Hunter returns social media links for the domain
    if (domainData?.facebook) {
      results.facebook = {
        url: domainData.facebook,
        foundVia: 'hunter',
        verified: false,
        confidence: 90,
      };
    }
    if (domainData?.twitter) {
      results.twitter = {
        url: domainData.twitter,
        foundVia: 'hunter',
        verified: false,
        confidence: 90,
      };
    }
    if (domainData?.linkedin) {
      results.linkedin = {
        url: domainData.linkedin,
        foundVia: 'hunter',
        verified: false,
        confidence: 90,
      };
    }
    if (domainData?.instagram) {
      results.instagram = {
        url: domainData.instagram,
        foundVia: 'hunter',
        verified: false,
        confidence: 90,
      };
    }
  } catch (error) {
    console.error('Hunter.io error:', error);
  }

  return results;
}

/**
 * ScrapingBee - 1000 requests/month FREE (FIXED)
 */
export async function scrapeWithScrapingBee(
  url: string,
  apiKey: string,
  renderJs: boolean = false
): Promise<string | null> {
  try {
    await rateLimiter.acquire('scrapingbee');
    
    // FIXED: Use URL params instead of body with GET
    const params = new URLSearchParams({
      api_key: apiKey,
      url: url,
      render_js: renderJs ? 'true' : 'false',
      premium_proxy: 'false',
    });
    
    const response = await withRetry(
      () => fetchWithTimeout(
        `https://app.scrapingbee.com/api/v1/?${params.toString()}`,
        { timeoutMs: 30000 }
      ),
      { maxRetries: 2, service: 'scrapingbee' }
    );

    if (!response.ok) return null;

    return await response.text();
  } catch (error) {
    console.error('ScrapingBee error:', error);
    return null;
  }
}

/**
 * Bright Data - 500MB/month FREE
 */
export async function scrapeWithBrightData(
  url: string,
  apiKey: string
): Promise<string | null> {
  try {
    await rateLimiter.acquire('brightdata');
    
    const response = await withRetry(
      () => fetchWithTimeout(
        'https://api.brightdata.com/request',
        {
          method: 'POST',
          timeoutMs: 30000,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            format: 'raw',
            method: 'GET',
          }),
        }
      ),
      { maxRetries: 2, service: 'brightdata' }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.body || data.html || null;
  } catch (error) {
    console.error('Bright Data error:', error);
    return null;
  }
}

// ============================================================================
// WEBSITE EXTRACTION
// ============================================================================

/**
 * Extract social/review links from a website - FREE, instant
 */
export async function extractLinksFromWebsite(
  websiteUrl: string
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  try {
    const response = await fetchWithTimeout(websiteUrl, { timeoutMs: 10000 });

    if (!response.ok) return results;

    const html = await response.text();
    const $ = cheerio.load(html);

    const allLinks = new Set<string>();
    
    // Get all links from href attributes
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) allLinks.add(href);
    });
    
    // Also check for links in data attributes (some sites hide social links)
    $('[data-href], [data-url], [data-link]').each((_, el) => {
      const dataHref = $(el).attr('data-href') || $(el).attr('data-url') || $(el).attr('data-link');
      if (dataHref) allLinks.add(dataHref);
    });

    // Platform patterns with multiple variations
    const platformPatterns: Record<string, RegExp[]> = {
      trustpilot: [/trustpilot\.com\/review\//i, /trustpilot\.[a-z]+\/review\//i],
      google: [/google\.com\/maps\/place/i, /maps\.google\.com/i, /g\.page\//i, /business\.google\.com/i],
      tripadvisor: [/tripadvisor\.(com|co\.uk|co\.nz|com\.au)\/[A-Za-z]+/i],
      yelp: [/yelp\.(com|co\.uk|ie)\/biz\//i],
      checkatrade: [/checkatrade\.com\/trades\//i],
      ratedpeople: [/ratedpeople\.com\/(tradesman|profile)\//i],
      trustatrader: [/trustatrader\.com\/traders?\//i],
      yell: [/yell\.com\/biz\//i],
      feefo: [/feefo\.com\/[a-z-]+\/[a-z0-9-]+/i],
      reviews_io: [/reviews\.io\/company-reviews\//i],
      facebook: [/facebook\.com\/(?!sharer|share|dialog)[a-zA-Z0-9.]+/i, /fb\.com\/[a-zA-Z0-9.]+/i],
      instagram: [/instagram\.com\/[a-zA-Z0-9_.]+/i],
      twitter: [/twitter\.com\/[a-zA-Z0-9_]+/i, /x\.com\/[a-zA-Z0-9_]+/i],
      linkedin: [/linkedin\.com\/(company|in)\/[a-zA-Z0-9-]+/i],
      youtube: [/youtube\.com\/(channel|c|user|@)[a-zA-Z0-9_-]+/i, /youtu\.be\/[a-zA-Z0-9_-]+/i],
      tiktok: [/tiktok\.com\/@[a-zA-Z0-9_.]+/i],
      pinterest: [/pinterest\.(com|co\.uk)\/[a-zA-Z0-9_]+/i],
      threads: [/threads\.net\/@?[a-zA-Z0-9_.]+/i],
    };

    for (const link of allLinks) {
      for (const [platform, patterns] of Object.entries(platformPatterns)) {
        if (patterns.some(pattern => pattern.test(link))) {
          try {
            const url = new URL(link.startsWith('http') ? link : `https://${link}`);
            // Clean up the URL
            const cleanUrl = `${url.origin}${url.pathname}`.replace(/\/$/, '');
            
            // Don't override if we already found one with higher confidence
            if (!(results as any)[platform]) {
              (results as any)[platform] = {
                url: cleanUrl,
                foundVia: 'website' as const,
                verified: false,
                confidence: 95, // High confidence when found on business's own website
              };
            }
          } catch {
            // Invalid URL, skip
          }
        }
      }
    }
    
    // Also look for JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonLd = JSON.parse($(el).html() || '{}');
        const sameAs = jsonLd.sameAs || jsonLd['@graph']?.[0]?.sameAs || [];
        
        for (const socialUrl of (Array.isArray(sameAs) ? sameAs : [sameAs])) {
          if (typeof socialUrl === 'string') {
            for (const [platform, patterns] of Object.entries(platformPatterns)) {
              if (patterns.some(pattern => pattern.test(socialUrl))) {
                if (!(results as any)[platform]) {
                  (results as any)[platform] = {
                    url: socialUrl,
                    foundVia: 'website' as const,
                    verified: false,
                    confidence: 98, // Very high - from structured data
                  };
                }
              }
            }
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    });
  } catch (error) {
    console.error('Website extraction error:', error);
  }

  return results;
}

// ============================================================================
// URL VERIFICATION
// ============================================================================

/**
 * Verify URL is accessible and returns valid response
 */
export async function verifyUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  // Check cache first
  const cached = urlVerificationCache.get(url);
  if (cached !== null) return cached;

  try {
    // Reject obviously invalid URLs (ad redirects, tracking URLs)
    if (
      url.includes('duckduckgo.com/y.js') ||
      url.includes('ad_provider') ||
      url.includes('ad_domain') ||
      url.includes('/aclick?') ||
      url.includes('click_metadata')
    ) {
      urlVerificationCache.set(url, false);
      return false;
    }

    const response = await fetchWithTimeout(url, {
      method: 'HEAD',
      timeoutMs,
    });

    const isValid = response.status >= 200 && response.status < 400;
    urlVerificationCache.set(url, isValid);
    return isValid;
  } catch {
    urlVerificationCache.set(url, false);
    return false;
  }
}

/**
 * Verify URL and check if content matches business name
 */
export async function verifyUrlMatchesBusiness(
  url: string,
  businessName: string,
  timeoutMs: number = 8000
): Promise<{ valid: boolean; confidence: number }> {
  try {
    const response = await fetchWithTimeout(url, { timeoutMs });
    
    if (!response.ok) {
      return { valid: false, confidence: 0 };
    }

    const html = await response.text();
    const htmlLower = html.toLowerCase();
    
    // Clean business name for matching
    const cleanName = businessName
      .toLowerCase()
      .replace(/\b(ltd|limited|inc|llc|plc|co|company)\b/gi, '')
      .trim();
    
    const nameWords = cleanName
      .split(/[\s,&-]+/)
      .filter(word => word.length >= 3)
      .filter(word => !['the', 'and', 'for', 'of'].includes(word));

    if (nameWords.length === 0) {
      return { valid: true, confidence: 50 };
    }

    const matchCount = nameWords.filter(word => htmlLower.includes(word)).length;
    const matchRatio = matchCount / nameWords.length;

    return {
      valid: matchRatio >= 0.4,
      confidence: Math.round(matchRatio * 100),
    };
  } catch {
    return { valid: false, confidence: 0 };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPlatformKey(domain: string): keyof BusinessPlatforms {
  const domainMap: Record<string, keyof BusinessPlatforms> = {
    'trustpilot.com': 'trustpilot',
    'google.com/maps': 'google',
    'google.com/business': 'google',
    'tripadvisor.com': 'tripadvisor',
    'yelp.com': 'yelp',
    'checkatrade.com': 'checkatrade',
    'ratedpeople.com': 'ratedpeople',
    'trustatrader.com': 'trustatrader',
    'yell.com': 'yell',
    'feefo.com': 'feefo',
    'reviews.io': 'reviews_io',
    'facebook.com': 'facebook',
    'instagram.com': 'instagram',
    'twitter.com': 'twitter',
    'x.com': 'twitter',
    'linkedin.com': 'linkedin',
    'linkedin.com/company': 'linkedin',
    'youtube.com': 'youtube',
    'tiktok.com': 'tiktok',
    'pinterest.com': 'pinterest',
    'threads.net': 'threads',
  };

  for (const [key, value] of Object.entries(domainMap)) {
    if (domain.includes(key)) return value;
  }
  
  return domain.split('.')[0] as keyof BusinessPlatforms;
}

/**
 * Validate that a URL is an official/main profile, not a discovery page, video, or random content
 * Returns: { valid: boolean, reason?: string }
 */
function isValidOfficialUrl(url: string, platform: string, businessName: string): { valid: boolean; reason?: string } {
  const urlLower = url.toLowerCase();
  const businessLower = businessName.toLowerCase()
    .replace(/['']/g, '')
    .replace(/\b(uk|us|usa|ltd|limited|plc|inc|llc|co|company|the)\b/gi, '')
    .trim();
  
  // Extract key business words (at least 3 chars, not common words)
  const businessWords = businessLower
    .split(/[\s,&\-_]+/)
    .filter(w => w.length >= 3)
    .filter(w => !['and', 'the', 'for', 'with'].includes(w));

  // Platform-specific validation rules
  switch (platform) {
    case 'tiktok':
      // TikTok: Must be @username format, not /discover/, /video/, /tag/, /search/
      if (urlLower.includes('/discover/') || 
          urlLower.includes('/tag/') ||
          urlLower.includes('/search/') ||
          urlLower.includes('/video/') ||
          urlLower.includes('/music/')) {
        return { valid: false, reason: 'TikTok discovery/video/tag page, not official profile' };
      }
      // Must have @username pattern
      if (!urlLower.match(/tiktok\.com\/@[a-z0-9_.]+$/i)) {
        return { valid: false, reason: 'TikTok URL missing @username format' };
      }
      // Check if username relates to business
      {
        const ttMatch = urlLower.match(/tiktok\.com\/@([a-z0-9_.]+)/i);
        if (ttMatch) {
          const username = ttMatch[1].toLowerCase();
          const hasBusinessWord = businessWords.some(w => username.includes(w));
          if (!hasBusinessWord && businessWords.length > 0) {
            return { valid: false, reason: `TikTok username '@${username}' doesn't match business name` };
          }
        }
      }
      break;

    case 'instagram':
      // Instagram: Must be /username format, not /p/, /reel/, /stories/, /explore/
      if (urlLower.includes('/p/') || 
          urlLower.includes('/reel/') ||
          urlLower.includes('/reels/') ||
          urlLower.includes('/stories/') ||
          urlLower.includes('/explore/') ||
          urlLower.includes('/tv/')) {
        return { valid: false, reason: 'Instagram post/reel/story, not official profile' };
      }
      // Check if username relates to business
      const igMatch = urlLower.match(/instagram\.com\/([a-z0-9_.]+)/i);
      if (igMatch) {
        const username = igMatch[1].toLowerCase();
        const hasBusinessWord = businessWords.some(w => username.includes(w));
        if (!hasBusinessWord && businessWords.length > 0) {
          return { valid: false, reason: `Instagram username '${username}' doesn't match business name` };
        }
      }
      break;

    case 'facebook':
      // Facebook: Avoid /posts/, /photos/, /videos/, /groups/...posts, /events/
      if (urlLower.includes('/posts/') ||
          urlLower.includes('/photos/') ||
          urlLower.includes('/videos/') ||
          urlLower.includes('/events/') ||
          urlLower.match(/\/groups\/.*\/posts/)) {
        return { valid: false, reason: 'Facebook post/photo/video/event, not official page' };
      }
      break;

    case 'twitter':
      // Twitter/X: Avoid /status/, /i/, /search/
      if (urlLower.includes('/status/') ||
          urlLower.includes('/i/') ||
          urlLower.includes('/search/')) {
        return { valid: false, reason: 'Twitter post/status, not official profile' };
      }
      break;

    case 'linkedin':
      // LinkedIn: Must be /company/ or /in/, not /posts/, /pulse/, /feed/
      if (urlLower.includes('/posts/') ||
          urlLower.includes('/pulse/') ||
          urlLower.includes('/feed/')) {
        return { valid: false, reason: 'LinkedIn post/article, not company page' };
      }
      // Prefer /company/ over personal profiles for businesses
      if (!urlLower.includes('/company/') && urlLower.includes('/in/')) {
        return { valid: false, reason: 'LinkedIn personal profile, not company page' };
      }
      break;

    case 'youtube':
      // YouTube: Must be /channel/, /c/, /user/, or /@, not /watch/, /shorts/
      if (urlLower.includes('/watch') ||
          urlLower.includes('/shorts/') ||
          urlLower.includes('/playlist')) {
        return { valid: false, reason: 'YouTube video/short/playlist, not channel' };
      }
      break;

    case 'trustpilot':
      // Trustpilot: Must be /review/ format
      if (!urlLower.includes('/review/')) {
        return { valid: false, reason: 'Trustpilot URL not a review page' };
      }
      // Filter out pagination URLs (?page=2, ?page=3, etc.)
      if (urlLower.includes('?page=') || urlLower.includes('&page=')) {
        return { valid: false, reason: 'Trustpilot pagination URL, not main review page' };
      }
      // Check domain in URL matches business somewhat
      const tpMatch = urlLower.match(/trustpilot\.com\/review\/(www\.)?([a-z0-9.-]+)/i);
      if (tpMatch) {
        const reviewDomain = tpMatch[2].replace(/\.(com|co\.uk|net|org).*$/, '');
        const hasMatch = businessWords.some(w => reviewDomain.includes(w)) ||
                        reviewDomain.split(/[.-]/).some(part => businessWords.includes(part));
        if (!hasMatch && businessWords.length > 0) {
          return { valid: false, reason: `Trustpilot domain '${tpMatch[2]}' doesn't match business` };
        }
      }
      break;

    case 'tripadvisor':
      // TripAdvisor: Should be Restaurant_Review or Hotel_Review or Attraction, not search
      if (urlLower.includes('/search') ||
          urlLower.includes('/tourism') ||
          urlLower.includes('/restaurants-') && !urlLower.includes('restaurant_review')) {
        return { valid: false, reason: 'TripAdvisor search/list page, not specific review' };
      }
      break;

    case 'yelp':
      // Yelp: Must be /biz/ format
      if (!urlLower.includes('/biz/')) {
        return { valid: false, reason: 'Yelp URL not a business page' };
      }
      // Yelp search pages
      if (urlLower.includes('/search?') || urlLower.includes('find_desc=')) {
        return { valid: false, reason: 'Yelp search page, not business page' };
      }
      break;

    case 'checkatrade':
      // Checkatrade: Must be /trades/ format
      if (!urlLower.includes('/trades/')) {
        return { valid: false, reason: 'Checkatrade URL not a trades page' };
      }
      // Filter search/category pages
      if (urlLower.includes('/search') || urlLower.includes('/category/')) {
        return { valid: false, reason: 'Checkatrade search/category page, not business page' };
      }
      // Check trader name in URL contains MOST business name words (stricter matching)
      {
        const traderSlug = urlLower.match(/\/trades\/([a-z0-9-]+)/i)?.[1] || '';
        const matchingWords = businessWords.filter(w => traderSlug.includes(w));
        // Require at least 2 matching words, or all words if only 1-2 words in business name
        const requiredMatches = Math.max(1, Math.min(2, businessWords.length));
        if (matchingWords.length < requiredMatches && businessWords.length > 0) {
          return { valid: false, reason: `Checkatrade trader '${traderSlug}' doesn't match business name (${matchingWords.length}/${requiredMatches} words)` };
        }
      }
      break;

    case 'yell':
      // Yell: Must be /biz/ format
      if (!urlLower.includes('/biz/')) {
        return { valid: false, reason: 'Yell URL not a business page' };
      }
      // Filter search pages
      if (urlLower.includes('/search') || urlLower.includes('/s/')) {
        return { valid: false, reason: 'Yell search page, not business page' };
      }
      // Check business name in URL (stricter matching)
      {
        const bizSlug = urlLower.match(/\/biz\/([a-z0-9-]+)/i)?.[1] || '';
        const matchingWords = businessWords.filter(w => bizSlug.includes(w));
        const requiredMatches = Math.max(1, Math.min(2, businessWords.length));
        if (matchingWords.length < requiredMatches && businessWords.length > 0) {
          return { valid: false, reason: `Yell business '${bizSlug}' doesn't match business name (${matchingWords.length}/${requiredMatches} words)` };
        }
      }
      break;

    case 'trustatrader':
      // TrustATrader: Must be /traders/ format
      if (!urlLower.includes('/traders/') && !urlLower.includes('/trader/')) {
        return { valid: false, reason: 'TrustATrader URL not a trader page' };
      }
      // Check trader name in URL contains MOST business name words (stricter matching)
      {
        const traderSlug = urlLower.match(/\/traders?\/([a-z0-9-]+)/i)?.[1] || '';
        const matchingWords = businessWords.filter(w => traderSlug.includes(w));
        const requiredMatches = Math.max(1, Math.min(2, businessWords.length));
        if (matchingWords.length < requiredMatches && businessWords.length > 0) {
          return { valid: false, reason: `TrustATrader trader '${traderSlug}' doesn't match business name (${matchingWords.length}/${requiredMatches} words)` };
        }
      }
      break;

    case 'ratedpeople':
      // RatedPeople: Must be /profile/ or /tradesman/ format
      if (!urlLower.includes('/profile/') && !urlLower.includes('/tradesman/')) {
        return { valid: false, reason: 'RatedPeople URL not a profile page' };
      }
      // Check profile name matches business (stricter matching)
      {
        const profileSlug = urlLower.match(/\/(profile|tradesman)\/([a-z0-9-]+)/i)?.[2] || '';
        const matchingWords = businessWords.filter(w => profileSlug.includes(w));
        const requiredMatches = Math.max(1, Math.min(2, businessWords.length));
        if (matchingWords.length < requiredMatches && businessWords.length > 0) {
          return { valid: false, reason: `RatedPeople profile '${profileSlug}' doesn't match business name (${matchingWords.length}/${requiredMatches} words)` };
        }
      }
      break;

    case 'feefo':
      // Feefo: Must have reviews path
      if (urlLower.includes('/search') || urlLower.includes('/category')) {
        return { valid: false, reason: 'Feefo search/category page, not business page' };
      }
      break;

    case 'reviews_io':
      // Reviews.io: Must be /company-reviews/ format
      if (!urlLower.includes('/company-reviews/')) {
        return { valid: false, reason: 'Reviews.io URL not a company reviews page' };
      }
      break;
  }

  // General validation: Filter out any URL with pagination params
  if (urlLower.includes('?page=') || urlLower.includes('&page=') ||
      urlLower.includes('?start=') || urlLower.includes('&start=') ||
      urlLower.includes('?offset=') || urlLower.includes('&offset=')) {
    return { valid: false, reason: 'URL contains pagination parameters' };
  }

  return { valid: true };
}

function calculateConfidence(businessName: string, title?: string, snippet?: string): number {
  if (!title && !snippet) return 50;
  
  const text = `${title || ''} ${snippet || ''}`.toLowerCase();
  const cleanName = businessName
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|llc|plc|uk|us)\b/gi, '')
    .trim();
  
  const nameWords = cleanName
    .split(/[\s,&-]+/)
    .filter(word => word.length >= 3)
    .filter(word => !['the', 'and', 'for'].includes(word));

  if (nameWords.length === 0) return 50;

  const matchCount = nameWords.filter(word => text.includes(word)).length;
  return Math.round((matchCount / nameWords.length) * 100);
}

function mergeResults(
  existing: Partial<BusinessPlatforms>,
  newResults: Partial<BusinessPlatforms>
): Partial<BusinessPlatforms> {
  const merged = { ...existing };
  
  for (const [key, newLink] of Object.entries(newResults)) {
    if (!newLink) continue;
    
    const existingLink = (merged as any)[key];
    
    // Keep the one with higher confidence
    if (!existingLink || (newLink.confidence || 0) > (existingLink.confidence || 0)) {
      (merged as any)[key] = newLink;
    }
  }
  
  return merged;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Find all platforms for a business
 * Uses multiple sources in parallel for speed
 */
export async function findBusinessPlatforms(
  businessName: string,
  options: ScraperOptions = {}
): Promise<BusinessPlatforms> {
  const {
    website,
    enableCache = true,
    verifyUrls = true,
    parallelRequests = true,
  } = options;

  // Check cache first
  const cacheKey = `${businessName}:${website || 'no-website'}`;
  if (enableCache) {
    const cached = platformCache.get(cacheKey);
    if (cached) {
      console.log(`[Cache] Hit for ${businessName}`);
      return cached;
    }
  }

  console.log(`🔍 Searching platforms for: ${businessName}`);
  
  let allResults: Partial<BusinessPlatforms> = {};

  // Build array of search tasks
  const searchTasks: Promise<Partial<BusinessPlatforms>>[] = [];

  // 1. Website extraction (always first, highest confidence)
  if (website) {
    searchTasks.push(
      extractLinksFromWebsite(website).catch(() => ({}))
    );
    
    // Also try Hunter.io if we have the key and a domain
    if (options.hunterApiKey) {
      try {
        const domain = new URL(website).hostname.replace('www.', '');
        searchTasks.push(
          findViaHunter(domain, options.hunterApiKey).catch(() => ({}))
        );
      } catch {
        // Invalid URL
      }
    }
  }

  // 2. Free APIs (no key required)
  const freeSearchPlatforms = ['trustpilot', 'facebook', 'instagram', 'linkedin', 'tripadvisor'];
  for (const platform of freeSearchPlatforms) {
    searchTasks.push(
      (async () => {
        const url = await searchViaDuckDuckGoHTML(businessName, `${platform}.com`);
        if (url) {
          return {
            [platform]: {
              url,
              foundVia: 'duckduckgo' as const,
              verified: false,
              confidence: 70,
            },
          };
        }
        return {};
      })().catch(() => ({}))
    );
  }

  // 3. API-based searches (require keys)
  if (options.googleCseId && options.googleApiKey) {
    searchTasks.push(
      findViaGoogleCSE(businessName, options.googleCseId, options.googleApiKey).catch(() => ({}))
    );
  }

  if (options.searchApiKey) {
    searchTasks.push(
      findViaSearchAPI(businessName, options.searchApiKey).catch(() => ({}))
    );
  }

  if (options.serpApiKey) {
    searchTasks.push(
      findViaSerpAPI(businessName, options.serpApiKey).catch(() => ({}))
    );
  }

  if (options.bingApiKey) {
    searchTasks.push(
      findViaBingAPI(businessName, options.bingApiKey).catch(() => ({}))
    );
  }

  // Execute tasks (parallel or sequential)
  if (parallelRequests) {
    const results = await Promise.all(searchTasks);
    for (const result of results) {
      allResults = mergeResults(allResults, result);
    }
  } else {
    for (const task of searchTasks) {
      const result = await task;
      allResults = mergeResults(allResults, result);
    }
  }

  // 4. Verify URLs if enabled
  if (verifyUrls) {
    const verificationPromises = Object.entries(allResults).map(async ([platform, link]) => {
      if (!link?.url) return null;
      
      const isValid = await verifyUrl(link.url);
      if (isValid) {
        return {
          platform,
          link: { ...link, verified: true },
        };
      }
      return null;
    });

    const verifiedResults = await Promise.all(verificationPromises);
    
    const verified: BusinessPlatforms = {};
    for (const result of verifiedResults) {
      if (result) {
        (verified as any)[result.platform] = result.link;
      }
    }

    // Cache results
    if (enableCache) {
      platformCache.set(cacheKey, verified);
    }

    return verified;
  }

  // Cache results
  if (enableCache) {
    platformCache.set(cacheKey, allResults as BusinessPlatforms);
  }

  return allResults as BusinessPlatforms;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process multiple businesses with rate limiting
 */
export async function findPlatformsForMany(
  businesses: Array<{ name: string; website?: string; address?: string }>,
  options: ScraperOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ business: string; platforms: BusinessPlatforms; error?: string }>> {
  const results: Array<{ business: string; platforms: BusinessPlatforms; error?: string }> = [];
  
  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    
    try {
      const platforms = await findBusinessPlatforms(business.name, {
        ...options,
        website: business.website,
        address: business.address,
      });
      
      results.push({
        business: business.name,
        platforms,
      });
    } catch (error) {
      results.push({
        business: business.name,
        platforms: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Progress callback
    onProgress?.(i + 1, businesses.length);
    
    // Rate limit between businesses (500ms)
    if (i < businesses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function clearCache(): void {
  platformCache.clear();
  urlVerificationCache.clear();
}

export function getCacheStats(): { platforms: number; urls: number } {
  return {
    platforms: platformCache.size(),
    urls: urlVerificationCache.size(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SimpleCache,
  RateLimiter,
  ScraperError,
  platformCache,
  urlVerificationCache,
};
