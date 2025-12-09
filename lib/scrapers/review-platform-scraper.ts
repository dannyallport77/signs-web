/**
 * Review Platform & Social Media Scraper
 * Uses free-tier APIs and services to find review platforms and social media for businesses
 */

import * as cheerio from 'cheerio';

export interface PlatformLink {
  url: string;
  verified?: boolean;
  foundVia?: string; // 'website' | 'ai' | 'search'
  note?: string;
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

/**
 * SearchAPI - Free tier: 100 queries/month
 * https://www.searchapi.io
 */
export async function findViaSearchAPI(
  businessName: string,
  apiKey: string
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  try {
    // Search for review platforms
    const reviewPlatforms = [
      'trustpilot',
      'google reviews',
      'tripadvisor',
      'yelp',
      'checkatrade',
      'ratedpeople',
    ];

    for (const platform of reviewPlatforms) {
      try {
        const query = `${businessName} ${platform}`;
        const response = await fetch(
          `https://www.searchapi.io/api/v1/search?q=${encodeURIComponent(
            query
          )}&api_key=${apiKey}&num=5`
        );

        if (response.ok) {
          const data = await response.json();
          const firstResult = data.organic_results?.[0];

          if (firstResult?.link) {
            const platformKey = platform
              .replace(/\s+/g, '_')
              .toLowerCase() as keyof BusinessPlatforms;
            (results as any)[platformKey] = {
              url: firstResult.link,
              foundVia: 'searchapi',
              verified: false,
            };
          }
        }
      } catch (error) {
        console.error(`SearchAPI error for ${platform}:`, error);
      }
    }
  } catch (error) {
    console.error('SearchAPI error:', error);
  }

  return results;
}

/**
 * SerpAPI - Free tier: 100 searches/month
 * https://serpapi.com
 */
export async function findViaSerpAPI(
  businessName: string,
  apiKey: string
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  try {
    const platforms = {
      trustpilot: 'trustpilot.com',
      google: 'google.com/business',
      tripadvisor: 'tripadvisor.com',
      yelp: 'yelp.com',
      checkatrade: 'checkatrade.com',
      ratedpeople: 'ratedpeople.com',
    };

    for (const [platformKey, domain] of Object.entries(platforms)) {
      try {
        const query = `"${businessName}" site:${domain}`;
        const response = await fetch(
          `https://serpapi.com/search?q=${encodeURIComponent(
            query
          )}&api_key=${apiKey}&engine=google`
        );

        if (response.ok) {
          const data = await response.json();
          const firstResult = data.organic_results?.[0];

          if (firstResult?.link) {
            (results as any)[platformKey] = {
              url: firstResult.link,
              foundVia: 'serpapi',
              verified: false,
            };
          }
        }
      } catch (error) {
        console.error(`SerpAPI error for ${platformKey}:`, error);
      }
    }
  } catch (error) {
    console.error('SerpAPI error:', error);
  }

  return results;
}

/**
 * Bright Data - Free tier: 500MB/month + 100 residential IPs
 * Uses residential proxies for web scraping
 * https://brightdata.com
 */
export async function scrapeWithBrightData(
  url: string,
  apiKey: string
): Promise<string | null> {
  try {
    // Using Bright Data's Web Unlocker endpoint
    const response = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        format: 'json',
        method: 'GET',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.html || data.body;
    }
  } catch (error) {
    console.error('Bright Data error:', error);
  }

  return null;
}

/**
 * Apify - Free tier: 50 task runs/month + free tier actors
 * https://apify.com
 */
export async function findViaApify(
  businessName: string,
  apiKey: string
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  try {
    // Use Apify's Google Search Results actor (free tier available)
    const response = await fetch(
      'https://api.apify.com/v2/acts/apify~google-search-results/runs?token=' +
        apiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            queries: [
              `${businessName} trustpilot`,
              `${businessName} google reviews`,
              `${businessName} tripadvisor`,
            ],
            customDataFunction: async (item: any) => {
              return {
                title: item.title,
                link: item.link,
                position: item.position,
              };
            },
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Apify results:', data);
      // Parse and map results to platforms
    }
  } catch (error) {
    console.error('Apify error:', error);
  }

  return results;
}

/**
 * Oxylabs - Free trial: 1000 requests
 * https://oxylabs.io
 */
