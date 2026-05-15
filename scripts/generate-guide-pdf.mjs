import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'public', 'CGSI_E-Form_Guide.pdf');

const W = 595; // A4 width in pt
const H = 842; // A4 height in pt
const M = 50;  // margin
const accent = rgb(0.388, 0.447, 0.922);  // indigo-400
const dark = rgb(0.09, 0.09, 0.15);
const gray = rgb(0.4, 0.4, 0.5);
const white = rgb(1, 1, 1);
const lightBg = rgb(0.96, 0.96, 0.98);

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pages = [];
  function newPage() {
    const p = doc.addPage([W, H]);
    pages.push(p);
    return p;
  }

  function drawHeader(page, title) {
    page.drawRectangle({ x: 0, y: H - 60, width: W, height: 60, color: dark });
    page.drawText('CGSI E-Form', { x: M, y: H - 42, size: 16, font: bold, color: white });
    page.drawText(title, { x: M, y: H - 62, size: 10, font, color: accent });
    // bottom accent line
    page.drawRectangle({ x: 0, y: H - 64, width: W, height: 3, color: accent });
  }

  function drawFooter(page, num) {
    page.drawText(`Page ${num}`, { x: W / 2 - 25, y: 20, size: 8, font, color: gray });
  }

  function drawPara(page, text, x, y, { size = 10, color: c = dark, width: w = W - M * 2 } = {}) {
    const lines = wrapText(text, font, size, w);
    lines.forEach((line, i) => {
      page.drawText(line, { x, y: y - i * (size * 1.5), size, font, color: c });
    });
    return y - lines.length * size * 1.5;
  }

  function drawBullet(page, items, x, y, size = 10) {
    let cy = y;
    for (const item of items) {
      page.drawText('-', { x, y: cy, size, font: bold, color: accent });
      const lines = wrapText(item, font, size, W - M * 2 - 20);
      page.drawText(lines[0], { x: x + 16, y: cy, size, font, color: dark });
      for (let i = 1; i < lines.length; i++) {
        cy -= size * 1.5;
        page.drawText(lines[i], { x: x + 16, y: cy, size, font, color: dark });
      }
      cy -= size * 2;
    }
    return cy;
  }

  // ========== PAGE 1: COVER ==========
  const p1 = newPage();
  p1.drawRectangle({ x: 0, y: 0, width: W, height: H, color: dark });
  p1.drawRectangle({ x: 0, y: H / 2 - 80, width: W, height: 160, color: accent });

  p1.drawText('CGSI', { x: M, y: H / 2 + 30, size: 52, font: bold, color: white });
  p1.drawText('E-Form', { x: M + 130, y: H / 2 + 30, size: 52, font, color: white });
  p1.drawText('Digital Signature Platform', { x: M, y: H / 2 - 20, size: 14, font, color: white });

  p1.drawText('Professional PDF Signing', { x: M, y: H / 2 - 100, size: 18, font: bold, color: white });
  p1.drawText('Upload · Sign · Email · Done', { x: M, y: H / 2 - 122, size: 13, font, color: accent });

  p1.drawText('Built for Securities & Financial Services', { x: M, y: 80, size: 11, font, color: gray });
  p1.drawText('Powered by Next.js · Vercel · Cloud Storage', { x: M, y: 64, size: 9, font, color: gray });

  // ========== PAGE 2: OVERVIEW ==========
  const p2 = newPage();
  drawHeader(p2, 'Product Overview');
  let y = H - 100;

  y = drawPara(p2, 'What is CGSI E-Form?', M, y, { size: 18, color: accent });
  y -= 8;
  y = drawPara(p2, 'CGSI E-Form is a digital form signing platform designed specifically for securities dealers and financial services professionals. It eliminates the need for physical paperwork by allowing dealers to upload pre-filled PDF forms, generate secure signing links for clients, and automatically overlay signatures onto the correct positions — all without installing any software.', M, y, { size: 11 });

  y -= 16;
  y = drawPara(p2, 'Key Benefits', M, y, { size: 16, color: accent });
  y -= 4;
  y = drawBullet(p2, [
    'No app installation — clients sign directly in their browser',
    'Professional PDF output with signatures perfectly placed',
    'Automatic email delivery of signed documents',
    'Multi-language support: English, Chinese, Malay',
    'Visual signature positioning — draw boxes on the PDF',
    '7-day expiry links for security',
    'Works on desktop, tablet, and mobile',
  ], M, y, 11);

  y -= 16;
  y = drawPara(p2, 'Supported Forms', M, y, { size: 16, color: accent });
  y -= 4;
  y = drawBullet(p2, [
    'Client Info Update Form (2 pages)',
    'Individual FEN Declaration Form (4 pages)',
    'Request for Change of DR (1 page)',
    'W-8BEN Form (1 page)',
    'Custom forms can be added on request',
  ], M, y, 11);

  drawFooter(p2, 2);

  // ========== PAGE 3: HOW IT WORKS ==========
  const p3 = newPage();
  drawHeader(p3, 'How It Works');
  y = H - 100;

  const steps = [
    { title: 'Step 1 — Select & Upload', desc: 'The dealer selects a form template and uploads the pre-filled PDF. The system stores it securely in the cloud.' },
    { title: 'Step 2 — Position Signatures', desc: 'Using the visual Setup tool, the dealer draws rectangles on the PDF pages where signatures should appear. No coding or coordinates needed.' },
    { title: 'Step 3 — Generate Link', desc: 'The dealer optionally enters a recipient email, then clicks "Generate Link." A unique, expiring link is created.' },
    { title: 'Step 4 — Client Signs', desc: 'The client opens the link on any device, draws their signature on the canvas pad, and clicks Submit. One signature covers all positions.' },
    { title: 'Step 5 — Delivery', desc: 'The system overlays the signature onto the PDF at all marked positions, emails the signed PDF to the specified recipient, and provides a download.' },
  ];

  for (const step of steps) {
    y = drawPara(p3, step.title, M, y, { size: 14, color: accent });
    y = drawPara(p3, step.desc, M + 10, y, { size: 10 });
    y -= 8;
    p3.drawText('|', { x: M + 5, y: y + 8, size: 8, font, color: accent });
    p3.drawText('|', { x: M + 5, y: y + 3, size: 8, font, color: accent });
    p3.drawText('V', { x: M + 4, y: y - 4, size: 8, font, color: accent });
    y -= 14;
  }

  drawFooter(p3, 3);

  // ========== PAGE 4: DEALER GUIDE ==========
  const p4 = newPage();
  drawHeader(p4, 'Dealer Quick-Start Guide');
  y = H - 100;

  y = drawPara(p4, 'Getting Started', M, y, { size: 16, color: accent });
  y -= 4;
  y = drawBullet(p4, [
    'Go to the CGSI E-Form URL and enter the shared dealer password',
    'Select the form template you need from the 4 options',
    'Fill the PDF form using any PDF editor (Edge, Acrobat, etc.)',
    'Upload the filled PDF by clicking "Choose PDF File"',
    'Click "Set Signature Positions" to open the visual setup tool',
    'On each page, toggle DRAW ON and drag to draw red rectangles where signatures go',
    'Save positions and go back to the main page',
    'Enter the recipient email (or leave blank for the default)',
    'Click "Generate Link" — copy and send it to your client',
    'The client signs and the signed PDF is automatically emailed',
  ], M, y, 10);

  y -= 16;
  y = drawPara(p4, 'Signature Positioning Tips', M, y, { size: 14, color: accent });
  y -= 4;
  y = drawBullet(p4, [
    'Draw boxes slightly larger than the expected signature area',
    'The signature image will be automatically scaled to fit each box',
    'Use multiple boxes for multi-signature forms',
    'On mobile, toggle DRAW ON only when actively marking positions',
    'Boxes are saved per template — configure once, reuse forever',
  ], M, y, 10);

  drawFooter(p4, 4);

  // ========== PAGE 5: CLIENT EXPERIENCE ==========
  const p5 = newPage();
  drawHeader(p5, 'Client Signing Experience');
  y = H - 100;

  y = drawPara(p5, 'The Client Journey', M, y, { size: 16, color: accent });
  y -= 4;
  y = drawBullet(p5, [
    'Client receives the sign link via WeChat, SMS, or Email',
    'Opens the link on any device (phone, tablet, desktop)',
    'Sees a preview of the form (form fields if provided)',
    'Signs once on the signature pad — the same signature is applied to all required positions',
    'Clicks "Submit Signature"',
    'The signed PDF is automatically downloaded and emailed',
    'The entire process takes less than 30 seconds',
  ], M, y, 11);

  y -= 16;
  y = drawPara(p5, 'Security & Privacy', M, y, { size: 16, color: accent });
  y -= 4;
  y = drawBullet(p5, [
    'Each sign link is unique and cannot be guessed',
    'Links expire automatically after 7 days',
    'PDFs are stored encrypted in Vercel Blob cloud storage',
    'Emails are sent via authenticated SMTP',
    'No client data is permanently stored on the server',
    'The signing page requires no login or app installation',
  ], M, y, 10);

  drawFooter(p5, 5);

  // ========== PAGE 6: PRICING ==========
  const p6 = newPage();
  drawHeader(p6, 'Licensing & Pricing');
  y = H - 100;

  // pricing boxes
  const tiers = [
    { name: 'Single Dealer', price: 'RM XX / month', features: ['1 dealer access', 'Unlimited form uploads', 'Unlimited client signings', 'Email delivery', 'Standard support'] },
    { name: 'Team (Up to 5)', price: 'RM XX / month', features: ['5 dealer seats', 'Unlimited forms & signings', 'Priority email delivery', 'Custom branding', 'Priority support'] },
    { name: 'Enterprise', price: 'Custom', features: ['Unlimited dealer seats', 'Custom form templates', 'API access', 'Dedicated storage', '24/7 support', 'SLA guarantee'] },
  ];

  let cx = M;
  for (const t of tiers) {
    const bw = 155;
    p6.drawRectangle({ x: cx, y: y - 180, width: bw, height: 190, color: lightBg, borderColor: accent, borderWidth: 1 });
    p6.drawText(t.name, { x: cx + 10, y: y - 20, size: 13, font: bold, color: accent });
    p6.drawText(t.price, { x: cx + 10, y: y - 40, size: 16, font: bold, color: dark });
    let fy = y - 60;
    for (const f of t.features) {
      p6.drawText('> ' + f, { x: cx + 10, y: fy, size: 8, font, color: dark });
      fy -= 14;
    }
    cx += bw + 12;
  }

  y -= 210;
  y = drawPara(p6, 'Contact for pricing and customization. Volume discounts available.', M, y, { size: 10, color: gray });

  drawFooter(p6, 6);

  // ========== PAGE 7: TECH ==========
  const p7 = newPage();
  drawHeader(p7, 'Technical Specifications');
  y = H - 100;

  y = drawBullet(p7, [
    'Platform: Next.js 14 (React) with App Router',
    'Deployment: Vercel (auto-deploy on Git push)',
    'PDF Engine: pdf-lib + pdfjs-dist (Mozilla)',
    'Storage: Vercel Blob (persistent cloud storage)',
    'Email: Nodemailer via SMTP (Gmail/Office365 compatible)',
    'Signature: HTML5 Canvas with signature_pad library',
    'Authentication: Shared password with HMAC-signed cookies',
    'i18n: English, Chinese, Malay (Bahasa Melayu)',
    'Browser Support: Chrome, Safari, Edge, Mobile browsers',
  ], M, y, 10);

  y -= 16;
  y = drawPara(p7, 'Environment Variables Required', M, y, { size: 14, color: accent });
  y -= 4;
  y = drawBullet(p7, [
    'LOGIN_PASSWORD — Shared dealer access password',
    'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — Email configuration',
    'TO_EMAIL — Default recipient for signed PDFs',
    'BLOB_READ_WRITE_TOKEN — Vercel Blob storage token',
  ], M, y, 10);

  y -= 16;
  y = drawPara(p7, 'Built by Ediso & Claude Code', M, y, { size: 12, color: dark });
  y = drawPara(p7, `Generated: ${new Date().toISOString().split('T')[0]}`, M, y - 4, { size: 9, color: gray });

  drawFooter(p7, 7);

  // Save
  const outputBytes = await doc.save();
  fs.writeFileSync(outPath, outputBytes);
  console.log(`✓ Guide PDF created: ${outPath} (${(outputBytes.length / 1024).toFixed(0)} KB)`);
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

main().catch(err => { console.error(err); process.exit(1); });
