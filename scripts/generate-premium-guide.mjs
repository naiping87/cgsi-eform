// Premium Marketing PDF — CGSI E-Form
// Uses node-canvas for rich visuals + pdf-lib for PDF assembly

import { PDFDocument } from 'pdf-lib';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FONTS_DIR = path.join(__dirname, 'fonts');
const RENDERS_DIR = path.join(ROOT, 'public', 'renders');
const OUT = path.join(ROOT, 'public', 'CGSI_E-Form_Premium_Guide.pdf');

const A4_W = 595, A4_H = 842, M = 40;

// Brand colors
const C = {
  bg: '#0f1117',
  card: '#1a1d28',
  accent: '#6366f1',    // indigo-500
  accent2: '#818cf8',   // indigo-400
  accent3: '#a5b4fc',   // indigo-300
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  text: '#f1f5f9',
  muted: '#94a3b8',
  white: '#ffffff',
};

// Register fonts with node-canvas (use system fonts for reliability)
if (existsSync(path.join(FONTS_DIR, 'arial.ttf'))) {
  registerFont(path.join(FONTS_DIR, 'arial.ttf'), { family: 'Arial' });
}
if (existsSync(path.join(FONTS_DIR, 'msyh.ttc'))) {
  registerFont(path.join(FONTS_DIR, 'msyh.ttc'), { family: 'MS YaHei' });
}
if (existsSync(path.join(FONTS_DIR, 'NotoSans-Regular.ttf'))) {
  registerFont(path.join(FONTS_DIR, 'NotoSans-Regular.ttf'), { family: 'Noto Sans' });
}

const FONT = 'Arial';
const FONT_CJK = 'MS YaHei';

// Helpers for node-canvas
function newCanvas(w, h) {
  const c = createCanvas(w, h);
  return { canvas: c, ctx: c.getContext('2d') };
}

function fillGradient(ctx, x, y, w, h, color1, color2) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, color1);
  g.addColorStop(1, color2);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function drawCard(ctx, x, y, w, h, { fill = C.card, radius = 8, shadow = true } = {}) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawText(ctx, text, x, y, opts = {}) {
  const { size = 12, color = C.text, font = FONT, align = 'left', bold = false, maxWidth } = opts;
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px "${font}"`;
  ctx.textAlign = align;
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else { line = test; }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(ctx, text, x, y, { size = 12, color = C.text, font = FONT, maxWidth, lineHeight = 1.5 } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "${font}"`;
  const lines = wrapLines(ctx, text, maxWidth);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * size * lineHeight));
  return y + lines.length * size * lineHeight;
}

// ---- PAGE BUILDERS ----
// Each returns a PNG buffer of the full page

async function buildCover() {
  const { canvas, ctx } = newCanvas(Math.round(A4_W * 2), Math.round(A4_H * 2));
  const W = canvas.width, H = canvas.height;
  const scale = 2;

  // Dark background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative circles
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = C.accent;
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.2, 300, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.15, H * 0.75, 200, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Accent bar
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, H * 0.45 - 4, W, 8);

  // Title
  ctx.fillStyle = C.white;
  ctx.font = `bold 64px "${FONT}"`;
  ctx.textAlign = 'center';
  ctx.fillText('CGSI E-Form', W / 2, H * 0.42);

  // Subtitle
  ctx.fillStyle = C.accent2;
  ctx.font = `22px "${FONT}"`;
  ctx.fillText('Professional Digital Signature Platform', W / 2, H * 0.42 + 55);

  // Tagline
  ctx.fillStyle = C.muted;
  ctx.font = `16px "${FONT}"`;
  ctx.fillText('Upload  ·  Sign  ·  Email  ·  Done', W / 2, H * 0.52);

  // Bottom info
  ctx.fillStyle = C.muted;
  ctx.font = `13px "${FONT}"`;
  ctx.fillText('Built for Securities & Financial Services', W / 2, H * 0.82);
  ctx.font = `11px "${FONT}"`;
  ctx.fillText('Next.js  ·  Vercel Cloud  ·  Secure Storage  ·  Multi-language', W / 2, H * 0.82 + 25);

  // Footer
  ctx.fillStyle = C.accent;
  ctx.font = `11px "${FONT}"`;
  ctx.textAlign = 'right';
  ctx.fillText('CGSI E-Form  |  Product Guide 2026', W - 40, H - 30);

  return canvas.toBuffer('image/png');
}

