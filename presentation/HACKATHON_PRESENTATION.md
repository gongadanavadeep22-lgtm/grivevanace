---
marp: true
theme: default
paginate: true
backgroundColor: #0a0a0a
color: #e8e8e8
style: |
  section { font-family: system-ui, sans-serif; }
  h1, h2 { color: #c0c0c0; text-shadow: 0 0 12px rgba(192,192,192,0.3); }
  strong { color: #ffffff; }
---

<!-- _class: lead -->
# AI-Powered Grievance Router
## Making citizen complaints accessible to everyone

**SLA Accountability Engine**

---

# The Problem

- **Literacy barrier**: Many citizens cannot write complaints clearly
- **Complex process**: People don't know which department handles what
- **No visibility**: Citizens can't track if their complaint is being addressed
- **SLA gaps**: No accountability for resolution timelines

---

# Our Solution

**AI-Powered Grievance Router** — A smart system that:

1. **Accepts complaints in any form** — text, voice, or **just a photo**
2. **AI routes** complaints to the right department automatically
3. **SLA tracking** ensures accountability and timely resolution
4. **Live worker location** — citizens see when help is on the way

---

# Key Innovation: Photo → AI Writes the Complaint

**Problem**: Illiterate or semi-literate citizens struggle to describe issues in words.

**Solution**: User uploads a **photo** → AI scans it → **AI writes the grievance** for them.

| User uploads | AI generates |
|--------------|--------------|
| Photo of pothole | *"Large pothole on main road causing accidents. Needs urgent repair."* |
| Photo of broken pipe | *"Water pipe burst, no supply. Request urgent repair."* |
| Photo of garbage heap | *"Garbage not collected. Health risk. Request sanitation."* |

**No typing needed.** Just click, upload, submit.

---

# How It Works (Photo Flow)

```
1. User clicks "File Grievance"
2. User uploads PHOTO (no typing)
3. AI scans photo → generates complaint text
4. User sees: "AI wrote this from your photo"
5. User can edit or submit as-is
6. AI classifies → routes to department
7. Citizen gets ticket ID → tracks status
```

---

# Features Overview

| Feature | Description |
|---------|-------------|
| **Photo-to-text** | AI writes grievance from uploaded image |
| **Voice input** | Speak your complaint — speech to text |
| **AI classification** | Auto-routes to Water, Roads, Sanitation |
| **SLA engine** | Due dates, breach alerts, accountability |
| **Worker live map** | See field worker en route to incident |
| **Multi-language** | English, Hindi, Tamil, Telugu |
| **Dashboard** | Real-time stats, breach tracking |

---

# Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **AI**: Google Gemini (Vision + Text)
- **Database**: SQLite / Prisma (PostgreSQL-ready)
- **Auth**: NextAuth.js (Citizen, Worker, Supervisor roles)
- **Maps**: Leaflet (worker live location)
- **Charts**: Recharts (dashboard analytics)

---

# User Roles

| Role | Access |
|------|--------|
| **Citizen** | Submit grievance, track status (no login) |
| **Worker** | My tasks, update status, mark resolved |
| **Supervisor** | Queue, assign tickets, breach list, map view |
| **Admin** | Dashboard, SLA rules, analytics |

---

# Demo Flow

1. **Submit**: Upload photo of pothole → AI writes complaint → Submit
2. **Track**: Enter ticket ID → See status, ETA, worker on map
3. **Supervisor**: Assign to worker → Worker updates status
4. **Dashboard**: View breaches, SLA %, department stats

---

# Impact

- **Accessibility**: Illiterate citizens can file complaints with just a photo
- **Efficiency**: AI routes instantly — no manual triage
- **Accountability**: SLA ensures departments respond on time
- **Transparency**: Citizens see worker location and ETA
- **Scalability**: Works for any municipality or government body

---

# Thank You

## AI-Powered Grievance Router
### Making every voice heard — with or without words

**Questions?**
