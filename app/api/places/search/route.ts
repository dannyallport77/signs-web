
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { googleApiFetch } from '@/lib/google-api';

type GoogleCallCounts = {
  total: number;
  nearbySearch: number;
  placeDetails: number;
};

type GoogleCallType = 'nearbySearch' | 'placeDetails';

// Fetch place details to get website, phone, etc.
async function fetchPlaceDetails(
  placeId: string, 
  apiKey: string, 
  trackCall?: (type: GoogleCallType) => void,
  logContext?: {
    request?: Request;
    debugId?: string;
    debugContext?: string;
  }
): Promise<{ website?: string; phone?: string } | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('fields', 'website,formatted_phone_number');
    url.searchParams.append('key', apiKey);

    trackCall?.('placeDetails');
    const response = await googleApiFetch(url.toString(), {}, {
      service: 'places_details',
      action: 'Google Places Details',
      request: logContext?.request,
      requestId: logContext?.debugId,
      context: logContext?.debugContext,
      source: 'places_search',
      metadata: {
        placeId,
      },
    });
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

export async function GET(request: Request) {
  // Restrict to mobile app only
  const mobileHeader = request.headers.get('x-mobile-app');
  if (mobileHeader !== 'true') {
    return NextResponse.json(
      { error: 'Forbidden: This endpoint is only available to the mobile app.' },
      { status: 403 }
    );
  }
  try {
    const debugId = request.headers.get('x-google-debug-id') || randomUUID();
    const debugContext = request.headers.get('x-google-debug-context') || 'places_search';
    const debugStart = Date.now();
    const googleCalls: GoogleCallCounts = { total: 0, nearbySearch: 0, placeDetails: 0 };
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
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius') || '1500'; // Used as max distance filter
    const keyword = searchParams.get('keyword') || '';
    const rankBy = searchParams.get('rankby') || 'distance'; // Default to distance-based ranking

    if (!latitude || !longitude) {
      return withDebugHeaders(NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      ));
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return withDebugHeaders(NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      ));
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.append('location', `${latitude},${longitude}`);
    // ...existing code...
    if (rankBy === 'distance') {
      url.searchParams.append('rankby', 'distance');
      if (keyword) {
        url.searchParams.append('keyword', keyword);
      } else {
        url.searchParams.append('type', 'establishment');
      }
    } else {
      url.searchParams.append('radius', radius);
      if (keyword) url.searchParams.append('keyword', keyword);
    }
    url.searchParams.append('key', apiKey);

    let allPlaces: any[] = [];
    let nextPageToken: string | undefined;
    let requestCount = 0;
    const maxRequests = 3;

    do {
      const fetchUrl = nextPageToken 
        ? `${url.toString()}&pagetoken=${nextPageToken}`
        : url.toString();
      trackCall('nearbySearch');
      const response = await googleApiFetch(fetchUrl, {}, {
        service: 'places_nearbysearch',
        action: 'Google Places Nearby Search',
        request,
        requestId: debugId,
        context: debugContext,
        source: 'places_search',
        metadata: {
          pageToken: nextPageToken,
          rankBy,
          radius,
          keyword: keyword || undefined,
        },
      });
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        if (requestCount === 0) {
          console.error('[GoogleAPI] Places search failed', {
            debugId,
            context: debugContext,
            endpoint: '/api/places/search',
            status: data.status,
            googleCalls,
            durationMs: Date.now() - debugStart,
          });
          return withDebugHeaders(NextResponse.json(
            { error: `Google Places API error: ${data.status}` },
            { status: 500 }
          ));
        }
        break;
      }

      const userLat = parseFloat(latitude!);
      const userLng = parseFloat(longitude!);
      const placesWithDetails = await Promise.all(data.results.map(async (place: any) => {
        const placeLat = place.geometry.location.lat;
        const placeLng = place.geometry.location.lng;
        const R = 6371e3;
        const φ1 = userLat * Math.PI / 180;
        const φ2 = placeLat * Math.PI / 180;
        const Δφ = (placeLat - userLat) * Math.PI / 180;
        const Δλ = (placeLng - userLng) * Math.PI / 180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        const placeDetails = await fetchPlaceDetails(place.place_id, apiKey, trackCall, {
          request,
          debugId,
          debugContext,
        });
        return {
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity,
          location: place.geometry.location,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          types: place.types,
          distance: distance,
          website: placeDetails?.website || null,
          phone: placeDetails?.phone || null,
          reviewUrl: `https://search.google.com/local/writereview?placeid=${place.place_id}`,
          mapsUrl: `https://www.google.com/maps/place/?q=place_id=${place.place_id}`,
        };
      }));
      allPlaces = [...allPlaces, ...placesWithDetails];
      nextPageToken = data.next_page_token;
      requestCount++;
      if (nextPageToken && requestCount < maxRequests) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } while (nextPageToken && requestCount < maxRequests);
    allPlaces.sort((a, b) => a.distance - b.distance);
    const maxRadius = parseFloat(radius);
    const filteredPlaces = allPlaces.filter(place => place.distance <= maxRadius);
    console.info('[GoogleAPI] Places search completed', {
      debugId,
      context: debugContext,
      endpoint: '/api/places/search',
      googleCalls,
      durationMs: Date.now() - debugStart,
      results: filteredPlaces.length,
      hasMore: !!nextPageToken,
    });
    return withDebugHeaders(NextResponse.json({
      success: true,
      data: filteredPlaces,
      count: filteredPlaces.length,
      hasMore: !!nextPageToken,
      rankBy: rankBy,
      maxRadius: maxRadius,
      googleCalls,
      debugId
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json({ error: 'Failed to search places' }, { status: 500 });
  }
}
