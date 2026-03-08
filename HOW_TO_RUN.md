# How to open the app (fix blank / white page)

## Correct URL

- **Use:** `http://localhost:3002`
- **Port is 3002** (four digits), **not** 30002 (five digits).

If you open `http://localhost:30002` you get the wrong port and a blank or error page.

---

## Steps every time

1. **Open a terminal** in the project folder.

2. **Run:**
   ```bash
   cd "c:\Users\gonga\OneDrive\Documents\dev dynamics"
   npm run dev
   ```

3. **Wait** until you see:
   ```
   - Local: http://localhost:3002
   Ready in ...
   ```

4. **In your browser, open exactly:**  
   **http://localhost:3002**

5. **If you see a white or blank page:**
   - Do a **hard refresh:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac).
   - Make sure the address bar says **localhost:3002** (not 3000 or 30002).
   - **Clear cache:** Stop the dev server (Ctrl+C), delete the `.next` folder, run `npm run dev` again.
   - **Try Chrome/Edge:** Open the URL in a regular browser instead of Cursor's embedded tab.

6. **If it still doesn’t work:**  
   Press **F12** → open the **Console** tab → look for **red** errors and fix or share them.

---

## Why errors kept happening (root causes)

| Problem | Cause | Fix |
|--------|--------|-----|
| White/blank page | Wrong port (e.g. 30002) or cache | Use **http://localhost:3002** and hard refresh |
| “Address already in use” | Port 3000 or 3001 taken | App is set to use **3002**; run `npm run dev` |
| Dashboard/nothing on click | Auth was blocking; client nav + redirect | Auth is off; all links work without login |
| “Page isn’t working” | Dev server not running | Run `npm run dev` then open http://localhost:3002 |

**Single source of truth:** Run `npm run dev`, then open **http://localhost:3002** in the browser.
