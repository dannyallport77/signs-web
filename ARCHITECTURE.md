# System Architecture - Signs NFC Writer

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNS NFC WRITER SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│                      │         │                      │
│   MOBILE APP (Expo)  │◄───────►│  WEB APP (Next.js)   │
│   • iOS/Android      │   API   │  • Admin Dashboard   │
│   • Google Maps      │         │  • User Management   │
│   • NFC Writing      │         │  • Stock Control     │
│   • Location         │         │  • API Endpoints     │
│                      │         │                      │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                │
           │                                │
           ▼                                ▼
┌──────────────────────┐         ┌──────────────────────┐
│  Google Places API   │         │   SQLite Database    │
│  • Nearby Search     │         │  • Users             │
│  • Business Details  │         │  • Stock Items       │
│  • Review URLs       │         │  • Stock Movements   │
└──────────────────────┘         │  • NFC Tags          │
                                 │  • Sessions          │
                                 └──────────────────────┘
```

## User Flows

### 1. Mobile User Flow

```
1. Login
   ↓
2. View Map → Get Current Location
   ↓
3. Search Nearby Businesses → Google Places API
   ↓
4. Display Results on Map
   ↓
5. Select Business
   ↓
6. View Business Details + Review URL
   ↓
7. Write NFC Tag → Device NFC Hardware
   ↓
8. Log Written Tag → API → Database
```

### 2. Admin Web Flow

```
1. Login → NextAuth Authentication
   ↓
2. Dashboard → View Stats
   ↓
3. Manage Users
   - Create users for mobile app access
   - Update user roles
   - Deactivate users
   ↓
4. Manage Stock
   - Add stock items
   - Record stock movements (in/out)
   - Track low stock alerts
   ↓
5. View NFC Tag History
   - See all written tags
   - Business details
   - Who wrote it and when
```

## Data Models

### User
```typescript
{
  id: string
  email: string
  password: string (hashed)
  name: string?
  role: "admin" | "user"
  active: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Stock Item
```typescript
{
  id: string
  name: string
  description: string?
  sku: string (unique)
  quantity: number
  minQuantity: number
  location: string?
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Stock Movement
```typescript
{
  id: string
  stockItemId: string
  userId: string
  type: "in" | "out" | "adjustment"
  quantity: number
  reason: string?
  notes: string?
  createdAt: DateTime
}
```

### NFC Tag
```typescript
{
  id: string
  businessName: string
  businessAddress: string?
  placeId: string
  reviewUrl: string
  latitude: number?
  longitude: number?
  writtenAt: DateTime
  writtenBy: string?
}
```

## API Architecture

### Authentication Flow

```
Mobile App Login:
  POST /api/mobile/login
    { email, password }
    ↓
  Verify credentials → Database
    ↓
  Generate JWT token
    ↓
  Return { user, token }

Web App Login:
  POST /api/auth/signin
    ↓
  NextAuth + Prisma Adapter
    ↓
  Create session → JWT cookie
    ↓
  Redirect to /dashboard
```

### Google Places Integration

```
Mobile App → GET /api/places/search
  ?latitude=...&longitude=...&radius=...&keyword=...
    ↓
Next.js API Route
    ↓
Google Places API (server-side)
    ↓
Transform results:
  - Add reviewUrl
  - Add mapsUrl
  - Format data
    ↓
Return to mobile app
```

### Stock Management

```
Web Dashboard → POST /api/stock
  { name, sku, quantity, ... }
    ↓
Verify admin auth
    ↓
Create stock item → Database
    ↓
Create initial movement (if quantity > 0)
    ↓
Return success

Mobile/Web → POST /api/stock/[id]/movement
  { type, quantity, reason }
    ↓
Verify auth
    ↓
Transaction:
  1. Create movement record
  2. Update stock quantity
    ↓
Return success
```

## Security Architecture

### Authentication Layers

1. **Web App**: NextAuth JWT sessions
2. **Mobile App**: JWT bearer tokens
3. **API Routes**: Middleware checks for valid auth
4. **Role-Based Access**: Admin-only endpoints protected

### Data Protection

```
Password Storage: bcrypt (10 rounds)
API Keys: Environment variables only
Sessions: HTTP-only cookies (web)
Tokens: 7-day expiry (mobile)
Database: Local file for dev, hosted for production
```

## Technology Stack

### Mobile App
- **Framework**: Expo SDK
- **Navigation**: React Navigation
- **Maps**: react-native-maps (Google Maps)
- **Location**: expo-location
- **NFC**: react-native-nfc-manager
- **Storage**: @react-native-async-storage/async-storage
- **HTTP**: fetch API

### Web App
- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth.js 4
- **Database**: Prisma + SQLite (dev) / PostgreSQL (production)
- **Styling**: Tailwind CSS 4
- **TypeScript**: Full type safety

### APIs & Services
- **Google Maps**: Maps SDK for iOS/Android
- **Google Places**: Nearby Search API
- **Authentication**: JWT (jose library)

## Deployment Architecture

### Development
```
Local Machine:
  - Web: localhost:3000
  - Mobile: Expo Go app
  - Database: SQLite file
  - API Keys: .env files
```

### Production
```
Web App:
  - Vercel / Railway
  - Environment variables
  - PostgreSQL database
  - HTTPS enabled

Mobile App:
  - Expo EAS Build
  - Over-the-air updates
  - App Store / Google Play
  
Database:
  - Railway PostgreSQL
  - Or Supabase
  - Or Vercel Postgres
```

## Scaling Considerations

### Current Architecture (MVP)
- Single server
- SQLite database
- Direct API calls
- No caching

### Production Improvements
1. **Database**: Switch to PostgreSQL
2. **Caching**: Redis for sessions/frequently accessed data
3. **CDN**: Static assets via Vercel/Cloudflare
4. **Rate Limiting**: Protect APIs from abuse
5. **Monitoring**: Error tracking (Sentry)
6. **Analytics**: Usage tracking
7. **Backups**: Automated database backups
8. **Load Balancing**: If traffic scales

## Future Enhancements

- [ ] QR code generation for NFC tags
- [ ] Multi-language support
- [ ] Offline mode for mobile app
- [ ] Bulk NFC tag writing
- [ ] Advanced analytics dashboard
- [ ] Export reports (PDF/CSV)
- [ ] Email notifications (low stock alerts)
- [ ] Role-based permissions (granular)
- [ ] API webhooks
- [ ] White-label options
