import { NextRequest, NextResponse } from 'next/server';
import { findBusinessPlatforms, extractLinksFromWebsite, verifyUrl } from '@/lib/scrapers/review-platform-scraper';

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
      if (process.env.SCRAPINGBEE_KEY) {
        options.scrapingBeeKey = process.env.SCRAPINGBEE_KEY;
      }
    }

    // Find all platforms
    const platforms = await findBusinessPlatforms(businessName, options);

    // Count results
    const platformCount = Object.values(platforms).filter(p => p?.verified).length;

    return NextResponse.json(
      {
        success: true,
        business: businessName,
        website: website || null,
        address: address || null,
        platforms,
        foundCount: platformCount,
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
 * Batch search for multiple businesses
 * 
 * Request body:
 * {
 *   businesses: [
 *     { name: 'Business 1', website: 'https://...' },
 *     { name: 'Business 2' }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businesses } = body;

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: businesses must be a non-empty array' },
        { status: 400 }
      );
    }

    console.log(`🔍 Batch searching ${businesses.length} businesses`);

    const results = [];

    for (const business of businesses) {
      if (!business.name) {
        results.push({
          ...business,
          error: 'Missing business name',
        });
        continue;
      }

      try {
        const options: Parameters<typeof findBusinessPlatforms>[1] = {
          website: business.website,
          address: business.address,
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

        const platforms = await findBusinessPlatforms(business.name, options);

        results.push({
          name: business.name,
          platforms,
          success: true,
        });

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          ...business,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        total: businesses.length,
        processed: results.filter(r => r.success).length,
        results,
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
