# Grievance Router & SLA Engine — Project Info

## Why was the dashboard (and supervisor/worker) failing?

**Error:** "This page isn't working — localhost is currently unable to handle this request."

**Root cause:** The **recharts** library is **client-only** (it needs the browser DOM). Those pages imported recharts at the top level. When Next.js tried to **serve** the route (e.g. `/dashboard`), it had to load and run that code on the **server**. That led to:

1. Server trying to run recharts in Node → crash or invalid response  
2. Or webpack generating chunk files (e.g. `276.js`) that the server then failed to load (e.g. path with space in "dev dynamics", or stale cache)

So the **server** was sending an invalid or empty response → browser showed "unable to handle this request."

**Fix applied:**  
- Recharts is only used inside components that are loaded with **`dynamic(..., { ssr: false })`** (no server render).  
- Those components are wrapped in **`ClientOnly`** so the server never renders them.  
- Each route has **`loading.tsx`** so the server can respond immediately with a loading state.  
- Result: server only sends light HTML/JS; charts run only in the browser.

---

## Database — did we create one? Which one?

**Yes.** The app uses a **database**.

- **Type:** **SQLite** (file-based, no separate server).
- **Path:** `prisma/dev.db` (created when you run `npx prisma db push`).
- **ORM:** **Prisma** (`prisma/schema.prisma`).

**Models:**  
- **SlaRule** — department, category, hours to resolve  
- **Grievance** — ticketId, description, department, category, location, status, slaDueAt, assignedTo, etc.  
- **GrievanceHistory** — status changes and notes  
- **Worker** — name, email, department, role  

**Commands:**  
```bash
npx prisma generate   # Generate client
npx prisma db push    # Create/update SQLite DB
npx prisma db seed    # Seed SLA rules and sample workers
```

For production you can switch to **PostgreSQL** or **MySQL** by changing the `datasource` in `schema.prisma` and setting `DATABASE_URL` in the environment.

---

## External APIs and AI integration

**Useful external APIs:**

| Purpose | Suggestion |
|--------|------------|
| **Maps** | Google Maps / Mapbox / OpenStreetMap — show complaints on a real map with lat/long (e.g. geocode location text). |
| **SMS/WhatsApp** | Twilio, MSG91, or official WhatsApp Business API — send ticket ID and status updates to citizens. |
| **Email** | SendGrid, Resend, or Nodemailer + SMTP — acknowledgements and status emails. |
| **Translation** | Google Translate API or LibreTranslate — auto-translate grievance text for multi-language support. |
| **Geocoding** | Google Geocoding / OpenStreetMap Nominatim — convert "Sector 5, Ward 3" to coordinates for map view. |

**AI integration (to make the site “more working” and smarter):**

| Feature | How to integrate |
|--------|-------------------|
| **Smarter classification** | Replace keyword-based `classify.ts` with **OpenAI** or **Google Vertex AI** — pass description (and optional image) and get department/category/urgency. |
| **Duplicate detection** | Use embeddings (OpenAI or sentence-transformers) + similarity search to link new complaints to existing open ones. |
| **Sentiment / risk** | Use an NLP or sentiment API to flag high-emotion or viral-risk complaints for priority. |
| **Chatbot** | Add a small **RAG** or FAQ bot (e.g. with OpenAI API or a small model) to answer “how to file?”, “what’s my status?” in natural language. |
| **Voice-to-text** | Already using browser **Web Speech API**; for server-side or better accuracy, use **Google Speech-to-Text** or **Whisper API** and send audio from the form. |

You don’t *have* to connect external APIs for the app to run; they improve UX (maps, notifications, AI classification, chatbot).

---

## Authentication — user login, workers, supervisors

**Do we need auth?**  
Yes, for a **working** and secure app: citizens can stay anonymous for *submitting*, but **workers and supervisors** should log in so only they can assign tickets, change status, and see internal data.

**Separate auth for workers vs supervisors?**  
**No.** Use **one auth system** with **roles**:

- **One user table** (or use NextAuth/Clerk with a `role` field).  
- **Roles:** e.g. `citizen` (optional), `worker`, `supervisor`, `admin`.  
- **Same login flow**; after login, redirect by role (e.g. worker → `/worker`, supervisor → `/supervisor`, admin → `/dashboard`).  
- **API routes** check `session.role` and allow/deny (e.g. only `supervisor` can call `/api/supervisor/assign`).

**Suggested stack:**  
- **NextAuth.js** (or **Clerk**) with credentials or OAuth.  
- Store `role` in the session (or in the DB and load with the user).  
- Protect `/dashboard`, `/supervisor`, `/worker` (and their APIs) so only allowed roles can access them.

**Citizens:**  
- Can stay **unauthenticated** for submit and status check (by ticket ID).  
- Optional: allow “my complaints” by logging in (e.g. with phone/email OTP).

---

## Working web application with AI

To have a **fully working** site with AI:

1. **Auth** — NextAuth/Clerk with roles (worker, supervisor, admin); protect internal pages and APIs.  
2. **Database** — Already there (SQLite/Prisma); switch to PostgreSQL for production if needed.  
3. **AI** — Use OpenAI (or another provider) for: classification, duplicate detection, optional chatbot; keep voice-to-text (browser or Whisper) for realism.  
4. **External APIs** — Add at least one of: SMS/email (notifications), maps (geocode + show zones), and optionally translation.  
5. **Fix dashboard/supervisor/worker** — Already done with dynamic + ClientOnly + loading; keep recharts and heavy UI client-only.

If you tell me your preferred auth (NextAuth vs Clerk) and which AI API you have (e.g. OpenAI key), I can outline exact steps or code for those parts.
