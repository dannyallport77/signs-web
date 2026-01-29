# Complete Setup Guide - Signs NFC Writer

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Google Cloud account (for Maps & Places API)
- Physical NFC-enabled Android/iOS device for testing NFC features

## Step 1: Get Google API Keys

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API

4. Create API credentials:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key
   - Restrict the key to your APIs (recommended)

## Step 2: Setup Web App

```bash
cd "/Users/admin/Development/signs app/signs-web"

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Google API keys

# Setup database and create admin user
npm run setup

# Start development server
npm run dev
```

The web app will be available at: **http://localhost:3000**

### Admin Login
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your environment before running `npm run setup`.
- No default credentials are shipped.

## Step 3: Create Users for Mobile App

1. Login to web app at http://localhost:3000
2. Go to Dashboard → Users
3. Click "Add User"
4. Enter user details:
   - Name: `Mobile User`
   - Email: `user@example.com`
   - Password: `password123`
   - Role: `user`
5. Click "Create User"

These credentials will be used to login to the mobile app.

## Step 4: Setup Mobile App

```bash
cd "/Users/admin/Development/signs app/signs-mobile"

# Install dependencies
npm install

# Configure environment variables
# Edit app.json and add your Google Maps API key in:
# - ios.config.googleMapsApiKey
# - android.config.googleMaps.apiKey
```

### Update API URL

Create `.env` file in `signs-mobile/`:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000/api
```

Find your IP:
- **Mac**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: `ipconfig`
- **Linux**: `ip addr show`

Example: `EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api`

## Step 5: Run Mobile App

```bash
cd "/Users/admin/Development/signs app/signs-mobile"

# Start Expo
npm start

# Then:
# - Scan QR code with Expo Go app (iOS/Android)
# - Or press 'a' for Android emulator
# - Or press 'i' for iOS simulator
```

### Test the Mobile App

1. **Login** with user credentials created in Step 3
2. **Allow Location** when prompted
3. **Search** for nearby businesses
4. **Tap a marker** to view business details
5. **Write NFC Tag** (requires physical NFC tag)

## Step 6: Configure Stock Control

1. Login to web dashboard
2. Go to "Stock" section
3. Add stock items:
   - Name: `NFC Tag - NTAG213`
   - SKU: `NFC-001`
   - Quantity: `100`
   - Min Quantity: `20`

## API Endpoints

### Web App APIs

#### Authentication
- `POST /api/mobile/login` - Mobile app login
- `POST /api/auth/signin` - Web app login
- `POST /api/auth/signout` - Logout

#### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

#### Stock
- `GET /api/stock` - List stock items
- `POST /api/stock` - Create stock item
- `GET /api/stock/[id]` - Get stock item details
- `PATCH /api/stock/[id]` - Update stock item
- `DELETE /api/stock/[id]` - Delete stock item
- `POST /api/stock/[id]/movement` - Record stock movement

#### Google Places
- `GET /api/places/search` - Search nearby businesses
  - Params: `latitude`, `longitude`, `radius`, `keyword`

#### NFC Tags
- `GET /api/nfc-tags` - List all written NFC tags
- `POST /api/nfc-tags` - Log a written NFC tag

## Environment Variables Reference

### Web App (.env)
```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_MAPS_API_KEY="your-key-here"
GOOGLE_PLACES_API_KEY="your-key-here"
```

### Mobile App (app.json)
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_KEY_HERE"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_KEY_HERE"
        }
      }
    }
  }
}
```

## Deployment

### Web App to Vercel

```bash
cd signs-web
npm install -g vercel
vercel
```

Update mobile app's `EXPO_PUBLIC_API_URL` to your Vercel URL.

### Web App to Railway

```bash
cd signs-web
npm install -g @railway/cli
railway login
railway init
railway up
```

### Mobile App (Production Build)

```bash
cd signs-mobile

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure

# Build for both platforms
eas build --platform all
```

## Troubleshooting

### Mobile app can't connect to API
- Check firewall allows port 3000
- Verify IP address is correct
- Ensure phone and computer on same network
- Try using `http://` not `https://`

### NFC not working
- NFC only works on physical devices
- Ensure NFC is enabled in device settings
- Android has better NFC support than iOS
- iOS requires iPhone 7 or later with iOS 11+

### Google Places returns no results
- Verify API key is correct
- Check API is enabled in Google Cloud Console
- Ensure location permissions granted
- Try increasing search radius

### Database errors
- Delete `dev.db` and run `npm run setup` again
- Check DATABASE_URL in .env
- Run `npx prisma generate`

## Security Notes

1. **Change default admin password** immediately
2. **Use environment variables** for API keys
3. **Never commit** .env files to git
4. **Enable API key restrictions** in Google Cloud Console
5. **Use HTTPS** in production
6. **Implement rate limiting** for production APIs

## Next Steps

1. ✅ **Test the complete flow**:
   - Login to web app
   - Create users
   - Login to mobile app
   - Search businesses
   - Write NFC tag
   - Verify tag logged in web dashboard

2. 📱 **Test on physical device** for NFC functionality

3. 🚀 **Deploy to production**:
   - Web app → Vercel/Railway
   - Mobile app → Expo EAS / App Stores

4. 🔐 **Secure the system**:
   - Change all default passwords
   - Configure API key restrictions
   - Add rate limiting
   - Set up monitoring

## Support

For issues or questions:
1. Check this guide
2. Review API documentation
3. Check Google Cloud Console for API quota/errors
4. Review Expo documentation for mobile issues

## License

MIT