async function buildPage(title, contentFn) {
  const { canvas, ctx } = newCanvas(Math.round(A4_W * 2), Math.round(A4_H * 2));
  const W = canvas.width, H = canvas.height;

  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Header bar
  fillGradient(ctx, 0, 0, W, 80, C.card, C.bg);
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, 78, W, 3);

  ctx.fillStyle = C.accent2;
  ctx.font = `bold 24px "${FONT}"`;
  ctx.fillText(title, 60, 52);

  ctx.fillStyle = C.white;
  ctx.font = `bold 12px "${FONT}"`;
  ctx.textAlign = 'right';
  ctx.fillText('CGSI E-Form', W - 60, 52);
  ctx.textAlign = 'left';

  // Content
  await contentFn(ctx, W, H);

  // Footer
  ctx.fillStyle = C.muted;
  ctx.font = `10px "${FONT}"`;
  ctx.textAlign = 'center';
  ctx.fillText('Confidential  |  CGSI E-Form Product Guide', W / 2, H - 20);

  return canvas.toBuffer('image/png');
}

async function buildFeaturePage() {
  return buildPage('Product Overview', async (ctx, W, H) => {
    let y = 120;
    drawText(ctx, 'Why CGSI E-Form?', 60, y, { size: 30, bold: true, color: C.white }); y += 50;

    const features = [
      { icon: '01', title: 'Zero Installation', desc: 'Clients sign directly in their browser. No app download, no plugin, no account creation needed.' },
      { icon: '02', title: 'Visual Positioning', desc: 'Draw rectangles on the PDF to mark signature areas. Drag-and-drop simple. No coding required.' },
      { icon: '03', title: 'Auto Email Delivery', desc: 'Signed PDFs are automatically emailed to any recipient you specify. One click, done.' },
      { icon: '04', title: 'Multi-Language', desc: 'Supports English, Simplified Chinese, and Bahasa Melayu. Switch language with one click.' },
      { icon: '05', title: 'Multi-Device', desc: 'Works on desktop, tablet, and mobile. Dealers configure on desktop; clients sign anywhere.' },
      { icon: '06', title: 'Secure & Expiring', desc: 'Each sign link is unique and expires after 7 days. No permanent client data stored.' },
    ];

    const cols = 3;
    const cardW = (W - 140) / cols;
    const cardH = 200;

    for (let i = 0; i < features.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = 60 + col * (cardW + 10);
      const cy = y + row * (cardH + 12);

      drawCard(ctx, cx, cy, cardW, cardH);

      // Icon number
      ctx.fillStyle = C.accent;
      ctx.font = `bold 36px "${FONT}"`;
      ctx.fillText(features[i].icon, cx + 20, cy + 50);

      // Title
      drawText(ctx, features[i].title, cx + 20, cy + 80, { size: 15, bold: true, color: C.white });

      // Description
      drawWrapped(ctx, features[i].desc, cx + 20, cy + 105, { size: 11, color: C.muted, maxWidth: cardW - 40, lineHeight: 1.6 });
    }
  });
}

