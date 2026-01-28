import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

type GoogleCallCounts = {
  total: number;
  textSearch: number;
  placeDetails: number;
};

type GoogleCallType = 'textSearch' | 'placeDetails';

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
  yelp?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  yell?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  checkatrade?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  ratedpeople?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustatrader?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
}

// Fetch place details to get website, phone, etc.
async function fetchPlaceDetails(
  placeId: string, 
  apiKey: string, 
  trackCall?: (type: GoogleCallType) => void
): Promise<{ website?: string; phone?: string } | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('fields', 'website,formatted_phone_number');
    url.searchParams.append('key', apiKey);

    trackCall?.('placeDetails');
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return {
        website: data.result.website,
        phone: data.result.formatted_phone_number,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

async function fetchSocialMediaLinks(
  businessName: string,
  address?: string,
  placeId?: string,
  baseUrl?: string
): Promise<SocialMediaLinks | null> {
  try {
    const params = new URLSearchParams();
    params.append('businessName', businessName);
    if (address) params.append('address', address);
    if (placeId) params.append('placeId', placeId);

    // Get base URL from environment or construct it
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${apiBase}/api/places/social-media?${params.toString()}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000), // 30 second timeout for social media lookup
    });

    if (!response.ok) {
      console.error('Social media API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching social media links:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const debugId = request.headers.get('x-google-debug-id') || randomUUID();
    const debugContext = request.headers.get('x-google-debug-context') || 'places_text_search';
    const debugStart = Date.now();
    const googleCalls: GoogleCallCounts = { total: 0, textSearch: 0, placeDetails: 0 };
    const trackCall = (type: GoogleCallType, amount: number = 1) => {
      googleCalls[type] += amount;
      googleCalls.total += amount;
    };
    const withDebugHeaders = (response: NextResponse) => {
      response.headers.set('x-google-debug-id', debugId);
      response.headers.set('x-google-api-calls', JSON.stringify(googleCalls));
      return response;
    };

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const includeSocialMedia = searchParams.get('includeSocialMedia') !== 'false'; // Default to true

    if (!query) {
      return withDebugHeaders(NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      ));
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Places API key not configured');
      return withDebugHeaders(NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      ));
    }

    // Use Google Places Text Search API for global search
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', apiKey);

    trackCall('textSearch');
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places Text Search API error:', data.status, data.error_message);
      console.error('[GoogleAPI] Text search failed', {
        debugId,
        context: debugContext,
        endpoint: '/api/places/text-search',
        status: data.status,
        googleCalls,
        durationMs: Date.now() - debugStart,
      });
      return withDebugHeaders(NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      ));
    }

    // Handle empty results
    const results = data.results || [];
    
    // Get the base URL for internal API calls
    const baseUrl = new URL(request.url).origin;

    // Transform results and optionally fetch social media links
    const places = await Promise.all(
      results.map(async (place: any) => {
        // Fetch place details for website (Text Search doesn't return it)
        const placeDetails = await fetchPlaceDetails(place.place_id, apiKey, trackCall);
        
        const basePlace = {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          types: place.types,
          website: placeDetails?.website || null,
          phone: placeDetails?.phone || null,
          // Generate Google Maps review URL (always included)
          reviewUrl: `https://search.google.com/local/writereview?placeid=${place.place_id}`,
          mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        };

        // If social media links are requested, fetch them
        if (includeSocialMedia) {
          const socialMediaLinks = await fetchSocialMediaLinks(
            place.name,
            place.formatted_address,
            place.place_id,
            baseUrl
          );

          if (socialMediaLinks) {
            return {
              ...basePlace,
              platforms: socialMediaLinks,
            };
          }
        }

        return {
          ...basePlace,
          platforms: {
            google: {
              reviewUrl: basePlace.reviewUrl,
              mapsUrl: basePlace.mapsUrl,
            },
          },
        };
      })
    );

    console.info('[GoogleAPI] Text search completed', {
      debugId,
      context: debugContext,
      endpoint: '/api/places/text-search',
      googleCalls,
      durationMs: Date.now() - debugStart,
      results: places.length,
      includeSocialMedia,
    });
    return withDebugHeaders(NextResponse.json({
      success: true,
      data: places,
      count: places.length,
      googleCalls,
      debugId
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { error: 'Failed to search places', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
