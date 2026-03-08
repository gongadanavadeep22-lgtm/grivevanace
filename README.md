# AI-Powered Grievance Router & SLA Accountability Engine

Web application for public service grievance submission, AI-powered routing, and SLA tracking.

## Setup

1. Create a **PostgreSQL** database (Neon, Vercel Postgres, or Supabase free tier).
2. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://...
   ```
3. Run:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

Open [http://localhost:3002](http://localhost:3002).

## Deploy to Vercel

See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions.

## Photo analysis (local or cloud)

Photo-to-text uses **Ollama** (local) first, then **Gemini** (cloud) as fallback:

- **Local (recommended)**: Install [Ollama](https://ollama.com), run `ollama run llava`, then add to `.env.local`:
  ```
  OLLAMA_BASE_URL=http://localhost:11434
  OLLAMA_VISION_MODEL=llava
  ```
- **Cloud fallback**: Add `GEMINI_API_KEY` to `.env.local` for when Ollama is not running.

## Features

- **Citizens**: Submit grievance (description, location, optional photo), get ticket ID, track status by ticket ID.
- **AI classification**: Description is classified into department/category/urgency (keyword-based MVP).
- **SLA**: Each ticket gets a due date from configurable rules; dashboard and supervisor see breaches.
- **Supervisor**: Queue view, breach list, at-risk list, assign tickets to workers.
- **Workers**: My tasks, update status (in progress / pending dependency / resolved).
- **Dashboard**: Open/closed counts, SLA %, by-department stats, recent open tickets.

## Seed data

- SLA rules for water, roads, sanitation, general.
- Sample workers (water, roads, sanitation).
