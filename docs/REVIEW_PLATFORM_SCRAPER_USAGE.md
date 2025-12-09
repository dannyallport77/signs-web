# Review Platform & Social Media Scraper - Usage Guide

This guide explains how to use the new scraper to find review platforms and social media for businesses.

## 🎯 Quick Start

### 1. Setup Environment Variables

Create `.env.local` with your API keys:

```bash
# Google (most important - generous free tier)
GOOGLE_API_KEY=your_api_key_here
GOOGLE_CSE_ID=your_cse_id_here

# Optional: Additional search APIs (100 calls/month each)
SEARCHAPI_KEY=your_key_here
SERPAPI_KEY=your_key_here

# Optional: For JavaScript-heavy websites
SCRAPINGBEE_KEY=your_key_here
```

See `docs/FREE_TIER_SCRAPING_GUIDE.md` for detailed setup instructions.

### 2. API Endpoints

#### GET Single Business
```bash
# Basic search
curl "http://localhost:3000/api/places/platforms?name=Starbucks"

# With website
curl "http://localhost:3000/api/places/platforms?name=Coffee+Shop&website=https://coffeeshop.com"

# Website extraction only (no API calls)
curl "http://localhost:3000/api/places/platforms?name=Coffee+Shop&website=https://coffeeshop.com&websiteOnly=true"
```

#### POST Batch Search
```bash
curl -X POST http://localhost:3000/api/places/platforms \
  -H "Content-Type: application/json" \
  -d '{
    "businesses": [
      { "name": "Coffee Shop", "website": "https://coffeeshop.com" },
      { "name": "Pizza Place", "address": "123 Main St" }
    ]
  }'
```

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "business": "Coffee Shop XYZ",
  "website": "https://coffeeshop.com",
  "address": null,
  "platforms": {
    "google": {
      "url": "https://www.google.com/business/...",
      "verified": true,
      "foundVia": "google_cse"
    },
    "trustpilot": {
      "url": "https://www.trustpilot.com/review/...",
      "verified": true,
      "foundVia": "google_cse"
    },
    "facebook": {
      "url": "https://www.facebook.com/coffeeshopxyz",
      "verified": true,
      "foundVia": "website"
    },
    "instagram": {
      "url": "https://www.instagram.com/coffeeshopxyz",
      "verified": true,
      "foundVia": "website"
    },
    "tripadvisor": {
      "url": "https://www.tripadvisor.com/...",
      "verified": false,
      "foundVia": "searchapi"
    }
  },
  "foundCount": 5,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## 🔌 Using in TypeScript/React

### Server Component

```typescript
// app/components/BusinessPlatformFinder.tsx
import { findBusinessPlatforms } from '@/lib/scrapers/review-platform-scraper';

export async function BusinessPlatformFinder({ businessName, website }: { businessName: string; website?: string }) {
  const platforms = await findBusinessPlatforms(businessName, {
    website,
    googleCseId: process.env.GOOGLE_CSE_ID,
    googleApiKey: process.env.GOOGLE_API_KEY,
    searchApiKey: process.env.SEARCHAPI_KEY,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Found Platforms</h2>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(platforms).map(([platform, link]) => (
          link?.verified && (
            <a
              key={platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded hover:bg-gray-50"
            >
              <div className="font-semibold capitalize">{platform}</div>
              <div className="text-sm text-gray-600">via {link.foundVia}</div>
            </a>
          )
        ))}
      </div>
    </div>
  );
}
```

### Client Component with Form

