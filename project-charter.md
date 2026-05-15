# Project Charter — CGSI E-Form

> Digital form signing system for CGSI. Dealer uploads pre-filled PDF → generates unique sign link → client opens link and signs → system overlays signature on PDF → downloads and auto-emails result.
>
> **Last updated:** 2026-05-16

---

## 1. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js App Router | 14.2.35 | Full-stack web framework |
| UI | React | 18.3.1 | Client-side rendering |
| CSS | Tailwind CSS + inline styles | 3.4.19 | Utility-first styling |
| PDF Generation | pdf-lib (+ @pdf-lib/fontkit) | 1.17.1 | Overlay text & signatures on PDF |
| PDF Text Search | pdfjs-dist | 4.0.379 | Find anchor text positions in PDF |
| PDF Server Render | canvas (node-canvas) | 3.2.3 | Server-side PDF page → PNG |
| Cloud Storage | @vercel/blob | 2.3.3 | Temporary PDF storage |
| Email | nodemailer (SMTP) | 6.9.16 | Send signed PDF as attachment |
| Signature Capture | signature_pad | 5.0.7 | Client-side canvas-based signature |
| Auth | HMAC-SHA256 (Web Crypto API) | — | HttpOnly cookie-based dealer auth |
| i18n | Custom dictionary (en/zh/bm) | — | Trilingual UI translation |
| Linting | ESLint + eslint-config-next | 8.57.1 | Code quality |
| PostCSS | autoprefixer + tailwindcss | 10.4.21 / 3.4.19 | CSS processing |
| Hosting | Vercel | — | Deployment platform |

---

## 2. Architecture Overview

```
src/
├── middleware.js                        # Edge-compatible auth guard (HMAC cookie)
├── app/
│   ├── page.js                          # / — Dealer home: template select, upload, generate link
│   ├── layout.js                        # Root layout: metadata + inline CSS design tokens
│   ├── globals.css                      # Tailwind directives + global styles
│   ├── login/page.js                    # /login — Dealer password login
│   ├── sign/page.js                     # /sign?d=<base64> — Client signature + submit
│   ├── success/page.js                  # /success — Download signed PDF, email status
│   ├── setup/page.js                    # /setup?t=<id> — Visual signature-box drawing tool
│   ├── fill/page.js                     # /fill?t=<id> — Legacy calibration tool
│   └── api/
│       ├── auth/login/route.js          # POST — Verify password, set HMAC cookie
│       ├── auth/logout/route.js         # POST — Clear auth cookie
│       ├── generate-pdf/route.js        # POST — Generate signed PDF + email
│       ├── store-pdf/route.js           # POST — Upload PDF to Vercel Blob
│       ├── preview-pdf/route.js         # POST — Generate preview PDF (no sigs)
│       └── render-pdf/route.js          # GET — Render PDF page as PNG
├── components/
│   ├── TemplateSelector.jsx             # 4 template radio-card grid
│   ├── DynamicForm.jsx                  # Render form fields from template definition
│   ├── FormPreview.jsx                  # Read-only preview of filled field data
│   ├── SignaturePad.jsx                 # Canvas-based signature capture (signature_pad)
│   └── LanguageSwitcher.jsx             # EN / 中文 / BM pill toggle
└── lib/
    ├── auth.js                          # HMAC-SHA256 cookie create/verify (Web Crypto)
    ├── templates.js                     # 4 form template definitions
    ├── i18n.js                          # Trilingual dictionary (~88 keys)
    ├── coordinates.js                   # Field coordinates + signature anchor configs
    ├── pdf-generator.js                 # PDF creation + signature overlay (pdf-lib)
    ├── pdf-search.js                    # Text-anchor search in PDF (pdfjs-dist)
    ├── mailer.js                        # Nodemailer SMTP sender
    ├── calibrate.mjs                    # CLI: extract text + coordinates from form PDFs
    └── render-pdf.mjs                   # CLI: render form PDF pages to PNG
```

---

## 3. Data Flow

### 3.1 Primary Flow (Upload & Sign)

