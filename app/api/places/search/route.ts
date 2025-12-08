import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius') || '1500';
    const keyword = searchParams.get('keyword') || '';

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
    url.searchParams.append('radius', radius);
    if (keyword) url.searchParams.append('keyword', keyword);
    url.searchParams.append('key', apiKey);

    let allPlaces: any[] = [];
    let nextPageToken: string | undefined;
    let requestCount = 0;
    const maxRequests = 3; // Get up to 60 results (20 per page * 3 pages)

    do {
      const fetchUrl = nextPageToken 
        ? `${url.toString()}&pagetoken=${nextPageToken}`
        : url.toString();
      
      const response = await fetch(fetchUrl);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        // If it's the first request and it fails, return error
        if (requestCount === 0) {
          return NextResponse.json(
            { error: `Google Places API error: ${data.status}` },
            { status: 500 }
          );
        }
        // If subsequent requests fail, break and return what we have
        break;
      }

      // Transform and add results with distance calculation
      const userLat = parseFloat(latitude!);
      const userLng = parseFloat(longitude!);
      
      const places = data.results.map((place: any) => {
        const placeLat = place.geometry.location.lat;
        const placeLng = place.geometry.location.lng;
        
        // Calculate distance using Haversine formula
        const R = 6371e3; // Earth's radius in meters
        const φ1 = userLat * Math.PI / 180;
        const φ2 = placeLat * Math.PI / 180;
        const Δφ = (placeLat - userLat) * Math.PI / 180;
        const Δλ = (placeLng - userLng) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in meters
        
        return {
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity,
          location: place.geometry.location,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          types: place.types,
          distance: distance, // Add distance for sorting
          // Generate Google Maps review URL
          reviewUrl: `https://search.google.com/local/writereview?placeid=${place.place_id}`,
          mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        };
      });

      allPlaces = [...allPlaces, ...places];
      nextPageToken = data.next_page_token;
      requestCount++;

      // Google requires a short delay before requesting the next page
      if (nextPageToken && requestCount < maxRequests) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (nextPageToken && requestCount < maxRequests);

    // Sort all places by distance (closest first)
    allPlaces.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      success: true,
      data: allPlaces,
      count: allPlaces.length,
      hasMore: !!nextPageToken
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}