export async function findViaOxylabs(
  url: string,
  username: string,
  password: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.oxylabs.io/v1/queries', {
      method: 'POST',
      auth: `${username}:${password}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'universal',
        url,
        render: 'html',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.results[0]?.content;
    }
  } catch (error) {
    console.error('Oxylabs error:', error);
  }

  return null;
}

/**
 * Scrapingbee - Free tier: 1000 requests/month
 * https://www.scrapingbee.com
 */
export async function scrapeWithScrapingBee(
  url: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.scrapingbee.com/api/v1/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        url,
        render_js: 'false',
        premium_proxy: 'false',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.body;
    }
  } catch (error) {
    console.error('ScrapingBee error:', error);
  }

  return null;
}

/**
 * ManyRequests - Free tier: 100 requests/month with rotating IPs
 * https://manyrequests.com
 */
export async function scrapeWithManyRequests(
  url: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.manyrequests.com/v1/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        method: 'GET',
        format: 'text',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.body;
    }
  } catch (error) {
    console.error('ManyRequests error:', error);
  }

  return null;
}

/**
 * Free approach: Parse from Google Custom Search Engine
 * Free tier: 100 queries/day
 */
export async function findViaGoogleCSE(
  businessName: string,
  cseId: string,
  apiKey: string
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  try {
    const platforms = {
      trustpilot: { domain: 'trustpilot.com', key: 'trustpilot' },
      google: { domain: 'google.com/business', key: 'google' },
      tripadvisor: { domain: 'tripadvisor.com', key: 'tripadvisor' },
      yelp: { domain: 'yelp.com', key: 'yelp' },
      facebook: { domain: 'facebook.com', key: 'facebook' },
      instagram: { domain: 'instagram.com', key: 'instagram' },
      linkedin: { domain: 'linkedin.com', key: 'linkedin' },
    };

    for (const [_, platform] of Object.entries(platforms)) {
      try {
        const query = `${businessName} site:${platform.domain}`;
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
            query
          )}&cx=${cseId}&key=${apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          const firstResult = data.items?.[0];

          if (firstResult?.link) {
            (results as any)[platform.key] = {
              url: firstResult.link,
              foundVia: 'google_cse',
              verified: false,
            };
          }
        }
      } catch (error) {
        console.error(`Google CSE error for ${platform.key}:`, error);
      }
    }
  } catch (error) {
    console.error('Google CSE error:', error);
  }

  return results;
}

/**
 * Extract links from website HTML
 */
export async function extractLinksFromWebsite(
  websiteUrl: string
): Promise<Partial<BusinessPlatforms>> {
  const results: Partial<BusinessPlatforms> = {};

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return results;

    const html = await response.text();
    const $ = cheerio.load(html);

    const allLinks = new Set<string>();
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href) allLinks.add(href.toLowerCase());
    });

    // Map platforms
    const platformPatterns = {
      trustpilot: [/trustpilot\.com\/review\//],
      google: [/google\.com\/business/, /google\.com\/maps/],
      tripadvisor: [/tripadvisor\.(com|co\.uk)\//, /tripadvisor\.co\.nz/],
      yelp: [/yelp\.(com|co\.uk)\/biz\//],
      checkatrade: [/checkatrade\.com\/trades\//],
      ratedpeople: [/ratedpeople\.com\/tradesman\//],
      facebook: [/facebook\.com\//, /fb\.com\//],
      instagram: [/instagram\.com\//],
      twitter: [/twitter\.com\//, /x\.com\//],
      linkedin: [/linkedin\.com\//],
      youtube: [/youtube\.com\//, /youtu\.be\//],
      tiktok: [/tiktok\.com\//],
    };

    for (const link of allLinks) {
      for (const [platform, patterns] of Object.entries(platformPatterns)) {
        if (patterns.some((pattern) => pattern.test(link))) {
          try {
            const url = new URL(link.startsWith('http') ? link : `https://${link}`);
            (results as any)[platform] = {
              url: url.href,
              foundVia: 'website',
              verified: false,
            };
          } catch (e) {
            // Invalid URL
          }
        }
      }
    }
  } catch (error) {
    console.error('Website extraction error:', error);
  }

  return results;
}

/**
 * Verify URL accessibility
 */
export async function verifyUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
}

/**
 * Main function to find all platforms for a business
 */
export async function findBusinessPlatforms(
  businessName: string,
  options: {
    website?: string;
    address?: string;
    searchApiKey?: string;
    serpApiKey?: string;
    googleCseId?: string;
    googleApiKey?: string;
    brightDataKey?: string;
    apifyKey?: string;
    scrapingBeeKey?: string;
    manyRequestsKey?: string;
  } = {}
): Promise<BusinessPlatforms> {
  const allResults: Partial<BusinessPlatforms> = {};

  // 1. Extract from website (free)
  if (options.website) {
    const websiteLinks = await extractLinksFromWebsite(options.website);
    Object.assign(allResults, websiteLinks);
  }

  // 2. Try free-tier APIs
  if (options.searchApiKey) {
    const searchResults = await findViaSearchAPI(businessName, options.searchApiKey);
    Object.assign(allResults, searchResults);
  }

  if (options.serpApiKey) {
    const serpResults = await findViaSerpAPI(businessName, options.serpApiKey);
    Object.assign(allResults, serpResults);
  }

  if (options.googleCseId && options.googleApiKey) {
    const cseResults = await findViaGoogleCSE(
      businessName,
      options.googleCseId,
      options.googleApiKey
    );
    Object.assign(allResults, cseResults);
  }

  // 3. Verify URLs
  const verified: BusinessPlatforms = {};
  for (const [platform, link] of Object.entries(allResults)) {
    if (link && typeof link === 'object' && link.url) {
      const isValid = await verifyUrl(link.url);
      if (isValid) {
        (verified as any)[platform] = {
          ...link,
          verified: true,
        };
      }
    }
  }

  return verified;
}

/**
 * Export types for reusability
 */
export type {
  PlatformLink,
  BusinessPlatforms,
};
