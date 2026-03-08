# Why Errors Happened and How They Were Fixed

This doc explains **root causes** so the same issues don’t come back.

---

## 1. "Clicking Dashboard does nothing" / Dashboard not opening

**Root cause:**  
Dashboard, Supervisor, and Worker were using Next.js `<Link>`, which does **client-side navigation**. When you’re not logged in, the server (middleware) correctly returns a **302 redirect to /login**. The client-side router, however, doesn’t always handle that redirect: it can leave the URL and screen unchanged, so it looks like “nothing happens”.

**Fix:**  
Use normal HTML links (`<a href="...">`) for **protected** routes (Dashboard, Supervisor, Worker) in the nav. Clicking them triggers a **full page load**. The browser then:

- Requests `/dashboard` (or `/supervisor`, `/worker`)
- Middleware runs and either allows access (if logged in) or redirects to `/login`
- The browser follows the redirect and shows the login page

So: **protected nav items = `<a href>`**, Citizen (home) stays `<Link>`.

---

## 2. Sign-in not working / "Invalid email or password" with correct credentials

**Root cause:**  
NextAuth’s **Credentials** flow (with `signIn("credentials", ...)`) was not reliably setting the session cookie in this App Router setup (known quirk with Credentials + App Router).

**Fix:**  
Custom login flow:

- **`POST /api/login`** checks email/password and, if valid, sets the **same** `next-auth.session-token` cookie (using NextAuth’s `encode()`).
- Login form uses a **normal form POST** to `/api/login`; server responds with a **redirect** to `/dashboard` (or `callbackUrl`) and `Set-Cookie`. Full page navigation ensures the cookie is applied before the next request.
- Middleware and `useSession()` still use the same cookie, so auth stays consistent.

---

## 3. Session cookie not seen by middleware / Dashboard redirects to login after sign-in

**Root cause:**  
Either the cookie wasn’t set on the right response, or middleware was looking for a different cookie name.

**Fix:**  
- Login uses **form POST + server redirect** so the browser gets `Set-Cookie` and then navigates in one flow.
- Middleware calls `getToken(..., cookieName: "next-auth.session-token")` so it explicitly uses the same name as `/api/login`.

---

## 4. White page / "Cannot find module './276.js'" / Recharts server errors

**Root cause:**  
- **White page:** JS error during hydration or a chunk (e.g. Recharts) failing to load.
- **276.js:** Stale or broken webpack chunks in `.next` (e.g. after changes or bad cache).
- **Recharts:** It’s client-only; importing it in code that runs on the server causes errors.

**Fix:**  
- Use **`dynamic(..., { ssr: false })`** for any component that imports Recharts (e.g. dashboard charts).
- Use a **`ClientOnly`** wrapper where needed so heavy/client-only UI only runs after mount.
- When things break after big changes or odd errors: **delete `.next`** and run `npm run build` or `npm run dev` again.

---

## 5. "Application error: Cannot read properties of null (reading 'get')"

**Root cause:**  
`useSearchParams()` can be `null` in some cases; calling `.get()` on it throws.

**Fix:**  
- Login no longer uses `useSearchParams()`; it reads `callbackUrl` from `window.location.search` in `useEffect`.
- Middleware wraps `getToken()` in try/catch so a bad cookie or decode doesn’t crash the app.

---

## Summary table

| Symptom | Cause | Fix |
|--------|--------|-----|
| Dashboard click does nothing | Client-side `Link` + middleware redirect not handled by router | Use `<a href>` for Dashboard, Supervisor, Worker in nav |
| Sign-in fails with correct credentials | NextAuth Credentials + App Router not setting cookie | Custom `/api/login` + form POST + redirect |
| Logged in but still sent to login | Cookie not set or wrong name in middleware | Form POST login + `cookieName` in `getToken()` |
| White page / chunk errors | Recharts or client-only code on server / stale build | `dynamic(..., { ssr: false })`, `ClientOnly`, clean `.next` |
| null.get / searchParams | `useSearchParams()` null or middleware throw | Avoid `useSearchParams()` for callbackUrl; try/catch in middleware |

Keeping these in mind (and not mixing client-only code with server routes, and using full-page links for protected routes) prevents these errors from repeating.
