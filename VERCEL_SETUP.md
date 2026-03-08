# Vercel Setup - Add DATABASE_URL

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Your Neon connection string (from .env.local)
   - **Environments:** Production, Preview, Development
3. Click **Save**
4. Go to **Deployments** → click **Redeploy** on the latest deployment

The build will run migrations and seed sample data automatically.
