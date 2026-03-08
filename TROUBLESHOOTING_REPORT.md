# GrievanceRouter – Troubleshooting Report

**Date:** March 8, 2026  
**Project:** dev dynamics (Grievance Router & SLA Engine)

---

## Executive Summary

The web app fails to open due to **port conflicts** and **server startup issues**. This report lists root causes, fixes, and how to run the app reliably.

---

## Issue 1: Port 3002 Already in Use (EADDRINUSE)

### What You See
```
⨯ Failed to start server
Error: listen EADDRINUSE: address already in use :::3002
```

### Root Cause
Another process (often a previous `npm run dev`) is still using port 3002. Starting a new dev server fails because the port is occupied.

### Fix (Windows PowerShell)

**Step 1 – Find the process:**
```powershell
netstat -ano | findstr :3002
```

**Step 2 – Kill it (replace `<PID>` with the number from the output):**
```powershell
taskkill /PID <PID> /F
```

**Step 3 – Start the app:**
```powershell
cd "c:\Users\gonga\OneDrive\Documents\dev dynamics"
npm run dev
```

### Alternative: Use a Different Port

If you prefer not to kill the process, run on port 3003:
```powershell
npx next dev -p 3003
```
Then open: **http://localhost:3003**

---

## Issue 2: Blue / Blank Page When Opening Website

### What You See
- Blue or blank page instead of the app
- Sometimes a large blue shield icon on white

### Root Causes

| Cause | Explanation |
|-------|-------------|
| **No server running** | If `EADDRINUSE` stops the server, nothing is served. The browser shows a blank or default page. |
| **Wrong URL** | Use `http://localhost:3002` (port **3002**, not 30002 or 3000). |
| **Stale cache** | Old JS/CSS can cause blank or broken pages. |
| **Next.js default favicon** | When the app fails to load, the default favicon (blue shield) can appear. |

### Fixes Applied in Code

1. **Critical CSS in layout** – Dark background (`#0f172a`) loads immediately.
2. **Suspense fallback** – Shows "GrievanceRouter" and a spinner while loading.
3. **Inline styles** – Fallback background so the page is never plain white.

---

## Issue 3: Chunk Loading Failed (Dashboard / Supervisor / Worker)

### What You Saw
```
Loading chunk ... DashboardContent_tsx failed.
(error: http://localhost:3002/_next/undefined)
```

### Root Cause
Dynamic imports (`next/dynamic`) were generating invalid chunk URLs (e.g. `undefined` in the path), often due to:
- Project path with spaces (`dev dynamics`)
- Webpack chunk naming issues

### Fix Applied
Dynamic imports were replaced with regular imports. Components are now bundled with the page, so no separate chunk loading.

---

## Project Structure & Configuration

### Port Configuration
- **Dev:** `npm run dev` → port **3002**
- **Production:** `npm start` → port **3002**

### Key Files
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, dark theme, loading fallback |
| `src/components/AppShell.tsx` | Nav, providers, error boundary |
| `src/app/page.tsx` | Home (Citizen) |
| `src/app/dashboard/page.tsx` | Dashboard |
| `src/app/supervisor/page.tsx` | Supervisor queue |
| `src/app/worker/page.tsx` | Worker tasks |
| `src/middleware.ts` | Auth (currently disabled) |

### Dependencies
- Next.js 14.2.18
- React 18
- NextAuth, Prisma, Recharts, Leaflet

---

## Recommended Startup Procedure

1. **Close all terminals** that might have `npm run dev` running.

2. **Open a new terminal** and run:
   ```powershell
   cd "c:\Users\gonga\OneDrive\Documents\dev dynamics"
   npm run dev
   ```

3. **Wait for:**
   ```
   ▲ Next.js 14.2.18
   - Local: http://localhost:3002
   ✓ Ready in ...
   ```

4. **Open in browser:** http://localhost:3002

5. **If port is in use:** Run `netstat -ano | findstr :3002`, then `taskkill /PID <PID> /F`, and try again.

---

## Quick Reference: Common Errors

| Error | Fix |
|-------|-----|
| `EADDRINUSE: address already in use :::3002` | Kill the process using port 3002 (see Issue 1). |
| Blue/blank page | Ensure server is running and use http://localhost:3002. |
| Chunk loading failed | Fixed by using regular imports instead of dynamic. |
| White page | Critical CSS and inline styles added for dark background. |

---

## Summary

1. **Port conflict** – Stop the process on port 3002 before starting the dev server.
2. **Blue/blank page** – Usually caused by no server or wrong URL; layout and fallbacks are in place.
3. **Chunk errors** – Resolved by removing dynamic imports for Dashboard, Supervisor, and Worker.

Follow the **Recommended Startup Procedure** above for a reliable run.
