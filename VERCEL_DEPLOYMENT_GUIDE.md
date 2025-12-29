# Vercel Deployment Guide - Signs NFC Writer

## Prerequisites

Before deploying to Vercel, you need:

1. **Vercel CLI** installed (✅ already installed)
2. **PostgreSQL Database** for production (SQLite doesn't work on Vercel)
3. **GitHub repository** pushed (✅ already done: dannyallport77/signs-nfc-writer)

## Step 1: Set Up Production Database

### Option A: Vercel Postgres (Recommended)
1. Go to https://vercel.com/dashboard
2. Create a new Postgres database
3. Copy the `DATABASE_URL` connection string

### Option B: Railway Postgres
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and create database
railway login
railway init
railway add --database postgres
railway variables
# Copy the DATABASE_URL
```

### Option C: Railway, Supabase, or PlanetScale
- Sign up for any PostgreSQL provider
- Create a database
- Copy the connection string

## Step 2: Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

```bash
# Navigate to the web app directory
cd "/Users/admin/Development/signs app/signs-web"

# Login to Vercel (if not already logged in)
vercel login

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? [Y]
# - Which scope? [Your account]
# - Link to existing project? [N]
# - What's your project's name? [signs-web]
# - In which directory is your code located? [./]
# - Want to modify settings? [N]
```

### Method 2: Using Vercel Dashboard (Alternative)

1. Go to https://vercel.com/new
2. Import your GitHub repository: `dannyallport77/signs-nfc-writer`
3. Configure:
   - **Root Directory**: `signs-web`
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next`

## Step 3: Configure Environment Variables

After deployment starts, add these environment variables in Vercel Dashboard:

### Required Variables:

```env
# Database (Production PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Google Places API
GOOGLE_PLACES_API_KEY="AIzaSyDDfyo07pPKa4DYzWdkkVWAQYuba_T3zqo"

# Mobile App API URL (for CORS)
NEXT_PUBLIC_API_URL="https://your-app.vercel.app"
```

### To Add Variables:

**Via CLI:**
```bash
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add GOOGLE_PLACES_API_KEY production
```

**Via Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development

## Step 4: Generate NextAuth Secret

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

## Step 5: Initialize Database

After deployment, run migrations:

```bash
# Set the production database URL
export DATABASE_URL="your-production-database-url"

# Push the Prisma schema to production
npx prisma db push

# Run the setup script to create admin user
npx tsx scripts/setup.ts
```

## Step 6: Update Mobile App Configuration

Update the mobile app to point to your Vercel deployment:

1. Edit `signs-mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-app.vercel.app"
    }
  }
}
```

2. Update API calls in mobile screens to use the Vercel URL

## Step 7: Test Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test login with admin credentials (from setup script)
3. Test API endpoints:
   - `/api/users`
   - `/api/stock`
   - `/api/places/search`

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure `prisma generate` runs before `next build`
- Verify all dependencies are in `package.json`

### Database Connection Issues
- Ensure DATABASE_URL has `?sslmode=require` for PostgreSQL
- Check connection string format
- Verify database is accessible from Vercel's servers

### NextAuth Errors
- Ensure NEXTAUTH_URL matches your Vercel domain exactly
- Verify NEXTAUTH_SECRET is set and at least 32 characters
- Check that cookies are allowed in browser

### 500 Errors
- Check Vercel function logs
- Ensure all environment variables are set
- Verify Prisma client is generated

## Post-Deployment Tasks

1. **Change Admin Password**: Login and change the default admin password
2. **Set Up Domain**: Configure a custom domain in Vercel settings
3. **Enable Analytics**: Turn on Vercel Analytics for monitoring
4. **Configure CORS**: Update middleware for production CORS settings
5. **Monitor Logs**: Check Vercel function logs regularly

## Continuous Deployment

Once deployed, Vercel automatically deploys on every push to `main`:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically deploys
```

## Rolling Back

If deployment has issues:

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
