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

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    // Transform results to include review URL
    const places = data.results.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      // Generate Google Maps review URL
      reviewUrl: `https://search.google.com/local/writereview?placeid=${place.place_id}`,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    }));

    return NextResponse.json({
      success: true,
      data: places,
      count: places.length
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}
