# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm start        # Start production server
```

## Architecture

Next.js 14 App Router project for digital form signing. Dealer uploads a pre-filled PDF, generates a link, client signs, system adds signature to PDF and emails it.

### Core Flow
1. **Home page** (`src/app/page.js`) — Dealer selects template, uploads filled PDF → stored in Vercel Blob → generates short link with blob URL
2. **Sign page** (`src/app/sign/page.js`) — Client opens link, signs on SignaturePad, submits
3. **API** (`src/app/api/generate-pdf/route.js`) — Fetches PDF from blob URL, adds signatures using anchor-based positioning, emails result
4. **Success page** (`src/app/success/page.js`) — Download signed PDF

### PDF Signature Placement
- `src/lib/coordinates.js` — `SIGNATURE_ANCHORS` defines text anchors + offsets per template
- `src/lib/pdf-search.js` — Searches PDF text for anchors (e.g. "Sign Here") using pdfjs-dist
- `src/lib/pdf-generator.js` — `addSignaturesToPdf()` loads uploaded PDF, finds anchor positions, overlays signature PNGs

### Storage
- Vercel Blob (`@vercel/blob`) for persistent PDF storage
- `src/app/api/store-pdf/route.js` — Uploads PDF to Blob, returns URL + detected signature positions

### Email
- `src/lib/mailer.js` — Nodemailer SMTP, configured via `.env` vars
- Gmail requires App Password; falls back to `smtp.googlemail.com` on DNS failure

### Templates
- `src/lib/templates.js` — Form definitions (fields, pages, sigCount)
- `public/forms/*.pdf` — Blank form templates (used only as fallback)
- `src/lib/i18n.js` — EN/ZH/BM translations

### Key Dependencies
- `pdf-lib` — PDF manipulation (add text/signatures)
- `pdfjs-dist` — PDF text search for anchor detection
- `signature_pad` — Client-side signature drawing on canvas
- `nodemailer` — Email sending
