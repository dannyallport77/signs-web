// Backup of previous Google Places search route
// (2026-01-06)

import { NextResponse } from 'next/server';

// Fetch place details to get website, phone, etc.
async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<{ website?: string; phone?: string } | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('fields', 'website,formatted_phone_number');
    url.searchParams.append('key', apiKey);

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
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius') || '1500'; // Used as max distance filter
    const keyword = searchParams.get('keyword') || '';
    const rankBy = searchParams.get('rankby') || 'distance'; // Default to distance-based ranking

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
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
      const response = await fetch(fetchUrl);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        if (requestCount === 0) {
          return NextResponse.json(
            { error: `Google Places API error: ${data.status}` },
            { status: 500 }
          );
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
        const placeDetails = await fetchPlaceDetails(place.place_id, apiKey);
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
    return NextResponse.json({
      success: true,
      data: filteredPlaces,
      count: filteredPlaces.length,
      hasMore: !!nextPageToken,
      rankBy: rankBy,
      maxRadius: maxRadius
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}
