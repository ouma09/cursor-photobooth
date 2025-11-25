# Deployment Guide

## Vercel Deployment Instructions

### 1. Set Environment Variables in Vercel

Your app needs Supabase credentials to work. You must set these in the Vercel dashboard:

1. Go to your project in Vercel: https://vercel.com/dashboard
2. Click on your project (`cursor-photobooth`)
3. Go to **Settings** > **Environment Variables**
4. Add the following environment variables:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** You need to get these values from your Supabase dashboard:
- Go to https://supabase.com/dashboard
- Select your project
- Go to **Settings** > **API**
- Copy the **Project URL** and **anon/public key**

### 2. Redeploy After Setting Environment Variables

After adding environment variables:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots (...) menu
4. Select **Redeploy**

OR simply push a new commit to trigger a deployment.

### 3. Verify Deployment

After deployment, check:
- ✅ Camera works (browser will ask for permission)
- ✅ Can take photos
- ✅ "Add to Gallery" button works
- ✅ "View Gallery" shows photos
- ✅ No console errors about Supabase

## Troubleshooting

### "Add to Gallery" doesn't work

**Cause:** Environment variables not set or incorrect

**Fix:**
1. Check Vercel dashboard > Settings > Environment Variables
2. Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Make sure they start with `VITE_` prefix (required for Vite)
4. Redeploy after setting

### Console shows "Supabase not configured"

**Cause:** Environment variables missing or incorrect format

**Fix:**
1. Environment variables must start with `VITE_` prefix
2. Make sure to redeploy after adding environment variables
3. Check that the Supabase URL and key are correct

### 404 errors for images

**Cause:** Demo images were disabled (they don't exist in the repo)

**Fix:** This is normal. The app will work fine for taking new photos. The demo polaroids have been removed.

## Local Development

For local development, create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Run the development server:

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
