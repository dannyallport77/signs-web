import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage: npx tsx debug-text-search.ts <query>');
        process.exit(1);
    }

    const query = args[0];
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        console.error('GOOGLE_PLACES_API_KEY not found in .env');
        process.exit(1);
    }

    console.log(`Searching Google Places for: "${query}"`);
    
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', apiKey);

    try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('API Error:', data.status, data.error_message);
            return;
        }

        const results = data.results || [];
        console.log(`Found ${results.length} results.`);

        results.slice(0, 3).forEach((place: any, index: number) => {
            console.log(`\n[${index + 1}] ${place.name}`);
            console.log(`    Address: ${place.formatted_address}`);
            console.log(`    Place ID: ${place.place_id}`);
            console.log(`    Website: ${place.website || 'NOT FOUND'}`);
            console.log(`    Types: ${place.types.join(', ')}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
