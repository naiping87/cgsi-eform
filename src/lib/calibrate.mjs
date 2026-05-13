// PDF Calibration Script — extracts all text + coordinates from form PDFs
// Run: node src/lib/calibrate.mjs

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORMS_DIR = path.join(__dirname, '../../public/forms');

const FORMS = [
  'client-info-update.pdf',
  'change-of-dr.pdf',
  'fen-declaration.pdf',
  'w8ben.pdf',
];

// Polyfill DOMMatrix etc for Node.js
global.DOMMatrix = class { constructor() { return { a:1,b:0,c:0,d:1,e:0,f:0 }; } };
global.Path2D = class {};

const workerUrl = pathToFileURL(path.join(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')).href;
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

for (const filename of FORMS) {
  const filePath = path.join(FORMS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`\n=== ${filename} — NOT FOUND ===`);
    continue;
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`=== ${filename.toUpperCase()} ===`);
  console.log('='.repeat(70));

  const pdfBytes = fs.readFileSync(filePath);
  const data = new Uint8Array(pdfBytes);
  const doc = await pdfjsLib.getDocument({ data }).promise;

  for (let p = 0; p < doc.numPages; p++) {
    const page = await doc.getPage(p + 1);
    const vp = page.getViewport({ scale: 1 });
    console.log(`\n--- Page ${p} (0-based) | Size: ${vp.width.toFixed(0)} x ${vp.height.toFixed(0)} pt ---`);

    const content = await page.getTextContent();
    const items = content.items
      .filter(i => (i.str || '').trim().length > 0)
      .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);

    for (const item of items) {
      const x = item.transform[4].toFixed(0);
      const y = item.transform[5].toFixed(0);
      const w = (item.width || 0).toFixed(0);
      const text = item.str.replace(/\s+/g, ' ').trim();
      console.log(`  x:${x.padStart(4)}  y:${y.padStart(4)}  w:${w.padStart(3)}  "${text}"`);
    }
  }
}

console.log('\nDone.\n');