async function buildHowItWorks() {
  return buildPage('How It Works', async (ctx, W, H) => {
    let y = 130;
    const steps = [
      { num: '1', title: 'Select & Upload', desc: 'Dealer selects a form template\nand uploads the pre-filled PDF.' },
      { num: '2', title: 'Position Signatures', desc: 'Draw boxes on the PDF where\nsignatures should be placed.' },
      { num: '3', title: 'Generate Link', desc: 'Optionally enter recipient email,\nthen generate the signing link.' },
      { num: '4', title: 'Client Signs', desc: 'Client opens the link, signs\nonce on any device.' },
      { num: '5', title: 'Auto Delivery', desc: 'PDF is signed and emailed\nautomatically to the recipient.' },
    ];

    const stepW = 170;
    const gap = 18;
    const startX = 60;

    steps.forEach((step, i) => {
      const cx = startX + i * (stepW + gap);
      // Circle with number
      ctx.fillStyle = i === 2 ? C.accent : C.card;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx + stepW / 2, y + 30, 28, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = C.white;
      ctx.font = `bold 24px "${FONT}"`;
      ctx.textAlign = 'center';
      ctx.fillText(step.num, cx + stepW / 2, y + 39);

      // Arrow between circles (except last)
      if (i < 4) {
        ctx.fillStyle = C.accent3;
        ctx.font = `20px "${FONT}"`;
        ctx.fillText('→', cx + stepW + 2, y + 37);
      }

      // Title
      ctx.textAlign = 'center';
      drawText(ctx, step.title, cx + stepW / 2, y + 85, { size: 14, bold: true, color: C.white, align: 'center' });

      // Description
      ctx.fillStyle = C.muted;
      ctx.font = `11px "${FONT}"`;
      ctx.textAlign = 'center';
      const descLines = step.desc.split('\n');
      descLines.forEach((l, li) => {
        ctx.fillText(l, cx + stepW / 2, y + 110 + li * 18);
      });
    });

    // Bottom summary
    y = 290;
    drawCard(ctx, 60, y, W - 120, 120, { fill: 'rgba(99,102,241,0.08)', shadow: false });
    drawText(ctx, 'The entire process takes less than 30 seconds for the client.', 80, y + 40, { size: 15, color: C.accent2 });
    drawText(ctx, 'Dealers configure once. Clients sign in seconds. PDFs arrive automatically.', 80, y + 70, { size: 12, color: C.muted });
  });
}

async function buildDealerGuide() {
  return buildPage('Dealer Quick-Start Guide', async (ctx, W, H) => {
    let y = 130;
    const items = [
      'Log in with your shared dealer password',
      'Select the form template from the available options',
      'Fill the PDF form using any PDF editor (Edge, Acrobat, etc.)',
      'Upload the filled PDF via the upload button',
      'Open Setup tool to mark signature positions by drawing boxes',
      'Enter recipient email (or leave blank for default)',
      'Click "Generate Link" and send it to your client',
      'The signed PDF is automatically emailed upon client submission',
    ];

    items.forEach((item, i) => {
      // Number badge
      ctx.fillStyle = C.accent;
      ctx.font = `bold 14px "${FONT}"`;
      ctx.fillText(`${i + 1}.`, 60, y);

      ctx.fillStyle = C.text;
      ctx.font = `14px "${FONT}"`;
      ctx.fillText(item, 100, y);

      y += 36;
      if (i < items.length - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.moveTo(100, y - 12); ctx.lineTo(W - 60, y - 12); ctx.stroke();
      }
    });

    y = 450;
    drawCard(ctx, 60, y, W - 120, 90, { fill: C.card });
    drawText(ctx, 'Pro Tip', 80, y + 30, { size: 14, bold: true, color: C.accent2 });
    drawWrapped(ctx, 'Draw signature boxes slightly larger than expected. The signature image auto-scales to fit each box while maintaining aspect ratio.', 80, y + 55, { size: 11, color: C.muted, maxWidth: W - 200 });
  });
}

