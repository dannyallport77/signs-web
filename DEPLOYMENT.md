# Deployment Guide

## Vercel Deployment (Recommended for Next.js)

### Method 1: Vercel Dashboard
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and deploy

### Method 2: Vercel CLI
```bash
cd signs-web
npm install -g vercel
vercel login
vercel
```

Follow the prompts to deploy.

### Environment Variables
Add these in Vercel dashboard under Settings → Environment Variables:
- `NEXT_PUBLIC_API_URL` - Your API URL
- `NEXT_PUBLIC_APP_NAME` - Application name

## Railway Deployment

### Prerequisites
```bash
npm install -g @railway/cli
```

### Deployment Steps
```bash
cd signs-web
railway login
railway init
railway up
```

### Environment Variables
```bash
railway variables set NEXT_PUBLIC_API_URL=https://your-app.railway.app/api
railway variables set NEXT_PUBLIC_APP_NAME="Signs App"
```

### Custom Domain
```bash
railway domain
```

## Mobile App (Expo)

### Development Build
```bash
cd signs-mobile
npm install
npm start
```

### Production Build

#### iOS (requires Mac)
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Expo Application Services (EAS)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```

## Testing Locally

### Web App
```bash
cd signs-web
npm run dev
# Visit http://localhost:3000
```

### Mobile App
```bash
cd signs-mobile
npm start
# Scan QR code with Expo Go app
```

## Production Checklist

- [ ] Update environment variables
- [ ] Configure custom domain
- [ ] Set up analytics
- [ ] Enable error tracking
- [ ] Configure CORS if needed
- [ ] Add authentication
- [ ] Set up database
- [ ] Configure CI/CD
- [ ] Test mobile app on real devices
- [ ] Submit to app stores (iOS/Android)
