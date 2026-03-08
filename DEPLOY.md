# Deploy to Vercel

## Quick Checklist

- [ ] Create Postgres database (Neon / Vercel Postgres / Supabase)
- [ ] Add DATABASE_URL, AUTH_SECRET to Vercel env vars
- [ ] Push code to GitHub
- [ ] Import repo in Vercel
- [ ] Run `prisma db push` and `db:seed` with production DATABASE_URL

## Before You Push

1. **Database**: Use **PostgreSQL** (SQLite does not work on Vercel):
   - [Neon](https://neon.tech) (free tier)
   - [Vercel Postgres](https://vercel.com/storage/postgres)
   - [Supabase](https://supabase.com) (free tier)

2. **Get your `DATABASE_URL`** (Postgres connection string) and add it to Vercel env vars.

3. **Run migrations locally first** (with your Postgres URL in `.env.local`):
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   npm run db:seed
   ```

## Vercel Setup

1. Push your code to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add **Environment Variables** in Vercel project settings:

   | Variable        | Value                    | Notes                          |
   |-----------------|--------------------------|--------------------------------|
   | `DATABASE_URL`  | `postgresql://...`       | **Required** – from Neon/Vercel/Supabase |
   | `AUTH_SECRET`   | random string            | Run: `openssl rand -base64 32` |
   | `NEXTAUTH_URL`  | `https://your-app.vercel.app` | Vercel sets this automatically |
   | `GEMINI_API_KEY`| your key                 | Optional – for AI classification |

4. Deploy. Vercel will run `prisma generate`, `prisma migrate deploy`, and `next build`.

## Post-Deploy

- Run `prisma db push` and `db:seed` against your production `DATABASE_URL` if the DB is empty.
- Or use `prisma migrate deploy` if you add migrations later.