async function buildClientExperience() {
  return buildPage('Client Signing Experience', async (ctx, W, H) => {
    let y = 130;
    drawText(ctx, 'The Client Journey', 60, y, { size: 26, bold: true, color: C.white }); y += 50;

    const items = [
      'Receives the sign link via WeChat, SMS, or Email',
      'Opens on any device — phone, tablet, or desktop',
      'Reviews the form preview (form field data shown, if provided)',
      'Signs once on the canvas signature pad',
      'Clicks "Submit Signature" — done in seconds',
      'The same signature is automatically applied to all required positions',
      'Signed PDF downloads automatically; email copy arrives seconds later',
    ];

    items.forEach((item, i) => {
      ctx.fillStyle = C.accent;
      ctx.font = `bold 16px "${FONT}"`;
      ctx.fillText('>', 60, y);

      ctx.fillStyle = C.text;
      ctx.font = `14px "${FONT}"`;
      ctx.fillText(item, 90, y);

      y += 36;
    });

    y += 20;
    drawCard(ctx, 60, y, W - 120, 100, { fill: 'rgba(52,211,153,0.06)', shadow: false });
    drawText(ctx, 'Security & Privacy', 80, y + 30, { size: 16, bold: true, color: C.success });
    drawWrapped(ctx, 'Unique sign links cannot be guessed. Links expire after 7 days. No client data is permanently stored. No account or app installation required for clients.', 80, y + 55, { size: 11, color: C.muted, maxWidth: W - 200 });
  });
}

async function buildPricing() {
  return buildPage('Licensing & Pricing', async (ctx, W, H) => {
    let y = 140;
    const tiers = [
      { name: 'Single Dealer', price: 'Contact Us', color: C.accent2, features: ['1 dealer access', 'Unlimited form uploads', 'Unlimited client signings', 'Email delivery', 'Standard support'] },
      { name: 'Team (Up to 5)', price: 'Contact Us', color: C.accent, features: ['5 dealer seats', 'Unlimited forms & signings', 'Priority email delivery', 'Custom branding', 'Priority support'], highlight: true },
      { name: 'Enterprise', price: 'Contact Us', color: C.accent3, features: ['Unlimited dealer seats', 'Custom form templates', 'API access', 'Dedicated storage', '24/7 support', 'SLA guarantee'] },
    ];

    const cardW = (W - 140) / 3;
    tiers.forEach((t, i) => {
      const cx = 60 + i * (cardW + 10);
      const cardH = 280;

      drawCard(ctx, cx, y, cardW, cardH, { fill: t.highlight ? 'rgba(99,102,241,0.12)' : C.card });
      if (t.highlight) {
        ctx.fillStyle = C.accent;
        ctx.fillRect(cx, y + cardH - 4, cardW, 4);
      }

      drawText(ctx, t.name, cx + 20, y + 40, { size: 18, bold: true, color: t.color });
      drawText(ctx, t.price, cx + 20, y + 70, { size: 22, bold: true, color: C.white });

      let fy = y + 110;
      t.features.forEach(f => {
        ctx.fillStyle = C.success;
        ctx.font = `12px "${FONT}"`;
        ctx.fillText('✓', cx + 20, fy);
        ctx.fillStyle = C.muted;
        ctx.fillText(f, cx + 38, fy);
        fy += 24;
      });
    });

    y += 310;
    drawText(ctx, 'Contact us for detailed pricing. Volume discounts available for 10+ dealer seats.', 60, y, { size: 12, color: C.muted });
  });
}

async function buildSpecs() {
  return buildPage('Technical Specifications', async (ctx, W, H) => {
    let y = 130;

    const specs = [
      ['Platform', 'Next.js 14 (React App Router)'],
      ['Deployment', 'Vercel (auto-deploy on Git push)'],
      ['PDF Engine', 'pdf-lib + pdfjs-dist (Mozilla)'],
      ['Storage', 'Vercel Blob (persistent cloud)'],
      ['Email', 'Nodemailer SMTP (Gmail / Office365)'],
      ['Signature', 'HTML5 Canvas (signature_pad library)'],
      ['Auth', 'HMAC-signed cookie (shared password)'],
      ['i18n', 'English, Chinese, Malay (Bahasa Melayu)'],
      ['Browser', 'Chrome, Safari, Edge, Mobile browsers'],
      ['Fonts', 'Noto Sans + Noto Sans SC (CJK)'],
    ];

    const colW = (W - 140) / 2;
    specs.forEach((s, i) => {
      const cx = 60 + (i % 2) * (colW + 20);
      const cy = y + Math.floor(i / 2) * 32;

      ctx.fillStyle = C.accent2;
      ctx.font = `bold 11px "${FONT}"`;
      ctx.fillText(s[0], cx, cy);

      ctx.fillStyle = C.muted;
      ctx.font = `11px "${FONT}"`;
      ctx.fillText(s[1], cx + 120, cy);
    });

    y = 310;
    drawText(ctx, 'Environment Variables', 60, y, { size: 20, bold: true, color: C.white }); y += 40;
    const envVars = ['LOGIN_PASSWORD  —  Shared dealer access password', 'SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS  —  Email config', 'TO_EMAIL  —  Default recipient for signed PDFs', 'BLOB_READ_WRITE_TOKEN  —  Vercel Blob storage token'];
    envVars.forEach(v => {
      ctx.fillStyle = C.muted;
      ctx.font = `11px "${FONT}"`;
      ctx.fillText('>  ' + v, 60, y);
      y += 24;
    });

    y = 440;
    drawText(ctx, 'Built by Ediso & Claude Code  |  2026', 60, y, { size: 13, color: C.accent2 });
  });
}

