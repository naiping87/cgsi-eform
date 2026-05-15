# Project Charter — CGSI E-Form

> Digital form signing system. Dealer uploads pre-filled PDF → generates link → client signs → system overlays signature on PDF → emails result.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14.2.35 |
| Runtime | Node.js (server) / Browser (client) | — |
| Hosting | Vercel | — |
| PDF generation | `pdf-lib` | 1.17.1 |
| PDF text search | `pdfjs-dist` | 4.0.379 |
| Blob storage | `@vercel/blob` | 2.3.3 |
| Email | `nodemailer` (SMTP) | 6.9.16 |
| Signature drawing | `signature_pad` | 5.0.7 |
| CSS | Tailwind CSS (minimal) + inline styles | 3.4.19 |
| i18n | Custom dict: en / zh / bm | — |
| Linting | ESLint + `eslint-config-next` | 8.x |

## Architecture Overview

```
src/
├── app/
│   ├── page.js                    # Home: dealer selects template, uploads PDF, generates link
│   ├── layout.js                  # Root layout (metadata, inline CSS design tokens)
│   ├── globals.css                # Global styles
│   ├── sign/page.js               # Client signing page (opens from sign link)
│   ├── success/page.js            # Post-submit: download PDF, see email status
│   ├── setup/page.js              # Visual signature-box positioning tool
│   ├── fill/page.js               # Legacy calibration tool (click-to-place fields)
│   └── api/
│       ├── generate-pdf/route.js  # POST: generate signed PDF, email it
│       ├── store-pdf/route.js     # POST: upload PDF to Vercel Blob, detect sig positions
│       ├── preview-pdf/route.js   # POST: generate preview PDF for calibration
│       └── render-pdf/route.js    # GET:  render PDF page as PNG
├── components/
│   ├── TemplateSelector.jsx       # 4 template cards with icons
│   ├── SignaturePad.jsx           # Canvas-based signature drawing
│   ├── DynamicForm.jsx            # Renders form fields from template definition
│   ├── FormPreview.jsx            # Read-only preview of filled fields
│   └── LanguageSwitcher.jsx       # EN / 中文 / BM toggle
└── lib/
    ├── templates.js               # 4 form templates (fields, pages, sigCount)
    ├── i18n.js                    # Translation dictionary
    ├── mailer.js                  # Nodemailer SMTP sender
    ├── pdf-generator.js           # PDF creation + signature overlay (pdf-lib)
    ├── pdf-search.js              # Text-anchor search in PDF (pdfjs-dist)
    ├── coordinates.js             # Field coordinates + signature anchor configs
    ├── calibrate.mjs              # Calibration CLI helper
    └── render-pdf.mjs             # Server-side PDF→PNG CLI helper
```

## Data Flow

### Primary Flow (Upload)
```
Dealer                     Server                         Client
  │                          │                              │
  ├─ select template ────────┤                              │
  ├─ upload filled PDF ──────┤                              │
  │  POST /api/store-pdf      │                              │
  │                          ├─ store PDF → Vercel Blob     │
  │                          ├─ detect sig positions        │
  │                          └─ return blobUrl + sigCount   │
  │                          │                              │
  ├─ enter recipient email ───┤                              │
  ├─ click "Generate Link" ───┤                              │
  │  (payload built client-   │                              │
  │   side, not stored)       │                              │
  │                          │                              │
  │  ─── send link to client ────────────────────────────────┤
  │                          │                              │
  │                          │         open link /sign?d=... │
  │                          │         draw signature        │
  │                          │         click Submit          │
  │                          │  POST /api/generate-pdf       │
  │                          ├─ fetch PDF from Vercel Blob  │
  │                          ├─ overlay signature(s)        │
  │                          ├─ send email (nodemailer)     │
  │                          └─ return PDF base64           │
  │                          │         download / success   │
```

### Link Payload Structure
Base64-encoded JSON in URL parameter `?d=...`:
```json
{
  "t": "client-info-update",    // templateId (required)
  "sigCount": 2,                 // number of signatures needed
  "blobUrl": "https://...",     // Vercel Blob PDF URL
  "x": 1747929600000,           // expiry timestamp (Date.now() + 7 days)
  "e": "dealer@example.com",   // optional custom recipient email(s)
  "sb": [{ "page": 0, "x": 87, "y": 181, "width": 146, "height": 50 }],  // optional signature boxes
  "f": { "clientName": "..." } // optional form data
}
```

## API Routes