```
Dealer                          Server                           Client
  │                                │                                │
  ├─ Visit / → redirect to /login  │                                │
  ├─ Enter shared password         │                                │
  │  POST /api/auth/login          │                                │
  │                                ├─ Verify password               │
  │                                ├─ Set cgsi-auth HMAC cookie     │
  │                                └─ Return { success: true }      │
  │                                │                                │
  ├─ Select template type          │                                │
  ├─ Fill form fields              │                                │
  ├─ Upload pre-filled PDF         │                                │
  │  POST /api/store-pdf           │                                │
  │                                ├─ Store PDF → Vercel Blob       │
  │                                ├─ Detect signature positions    │
  │                                └─ Return { blobUrl, sigCount }  │
  ├─ (Optional) /setup → draw      │                                │
  │   signature boxes on PDF       │                                │
  ├─ Enter recipient email(s)      │                                │
  ├─ Click "Generate Link"         │                                │
  │  (Base64 payload built         │                                │
  │   client-side, not stored)      │                                │
  │                                │                                │
  │  ─── send link to client ───────────────────────────────────────┤
  │                                │                                │
  │                                │      Open link /sign?d=<base64> │
  │                                │      Preview form data          │
  │                                │      Draw signature on canvas   │
  │                                │      Click Submit               │
  │                                │  POST /api/generate-pdf         │
  │                                ├─ Decode Base64 payload          │
  │                                ├─ Fetch PDF from Vercel Blob     │
  │                                ├─ Overlay signature(s) via pdf-lib│
  │                                ├─ Send email via Nodemailer SMTP │
  │                                └─ Return { pdfBase64, emailSent }│
  │                                │                                │
  │                                │      /success — download PDF    │
  │                                │      See email delivery status  │
```

### 3.2 Link Payload Structure

Base64-encoded JSON in URL parameter `?d=`:

```json
{
  "t": "client-info-update",
  "sigCount": 1,
  "blobUrl": "https://<blob-host>/pdf_1715772000000_a1b2",
  "x": 1747929600000,
  "e": "dealer@example.com",
  "sb": [{ "page": 0, "x": 87, "y": 181, "width": 146, "height": 50 }],
  "f": { "clientName": "John Doe", "cdsAccountNo": "12345" }
}
```

| Field | Required | Description |
|---|---|---|
| `t` | Yes | Template ID: `client-info-update` / `fen-declaration` / `change-of-dr` / `w8ben` |
| `sigCount` | Yes | Number of signature positions |
| `blobUrl` | Yes | Vercel Blob URL to the uploaded PDF |
| `x` | Yes | Expiry timestamp (epoch ms, 7 days from creation) |
| `e` | No | Recipient email(s) for signed PDF delivery |
| `sb` | No | Custom signature box positions (from /setup tool) |
| `f` | No | Pre-filled form data |

---

## 4. Storage & Data Model

### 4.1 Vercel Blob (server-side, temporary)

- **Key pattern:** `pdf_<timestamp>_<4 random alphanumeric chars>`
- **Access:** Public
- **Content type:** `application/pdf`
- **Lifecycle:** Uploaded via `/api/store-pdf`, referenced via blobUrl in sign links
- **No deletion mechanism** — files persist until manually removed or Vercel Blob retention policy applies

### 4.2 localStorage (browser, persistent)

| Key | Value | Set By |
|---|---|---|
| `cgsi-lang` | `"en"` / `"zh"` / `"bm"` | LanguageSwitcher |
| `cgsi-sig-boxes-{templateId}` | JSON array of `{page,x,y,width,height}` | /setup tool |
| `cgsi-pos-{templateId}` | JSON object of calibration field positions | /fill tool (legacy) |

### 4.3 sessionStorage (browser, per-tab)

| Key | Value | Set By |
|---|---|---|
| `cgsi-home-state` | Serialized home page state | / page (before navigating to /setup) |
| `cgsi-pdf-base64` | Generated PDF as base64 string | /sign page (after API response) |
| `cgsi-pdf-filename` | `{ShortName}_{ClientName}.pdf` | /sign page |
| `cgsi-pdf-emailSent` | `"true"` / `"false"` | /sign page |
| `cgsi-pdf-emailError` | Error message string (if email failed) | /sign page |

