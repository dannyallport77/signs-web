# Test Suite Documentation & TODO List

## 🧪 Test Suite Overview

This test suite provides comprehensive testing for the Review Signs platform including:
- API endpoint tests
- NFC programming workflow tests
- Interactive testing for remote NFC operations
- Identification of mock data and stubs

---

## 📋 TODO List - Items Needing Completion

### 🔴 HIGH PRIORITY - Mock Data / Stubs Requiring Implementation

1. **Signs API - Hardcoded Mock Data**
   - **File:** `/app/api/signs/route.ts`
   - **Issue:** Returns static mock array instead of database records
   - **Action Required:** Connect to Prisma database, query actual Sign model
   ```typescript
   // Current (MOCK):
   const signs = [
     { id: 1, name: 'Exit Sign', type: 'safety', status: 'active' },
     // ... hardcoded data
   ];
   
   // Should be:
   const signs = await prisma.sign.findMany();
   ```

2. **DSers API - Placeholder Service**
   - **File:** `/lib/dsers.ts`
   - **Issue:** DSers does not have a public API - service is non-functional
   - **Action Required:** 
     - Remove API-based approach
     - Implement CSV/JSON import only
     - Update documentation to reflect limitation

3. **Trade Directory Search - Unimplemented Stub**
   - **File:** `/app/api/places/search-trades/route.ts`
   - **Issue:** Returns empty array with "not implemented" message
   - **Action Required:** Implement actual scraping/API for:
     - [ ] Checkatrade
     - [ ] Yell.com
     - [ ] TrustATrader
     - [ ] Rated People

4. **AliExpress API - Mock Fallback**
   - **File:** `/app/api/aliexpress/products/route.ts`
   - **Issue:** Falls back to mock data when API keys not configured
   - **Action Required:**
     - Configure ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET in production
     - Or remove feature if not being used

### 🟡 MEDIUM PRIORITY - Incomplete Features

5. **Fruit Machine Prize Type**
   - **File:** `/app/api/fruit-machine/results/route.ts`
   - **Issue:** Prize type is hardcoded
   ```typescript
   prizeType: 'gift', // TODO: Determine type from prize object
   ```
   - **Action Required:** Implement prize type logic based on prize configuration

6. **Business Ownership Verification (Commented Out)**
   - **File:** `/app/api/nfc-tasks/route.ts`
   - **Issue:** Business ownership check is commented out
   - **Action Required:** Uncomment and implement if business model exists

7. **Social Media Scrapers - Missing Platforms**
   - **File:** `/scrapers/findSocialMedia.ts`
   - **Missing Platforms:**
     - [ ] Feefo
     - [ ] Reviews.io
     - [ ] Pinterest
     - [ ] Threads
   - **Action Required:** Add scraper implementations

### 🟢 LOW PRIORITY - Enhancements

8. **Remote NFC Verification Stubs**
   - **Location:** Mobile app (signs-mobile)
   - **Issue:** Some NFC verification functions return `true` as stubs
   - **Action Required:** Implement actual verification logic

9. **Test Coverage for Components**
   - Add unit tests for React components:
     - [ ] FruitMachine.tsx
     - [ ] ScratchCard.tsx
     - [ ] SpinWheel.tsx
     - [ ] PhoneAnimation.tsx
     - [ ] NotificationBubble.tsx

---

## 🚀 Running Tests

### Interactive Test Runner (Recommended for NFC Testing)
```bash
# Install dependencies
npm install

# Run interactive tests
npx ts-node __tests__/interactive-test-runner.ts
```

### Automated Tests
```bash
# Install Jest if not present
npm install --save-dev jest @types/jest ts-jest

# Run all tests
npx jest

# Run specific test file
npx jest __tests__/api.test.ts

# Run NFC workflow tests (requires auth token)
TEST_AUTH_TOKEN=your-jwt-token npx jest __tests__/nfc-workflow.test.ts

# Run with coverage
npx jest --coverage
```

### Environment Variables for Testing
```bash
# Create .env.test file
TEST_BASE_URL=http://localhost:3000
TEST_AUTH_TOKEN=your-jwt-token-here

# Or export directly
export TEST_BASE_URL=http://localhost:3000
export TEST_AUTH_TOKEN=$(curl -X POST http://localhost:3000/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.token')
```

---

## 📁 Test Files Structure

```
__tests__/
├── setup.ts                    # Test configuration and utilities
├── interactive-test-runner.ts  # Interactive CLI for NFC testing
├── api.test.ts                 # Basic API endpoint tests
├── nfc-workflow.test.ts        # NFC programming workflow tests
└── TEST_SUITE_README.md        # This documentation
```

---

## 🔧 Interactive Test Features

The interactive test runner (`interactive-test-runner.ts`) provides:

| Option | Feature | Auth Required |
|--------|---------|---------------|
| 1 | Test Database Connection | No |
| 2 | Test Health Endpoint | No |
| 3 | Mobile Login (get token) | No |
| 4 | Create NFC Task | Yes |
| 5 | Poll for NFC Tasks (simulate device) | Yes |
| 6 | Log NFC Tag Write | Yes |
| 7 | Create Preprogrammed Tags | Yes |
| 8 | Create Smart Link | Yes |
| 9 | Google Places Search | No |
| 10 | Social Media Discovery | No |
| 11 | Products API | Yes |
| 12 | Invoice Generation | Yes |
| a | Run All Basic Tests | No |
| q | Quit | - |

---

## 🔗 API Endpoints Summary

### Authentication
- `POST /api/mobile/login` - Mobile app login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### NFC Management
- `GET/POST /api/nfc-logs` - NFC tag write logs
- `GET/POST /api/nfc-tasks` - NFC programming tasks
- `GET/PATCH /api/mobile-devices/poll` - Device task polling
- `POST /api/mobile-devices/register` - Device registration
- `GET/POST /api/preprogrammed-tags` - Preprogrammed tags
- `GET/POST /api/smart-links` - Smart redirect links

### Places & Social
- `GET /api/places/nearby` - Search nearby places
- `GET /api/places/social-media` - Discover social profiles
- `GET /api/places/platforms` - Supported platforms
- `GET /api/places/search-trades` - ⚠️ STUB - Trade directory

### Products & Invoices
- `GET/POST /api/products` - Product management
- `GET/POST /api/invoices` - Invoice management
- `GET /api/invoices/[id]/pdf` - Generate PDF

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/sales-trend` - Sales data
- `GET /api/analytics/sign-popularity` - Sign stats

---

## ✅ Test Checklist

Before deploying, ensure:

- [ ] All API health tests pass
- [ ] Database connectivity verified
- [ ] Authentication flow works
- [ ] NFC task creation and polling functional
- [ ] Smart links redirect correctly
- [ ] Invoice generation works
- [ ] No console errors in production build

---

## 🐛 Known Issues

1. **DSers Integration** - API does not exist publicly, CSV import only
2. **Trade Directory Search** - Not implemented, returns empty
3. **Signs API** - Returns mock data instead of DB records
4. **AliExpress** - Requires API credentials or falls back to mock

---

## 📞 Support

For test suite issues or questions about mock data completion:
- Check `/scrapers/findSocialMedia.ts` for scraper patterns
- Review `/lib/` for service implementations
- See Prisma schema for data models: `/prisma/schema.prisma`
