// Render PDF pages to PNG images for visual inspection
// Run: node src/lib/render-pdf.mjs

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORMS_DIR = path.join(__dirname, '../../public/forms');
const OUT_DIR = path.join(__dirname, '../../public/renders');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const FORMS = [
  'client-info-update.pdf',
  'change-of-dr.pdf',
  'fen-declaration.pdf',
  'w8ben.pdf',
];

global.DOMMatrix = class { constructor() { return { a:1,b:0,c:0,d:1,e:0,f:0 }; } };
global.Path2D = class {};

const workerUrl = pathToFileURL(path.join(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')).href;
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

for (const filename of FORMS) {
  const filePath = path.join(FORMS_DIR, filename);
  if (!fs.existsSync(filePath)) continue;

  console.log(`Rendering ${filename}...`);
  const pdfBytes = fs.readFileSync(filePath);
  const data = new Uint8Array(pdfBytes);
  const doc = await pdfjsLib.getDocument({ data }).promise;

  for (let p = 0; p < doc.numPages; p++) {
    const page = await doc.getPage(p + 1);
    const vp = page.getViewport({ scale: 1.5 }); // 1.5x for readable size

    const canvas = createCanvas(vp.width, vp.height);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport: vp }).promise;

    const outPath = path.join(OUT_DIR, `${filename.replace('.pdf', '')}_page${p}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log(`  -> ${outPath}`);
  }
}

console.log('\nDone. Rendered images in public/renders/');