### 4.4 No Database

The system is intentionally **stateless**. There is no database, no Vercel KV, no persistent server-side storage. State travels exclusively via:
- URL parameters (Base64-encoded payload)
- Vercel Blob (temporary PDF storage)
- Browser localStorage/sessionStorage

---

## 5. Authentication System

**File:** `src/lib/auth.js` + `src/middleware.js`

- **Model:** Shared password (single `LOGIN_PASSWORD` env var)
- **Token:** HMAC-SHA256 signed cookie using Web Crypto API
- **Cookie name:** `cgsi-auth`
- **Cookie format:** `base64url(payload).base64url(signature)`
- **Cookie flags:** HttpOnly, SameSite=Lax, Path=/
- **Session duration:** 1 day (from `maxAge: 86400`)
- **No user accounts, no roles, no registration**

### Protected Routes (middleware)

| Path | Auth Required |
|---|---|
| `/` (home) | Yes |
| `/setup` | Yes |
| `/fill` | Yes |
| `/api/store-pdf` | Yes |
| `/login` | No |
| `/sign` | No |
| `/success` | No |
| `/api/generate-pdf` | No |
| `/api/preview-pdf` | No |
| `/api/render-pdf` | No |
| `/api/auth/login` | No |
| `/api/auth/logout` | No |

---

## 6. API Routes

| Method | Route | Runtime | Auth | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | nodejs | No | Verify password → set HMAC cookie |
| `POST` | `/api/auth/logout` | nodejs | No | Clear auth cookie |
| `POST` | `/api/store-pdf` | nodejs | Yes | Upload PDF → Vercel Blob, detect sig positions |
| `POST` | `/api/generate-pdf` | **nodejs** | No | Fetch PDF, overlay signatures, email |
| `POST` | `/api/preview-pdf` | nodejs | No | Generate preview PDF without signatures |
| `GET` | `/api/render-pdf` | nodejs | No | Render PDF page → PNG image |

### Critical Runtime Requirement

**`/api/generate-pdf` MUST use `export const runtime = 'nodejs'`** — nodemailer and pdf-lib do not work in Edge runtime. This is the single most important constraint in the entire project.

---

## 7. Form Templates

**File:** `src/lib/templates.js`

| ID | Display Name | Pages | Size | Default sigCount | Fields |
|---|---|---|---|---|---|
| `client-info-update` | Client Info Update Form | 2 | US Legal (612×1008pt) | 1 | 25 |
| `fen-declaration` | Individual FEN Declaration | 4 | A4 (595×842pt) | 2 | 4 |
| `change-of-dr` | Request for Change of DR | 1 | A4 (595×842pt) | 1 | 7 |
| `w8ben` | W-8BEN Form | 1 | US Letter (612×792pt) | 1 | 10 |

Each field definition: `{ key, labelKey, type: 'text'|'select'|'textarea', options?: string[] }`

---

## 8. Email Flow

**File:** `src/lib/mailer.js`

### Sender Configuration