| Method | Route | Purpose | Runtime |
|---|---|---|---|
| `POST` | `/api/store-pdf` | Upload PDF → Vercel Blob, detect sig positions | nodejs |
| `POST` | `/api/generate-pdf` | Fetch PDF, add signatures, email | **nodejs** (nodemailer) |
| `POST` | `/api/preview-pdf` | Generate preview PDF with text fields | nodejs |
| `GET` | `/api/render-pdf` | Render PDF page → PNG | nodejs |

**Critical:** `/api/generate-pdf` MUST use `export const runtime = 'nodejs'` — nodemailer does not work in Edge runtime.

## Storage

### Vercel Blob
- Key pattern: `pdf_{timestamp}_{random4chars}`
- Access: `public`
- Content type: `application/pdf`
- Stores uploaded filled PDFs temporarily (referenced via blobUrl in sign links)

### localStorage (browser)
| Key | Value |
|---|---|
| `cgsi-lang` | Language preference: `"en"` / `"zh"` / `"bm"` |
| `cgsi-sig-boxes-{templateId}` | Signature box positions (JSON array) |
| `cgsi-pos-{templateId}` | Calibration field positions (JSON) |

### sessionStorage (browser)
| Key | Value |
|---|---|
| `cgsi-home-state` | Saved home page state when navigating to /setup |
| `cgsi-pdf-base64` | Generated PDF as base64 (pass to success page) |
| `cgsi-pdf-filename` | Generated filename |
| `cgsi-pdf-emailSent` | `"true"` / `"false"` |
| `cgsi-pdf-emailError` | Error message string |

**No database.** The system is intentionally stateless — all state passes through URL parameters or browser storage.

## Email Flow

```
generate-pdf API
  └─ sendPDFByEmail(pdfBuffer, filename, recipients)
       ├─ If recipients provided → use as "to" address
       ├─ Else → use process.env.TO_EMAIL
       ├─ SMTP config from env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
       ├─ Gmail fallback: try smtp.gmail.com → smtp.googlemail.com on DNS failure
       └─ Email subject: "Signed Form: {filename}"
```

**Email failure is non-blocking** — the API returns `emailSent: false` + `emailError` but still returns the PDF to the client.

## Templates

4 form types, each with blank PDF in `public/forms/`:

| ID | Name | Pages | Default sigCount |
|---|---|---|---|
| `client-info-update` | Client Info Update Form | 2 | 1 |
| `fen-declaration` | Individual FEN Declaration Form | 4 | 2 |
| `change-of-dr` | Request for Change of DR | 1 | 1 |
| `w8ben` | W-8BEN Form | 1 | 1 |

These sigCount values are **fallback defaults** — actual sigCount is determined by the number of boxes configured in the /setup tool, or passed via the link payload.

## Signature Placement

Priority chain:
1. **Visual boxes** (`sb` in payload / `cgsi-sig-boxes-*` in localStorage) — user-drawn rectangles on PDF
2. **Text-anchor search** (`SIGNATURE_ANCHORS` in coordinates.js) — search for text like "Sign Here"
3. **Fallback coordinates** — hardcoded X/Y in SIGNATURE_ANCHORS

Signature scaling: image is fit within the box, maintaining aspect ratio, centered.

## Security Rules

1. **Link uniqueness**: Each sign link contains a random blobUrl (Vercel Blob path), not guessable
2. **Link expiry**: 7-day expiry encoded in payload (`x` field), checked client-side AND on sign page mount
3. **Payload integrity**: Base64-encoded JSON in URL — not cryptographically signed, but tampering with `blobUrl` would fail to fetch
4. **No server-side state**: The system validates nothing server-side beyond template existence and PDF fetch success — the link IS the authority
5. **Input validation**: Template ID validated against known templates; PDF file validated for presence and type
6. **Email addresses**: Passed as plaintext in URL payload — acceptable for dealer-client trust model
7. **No authentication**: No user accounts or login — design decision for simplicity

## Known Prohibitions

1. **NEVER** send email from Edge runtime — MUST use `export const runtime = 'nodejs'` in `/api/generate-pdf`
2. **NEVER** hardcode email addresses or API keys — use `.env` variables
3. **NEVER** modify test files to "make them pass" — tests ARE the specification
4. **NEVER** commit `.env` files — they are gitignored

## Dependencies Added During Evolution

| Feature | Dependency | Purpose |
|---|---|---|
| Visual signature boxes | (none) | Built on existing pdfjs-dist canvas rendering |
| Custom email forwarding | (none) | Extended existing mailer.js |
| i18n (en/zh/bm) | (none) | Custom dictionary module |