```typescript
// app/components/PlatformSearchForm.tsx
'use client';

import { useState } from 'react';
import { BusinessPlatforms } from '@/lib/scrapers/review-platform-scraper';

export function PlatformSearchForm() {
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BusinessPlatforms | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('name', businessName);
      if (website) params.set('website', website);

      const response = await fetch(`/api/places/platforms?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.platforms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSearch} className="space-y-4 mb-8">
        <div>
          <label className="block font-semibold mb-2">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter business name"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Website (optional)</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Find Platforms'}
        </button>
      </form>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {results && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Found Platforms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results).map(([platform, link]) => (
              link?.url && (
                <a
                  key={platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border rounded hover:shadow-lg transition-shadow"
                >
                  <div className="font-semibold capitalize">{platform}</div>
                  <div className="text-sm text-gray-600">
                    {link.verified ? '✓ Verified' : '⚠ Not verified'}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    via {link.foundVia}
                  </div>
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🏗️ Project Structure

```
app/
├── api/
│   └── places/
│       ├── platforms/
│       │   └── route.ts          # New endpoint
│       └── social-media/
│           └── route.ts          # Existing endpoint (still works)
lib/
├── scrapers/
│   └── review-platform-scraper.ts # New scraper module
docs/
└── FREE_TIER_SCRAPING_GUIDE.md    # API setup guide
```

## 📈 Platforms Found

The scraper looks for:

### Review Platforms
- ✅ **Trustpilot** - Reviews, ratings
- ✅ **Google Reviews** - Maps, business profiles
- ✅ **TripAdvisor** - Travel, restaurants, attractions
- ✅ **Yelp** - Reviews, ratings
- ✅ **Checkatrade** - UK trades & services
- ✅ **Rated People** - UK service professionals
- ✅ **TrustATrader** - UK trader profiles
- ✅ **Yell** - UK business directory
- ⏳ **Feefo** (coming soon)
- ⏳ **Reviews.io** (coming soon)

### Social Media
- ✅ **Facebook** - Pages, reviews
- ✅ **Instagram** - Profiles, feeds
- ✅ **Twitter/X** - Profiles, updates
- ✅ **LinkedIn** - Company profiles
- ✅ **YouTube** - Channels, videos
- ✅ **TikTok** - Creator profiles
- ⏳ **Pinterest** (coming soon)
- ⏳ **Threads** (coming soon)

## 🔍 Search Strategy

The scraper uses this priority order:

1. **Website Extraction** (FREE, instant)
   - Crawls your website for links to platforms
   - Most reliable for verified accounts

2. **Google Custom Search Engine** (FREE, 100/day)
   - Searches "site:platform.com" for business
   - Most comprehensive results

3. **SearchAPI** (100/month)
   - Returns structured search results
   - Good backup option

4. **SerpAPI** (100/month)
   - Google search results
   - Another backup option

5. **ScrapingBee** (1000/month)
   - For JavaScript-heavy websites
   - When simple HTTP fails

## 💡 Advanced Usage

### Extract Only from Website

```typescript
import { extractLinksFromWebsite } from '@/lib/scrapers/review-platform-scraper';

const links = await extractLinksFromWebsite('https://example.com');
// No API calls, just parses HTML
```

### Verify a Specific URL

```typescript
import { verifyUrl } from '@/lib/scrapers/review-platform-scraper';

const isValid = await verifyUrl('https://trustpilot.com/review/example.com');
// Returns true/false
```

### Custom Platform Search

```typescript
import { findViaSerpAPI } from '@/lib/scrapers/review-platform-scraper';

const results = await findViaSerpAPI('Business Name', process.env.SERPAPI_KEY!);
// Get just SerpAPI results
```

## 🐛 Troubleshooting

### No results found?

1. **Check API keys** - Verify keys in `.env.local`
2. **Try website extraction** - Use `?websiteOnly=true`
3. **Check business exists** - Search Google manually first
4. **Wait for quota reset** - Monthly quotas reset on the 1st

### Getting 403/429 errors?

1. Use **ScrapingBee** for problem websites
2. Add request delays in batch operations
3. Check service rate limits

### Website extraction returns nothing?

1. Business may not have links on their website
2. Links may use JavaScript (try ScrapingBee)
3. Website may block scraping (use proxy service)

## 📊 Monitoring & Analytics

Track your API usage:

```typescript
// middleware.ts or logging function
async function logPlatformSearch(businessName: string, resultCount: number) {
  await db.platformSearch.create({
    data: {
      businessName,
      foundCount: resultCount,
      timestamp: new Date(),
    },
  });
}
```

## 🚀 Performance Tips

1. **Cache results** - Store found platforms for 30 days
2. **Batch requests** - Use POST endpoint for multiple businesses
3. **Add delays** - 500ms between batch requests
4. **Website first** - Extract from website before API calls
5. **Verify URLs** - Only verify when needed

## 📝 Examples by Industry

### Restaurant
```bash
curl "http://localhost:3000/api/places/platforms?name=The+Oak+Restaurant&website=https://theoakrestaurant.com"
```
Expected: Google, TripAdvisor, Yelp, Facebook, Instagram

### HVAC Service
```bash
curl "http://localhost:3000/api/places/platforms?name=Cool+Air+HVAC&address=123+Main+St"
```
Expected: Google, Trustpilot, Checkatrade, Rated People, Facebook

### Beauty Salon
```bash
curl "http://localhost:3000/api/places/platforms?name=Luxe+Salon&website=https://luxesalon.com"
```
Expected: Google, Instagram, Facebook, Facebook (reviews), TikTok

## 🔗 Related Resources

- **Existing API**: `/api/places/social-media` - Original social media finder
- **Google CSE Setup**: https://cse.google.com
- **Free Tier Guide**: `docs/FREE_TIER_SCRAPING_GUIDE.md`
- **SearchAPI**: https://www.searchapi.io
- **SerpAPI**: https://serpapi.com

## 📞 Support

For issues or questions:
1. Check `FREE_TIER_SCRAPING_GUIDE.md`
2. Review logs in terminal
3. Test with curl first
4. Check API key validity