All SMTP settings from environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURE` | `false` | Use TLS |
| `SMTP_USER` | — | SMTP auth username |
| `SMTP_PASS` | — | SMTP auth password (Gmail App Password) |
| `TO_EMAIL` | — | Default recipient (fallback) |

### Recipient Decision Logic

1. If `recipients` parameter is provided → use as "To" address
2. Otherwise → use `process.env.TO_EMAIL`

### Email Content

- **Subject:** `Signed Form: {filename}`
- **Body:** `Please find the signed form attached.`
- **Attachment:** PDF buffer, filename as provided

### Gmail Fallback Logic

On DNS/socket errors (EDNS, ENOTFOUND, ECONNREFUSED):
1. Try `smtp.gmail.com` first
2. Fall back to `smtp.googlemail.com`
3. Auth errors do NOT retry (to avoid account lockout)

### Non-Blocking Principle

Email failure MUST NOT block PDF generation. The API always returns:
```json
{
  "pdfBase64": "...",
  "emailSent": true|false,
  "emailError": "Error message if failed"
}
```

---

## 9. Signature Placement

**Files:** `src/lib/coordinates.js`, `src/lib/pdf-search.js`, `src/lib/pdf-generator.js`

### Priority Chain (ordered)

1. **Visual boxes** — user-drawn rectangles from `/setup` tool (`sb` in link payload, or `cgsi-sig-boxes-*` in localStorage)
2. **Text-anchor search** — `SIGNATURE_ANCHORS` in coordinates.js: search for text like "Sign Here", "Signature of Client" using pdfjs-dist, then apply offset
3. **Fallback coordinates** — hardcoded X/Y positions in SIGNATURE_ANCHORS, per template

### Signature Processing

- Client-side: white/light background removal via pixel manipulation
- Maintains anti-aliased edges with partial transparency
- Server-side: auto-scales signature PNG to fit target box while preserving aspect ratio
- **Single signature principle:** Client signs once; the same signature image is placed at ALL configured positions

---

## 10. Security Rules

1. **Link uniqueness:** Each sign link contains a random Vercel Blob path — not guessable or enumerable
2. **Link expiry:** 7-day expiry encoded in payload (`x` field), enforced client-side on sign page mount
3. **Payload integrity:** Tampering with `blobUrl` causes fetch failure on the server; no cryptographic signing needed
4. **No server-side authority:** No database to cross-reference — the link IS the authority. Template ID validated against known templates; PDF fetch success is the only server-side validation
5. **Input validation:** Template ID validated against known templates; PDF file validated for presence and type; form fields are best-effort (no required fields)
6. **Email in URL:** Recipient emails are plaintext in URL payload — acceptable for the dealer-client trust model
7. **HttpOnly auth cookie:** `cgsi-auth` cookie is HttpOnly, SameSite=Lax, preventing XSS-based theft
8. **No permanent data retention:** No database, no client data stored on server — Vercel Blob files are the only server-side state

## 11. Known Prohibitions (ABSOLUTE)

| # | Rule | Reason |
|---|---|---|
| 1 | **NEVER** send email from Edge runtime | nodemailer requires Node.js APIs |
| 2 | **NEVER** hardcode email addresses, API keys, or credentials | Security — use `.env` variables |
| 3 | **NEVER** modify test files to "make them pass" | Tests ARE the specification |
| 4 | **NEVER** commit `.env` files | Gitignored — contains secrets |
| 5 | **NEVER** introduce a database without explicit approval | Architecture is intentionally stateless |
| 6 | **NEVER** remove a signature fallback without replacing it | Backward compatibility |
| 7 | **NEVER** break backward compatibility of link payload | Old links must continue to work |
| 8 | **NEVER** block PDF generation on email failure | Email is non-blocking by design |

## 12. Internationalization (i18n)

**File:** `src/lib/i18n.js`

- 3 languages: `en` (English), `zh` (Simplified Chinese), `bm` (Bahasa Melayu)
- ~88 translation keys covering UI labels, field labels, form options
- `t(lang, key)` function with English fallback for missing keys
- Language preference stored in `localStorage.cgsi-lang`
- All new user-facing text MUST have en/zh/bm translations

## 13. Environment Variables (Complete)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `LOGIN_PASSWORD` | Yes | `change-me` | Shared dealer login password |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use TLS for SMTP |
| `SMTP_USER` | Yes* | — | SMTP authentication username |
| `SMTP_PASS` | Yes* | — | SMTP authentication password |
| `TO_EMAIL` | Yes* | — | Default recipient for signed PDFs |
| `BLOB_READ_WRITE_TOKEN` | Yes | — | Vercel Blob access (auto-set by Vercel) |
| `DASHSCOPE_API_KEY` | No | — | For vision.js CLI only |

*Required for email functionality; app works without them (email will fail gracefully).

## 14. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |
| `node src/lib/calibrate.mjs` | Extract text + coordinates from form PDFs |
| `node src/lib/render-pdf.mjs` | Render form PDF pages to PNG images |
| `node scripts/generate-premium-guide.mjs` | Generate marketing guide PDF |
