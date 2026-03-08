# How to Get PowerPoint from This Presentation

## Ready to use

**Grievance_Router_Presentation.pptx** is already generated in this folder. Open it in PowerPoint.

---

## Option 1: Marp (Re-generate if needed)

1. **Install Marp CLI** (one-time):
   ```bash
   npm install -g @marp-team/marp-cli
   ```

2. **Convert to PowerPoint**:
   ```bash
   cd "C:\Users\gonga\OneDrive\Documents\dev dynamics\presentation"
   marp HACKATHON_PRESENTATION.md --pptx -o Grievance_Router_Presentation.pptx
   ```

3. Open `Grievance_Router_Presentation.pptx` in PowerPoint.

---

## Option 2: VS Code Marp Extension

1. Install **Marp for VS Code** extension
2. Open `HACKATHON_PRESENTATION.md`
3. Click "Export slide deck" → Choose **PPTX**
4. Save the file

---

## Option 3: Copy-Paste into PowerPoint (No tools)

Open `SLIDES_CONTENT.txt` — it has each slide's content. Copy each section into a new PowerPoint slide manually.

---

## Option 4: Export to PDF (then open in PowerPoint)

```bash
marp HACKATHON_PRESENTATION.md --pdf -o Grievance_Router.pdf
```

You can then import the PDF into PowerPoint or present the PDF directly.
