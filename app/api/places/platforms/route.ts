import { NextRequest, NextResponse } from 'next/server';
import { 
  findBusinessPlatforms, 
  findPlatformsForMany,
  extractLinksFromWebsite, 
  verifyUrl,
  clearCache,
  getCacheStats,
  ScraperOptions
} from '@/lib/scrapers/review-platform-scraper';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for scraping

/**
 * GET /api/places/platforms
 * Find review platforms and social media for a business
 * 
 * Query parameters:
 * - name: Business name (required)
 * - website: Business website (optional)
 * - address: Business address (optional)
 * - websiteOnly: If 'true', only extract from website (no API calls)
 * 
 * Example:
 * GET /api/places/platforms?name=Coffee+Shop+XYZ&website=https://coffeeshop.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessName = searchParams.get('name');
    const website = searchParams.get('website');
    const address = searchParams.get('address');
    const websiteOnly = searchParams.get('websiteOnly') === 'true';

    // Validate input
    if (!businessName || businessName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty "name" parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching platforms for: ${businessName}`);

    const options: Parameters<typeof findBusinessPlatforms>[1] = {
      website: website || undefined,
      address: address || undefined,
    };

    // Only use APIs if not websiteOnly mode
    if (!websiteOnly) {
      // Add API keys from environment
      // Note: GOOGLE_PLACES_API_KEY works for Custom Search too
      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
      const googleCseId = process.env.GOOGLE_CSE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID;
      
      if (googleCseId && googleApiKey) {
        options.googleCseId = googleCseId;
        options.googleApiKey = googleApiKey;
        console.log(`[API] Using Google CSE with ID: ${googleCseId.substring(0, 8)}...`);
      }
      if (process.env.SEARCHAPI_KEY) {
        options.searchApiKey = process.env.SEARCHAPI_KEY;
        console.log(`[API] SearchAPI key configured`);
      }
      if (process.env.SERPAPI_KEY) {
        options.serpApiKey = process.env.SERPAPI_KEY;
      }
      if (process.env.SCRAPINGBEE_KEY) {
        options.scrapingBeeKey = process.env.SCRAPINGBEE_KEY;
        console.log(`[API] ScrapingBee key configured`);
      }
      if (process.env.HUNTER_API_KEY) {
        options.hunterApiKey = process.env.HUNTER_API_KEY;
      }
      if (process.env.BING_API_KEY) {
        options.bingApiKey = process.env.BING_API_KEY;
      }
    }

    // Enable caching and parallel requests
    options.enableCache = true;
    options.parallelRequests = true;
    options.verifyUrls = true;

    // Find all platforms
    const platforms = await findBusinessPlatforms(businessName, options);

    // Count results
    const platformCount = Object.values(platforms).filter(p => p?.verified).length;
    const totalFound = Object.keys(platforms).length;
    const cacheStats = getCacheStats();

    return NextResponse.json(
      {
        success: true,
        business: businessName,
        website: website || null,
        address: address || null,
        platforms,
        stats: {
          foundCount: totalFound,
          verifiedCount: platformCount,
          cacheSize: cacheStats.platforms,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Platform search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search for platforms',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/places/platforms
 * Batch search for multiple businesses (optimized with new batch function)
 * 
 * Request body:
 * {
 *   businesses: [
 *     { name: 'Business 1', website: 'https://...' },
 *     { name: 'Business 2' }
 *   ],
 *   clearCacheFirst?: boolean  // Optional: clear cache before searching
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businesses, clearCacheFirst } = body;

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: businesses must be a non-empty array' },
        { status: 400 }
      );
    }

    // Optionally clear cache first
    if (clearCacheFirst) {
      clearCache();
      console.log('🗑️ Cache cleared');
    }

    console.log(`🔍 Batch searching ${businesses.length} businesses`);

    // Build options with all API keys
    const options: ScraperOptions = {
      enableCache: true,
      parallelRequests: true,
      verifyUrls: true,
    };

    // Add API keys
    if (process.env.GOOGLE_CSE_ID && process.env.GOOGLE_API_KEY) {
      options.googleCseId = process.env.GOOGLE_CSE_ID;
      options.googleApiKey = process.env.GOOGLE_API_KEY;
    }
    if (process.env.SEARCHAPI_KEY) {
      options.searchApiKey = process.env.SEARCHAPI_KEY;
    }
    if (process.env.SERPAPI_KEY) {
      options.serpApiKey = process.env.SERPAPI_KEY;
    }
    if (process.env.HUNTER_API_KEY) {
      options.hunterApiKey = process.env.HUNTER_API_KEY;
    }
    if (process.env.BING_API_KEY) {
      options.bingApiKey = process.env.BING_API_KEY;
    }

    // Use new optimized batch function
    const startTime = Date.now();
    const results = await findPlatformsForMany(businesses, options);
    const duration = Date.now() - startTime;

    const successCount = results.filter(r => !r.error).length;
    const cacheStats = getCacheStats();

    return NextResponse.json(
      {
        success: true,
        total: businesses.length,
        processed: successCount,
        failed: businesses.length - successCount,
        results,
        stats: {
          durationMs: duration,
          avgPerBusiness: Math.round(duration / businesses.length),
          cacheSize: cacheStats.platforms,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Batch search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process batch search',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/places/platforms
 * Clear the platform cache
 * 
 * Example:
 * DELETE /api/places/platforms
 */
export async function DELETE() {
  try {
    const statsBefore = getCacheStats();
    clearCache();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared',
      clearedEntries: {
        platforms: statsBefore.platforms,
        urls: statsBefore.urls,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}