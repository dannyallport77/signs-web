import { NextResponse } from 'next/server';

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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const includeSocialMedia = searchParams.get('includeSocialMedia') !== 'false'; // Default to true

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Places API key not configured');
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    // Use Google Places Text Search API for global search
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places Text Search API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    // Handle empty results
    const results = data.results || [];
    
    // Get the base URL for internal API calls
    const baseUrl = new URL(request.url).origin;

    // Transform results and optionally fetch social media links
    const places = await Promise.all(
      results.map(async (place: any) => {
        const basePlace = {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          types: place.types,
          website: place.website,
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

    return NextResponse.json({
      success: true,
      data: places,
      count: places.length
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { error: 'Failed to search places', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
