# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
# Install web app dependencies
cd signs-web
npm install

# Install mobile app dependencies
cd ../signs-mobile
npm install
```

Or from the root directory:
```bash
npm run install:all
```

### 2. Run Development Servers

#### Web App (Next.js)
```bash
cd signs-web
npm run dev
```
Open http://localhost:3000 in your browser

#### Mobile App (Expo)
```bash
cd signs-mobile
npm start
```
- Scan QR code with Expo Go app (iOS/Android)
- Or press `w` to open in web browser
- Or press `i` for iOS simulator (Mac only)
- Or press `a` for Android emulator

### 3. Test the API

The web app includes a sample API. Test it:

```bash
# Health check
curl http://localhost:3000/api

# Get signs
curl http://localhost:3000/api/signs

# Create a sign (POST)
curl -X POST http://localhost:3000/api/signs \
  -H "Content-Type: application/json" \
  -d '{"name":"Stop Sign","type":"warning"}'
```

## 📱 Project Structure

```
signs app/
├── signs-web/          # Next.js web application
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── page.tsx   # Home page
│   │   └── layout.tsx
│   ├── public/
│   └── package.json
│
├── signs-mobile/       # Expo mobile app
│   ├── App.tsx        # Main app component
│   ├── assets/
│   └── package.json
│
├── README.md
├── DEPLOYMENT.md
└── package.json
```

## 🎨 What's Included

### Web App Features
✅ Next.js 15 with App Router
✅ TypeScript
✅ Tailwind CSS
✅ Sample API routes
✅ Responsive design
✅ Ready for Vercel/Railway

### Mobile App Features
✅ Expo SDK
✅ TypeScript
✅ Cross-platform (iOS/Android)
✅ Hot reload
✅ Web support

## 🔧 Development Commands

From the root directory:
```bash
npm run dev:web        # Start web app
npm run dev:mobile     # Start mobile app
npm run build:web      # Build web app for production
npm run deploy:vercel  # Deploy web to Vercel
npm run deploy:railway # Deploy web to Railway
```

## 🌐 Deploy to Production

### Vercel (Web App)
```bash
cd signs-web
npm install -g vercel
vercel
```

### Railway (Web App)
```bash
cd signs-web
npm install -g @railway/cli
railway login
railway init
railway up
```

See `DEPLOYMENT.md` for detailed instructions.

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Expo won't start
```bash
cd signs-mobile
rm -rf node_modules
npm install
npm start -- --clear
```

### Next.js build errors
```bash
cd signs-web
rm -rf .next node_modules
npm install
npm run dev
```

## 📚 Next Steps

1. **Customize the UI** - Edit `signs-web/app/page.tsx` and `signs-mobile/App.tsx`
2. **Add Database** - Integrate PostgreSQL, MongoDB, or Supabase
3. **Add Authentication** - Use NextAuth.js or similar
4. **Build Features** - Add sign management, users, etc.
5. **Deploy** - Push to production on Vercel/Railway

## 🎯 Tech Stack

- **Frontend**: Next.js 15, React 19
- **Mobile**: Expo, React Native
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel / Railway

## 📝 License

MIT