async function buildScreenshots() {
  return buildPage('App Interface Preview', async (ctx, W, H) => {
    let y = 120;

    // Try to load rendered form page screenshots
    const renderFiles = (await readdir(RENDERS_DIR).catch(() => []))
      .filter(f => f.endsWith('.png'))
      .slice(0, 4);

    if (renderFiles.length > 0) {
      drawText(ctx, 'Supported Form Templates', 60, y, { size: 24, bold: true, color: C.white }); y += 50;

      const imgW = 220, imgH = 280;
      const gap = 15;
      const startX = (W - (imgW * Math.min(4, renderFiles.length) + gap * (Math.min(4, renderFiles.length) - 1))) / 2;

      for (let i = 0; i < renderFiles.length; i++) {
        try {
          const img = await loadImage(path.join(RENDERS_DIR, renderFiles[i]));
          const cx = startX + i * (imgW + gap);
          drawCard(ctx, cx - 5, y - 5, imgW + 10, imgH + 10, { fill: C.card, radius: 4 });
          ctx.drawImage(img, cx, y, imgW, imgH);
          // Label
          const label = renderFiles[i].replace('_page0.png', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          drawText(ctx, label, cx + imgW / 2, y + imgH + 25, { size: 10, color: C.muted, align: 'center' });
        } catch {}
      }
    } else {
      drawText(ctx, 'Form Templates Available', 60, y, { size: 24, bold: true, color: C.white }); y += 60;
      const forms = ['Client Info Update Form (2 pages)', 'Request for Change of DR (1 page)', 'W-8BEN Form (1 page)', 'Others Form (4 pages)'];
      forms.forEach(f => {
        drawText(ctx, '>  ' + f, 60, y, { size: 15, color: C.muted });
        y += 30;
      });
    }
  });
}

// ---- Main ----
async function main() {
  console.log('Building premium CGSI E-Form guide PDF...');

  // Build all pages as high-res PNGs
  const pageBuilders = [
    buildCover,
    buildFeaturePage,
    buildScreenshots,
    buildHowItWorks,
    buildDealerGuide,
    buildClientExperience,
    buildPricing,
    buildSpecs,
  ];

  const pagePNGs = [];
  for (let i = 0; i < pageBuilders.length; i++) {
    console.log(`  Rendering page ${i + 1}/${pageBuilders.length}...`);
    pagePNGs.push(await pageBuilders[i]());
  }

  // Assemble into PDF (all pages are pre-rendered PNGs, no native text needed)
  console.log('  Assembling PDF...');
  const pdfDoc = await PDFDocument.create();

  for (const pngBuf of pagePNGs) {
    const page = pdfDoc.addPage([A4_W, A4_H]);
    const img = await pdfDoc.embedPng(pngBuf);
    page.drawImage(img, { x: 0, y: 0, width: A4_W, height: A4_H });
  }

  const pdfBytes = await pdfDoc.save();
  await writeFile(OUT, pdfBytes);
  console.log(`\nDone! ${pagePNGs.length} pages, ${(pdfBytes.length / 1024).toFixed(0)} KB`);
  console.log(`Output: ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
