# Build Notes

## Vercel (recommended)
Build runs on Linux. Add `DATABASE_URL` (Postgres from Neon/Supabase) in Vercel env vars. Build will succeed.

## Local (Windows + OneDrive)
If you see `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`:
- **Option A**: Move the project outside OneDrive (e.g. `C:\dev\`)
- **Option B**: Pause OneDrive sync, close VS Code/terminals, then run `npm run build`
- **Option C**: Exclude `node_modules` from OneDrive sync
