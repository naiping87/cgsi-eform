import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FORMS_DIR = path.join(process.cwd(), 'public', 'forms');
const PDF_FILES = {
  'client-info-update': 'client-info-update.pdf',
  'fen-declaration': 'fen-declaration.pdf',
  'change-of-dr': 'change-of-dr.pdf',
  'w8ben': 'w8ben.pdf',
};

let pdfjsLib = null;
async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  // Polyfill for Node.js
  global.DOMMatrix = class { constructor() { return { a:1,b:0,c:0,d:1,e:0,f:0 }; } };
  global.Path2D = class {};
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
  const { pathToFileURL } = await import('url');
  lib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  pdfjsLib = lib;
  return lib;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const pageNum = parseInt(searchParams.get('page') || '0');
    const scale = parseFloat(searchParams.get('scale') || '1.5');

    const filename = PDF_FILES[templateId];
    if (!filename) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

    const pdfPath = path.join(FORMS_DIR, filename);
    if (!fs.existsSync(pdfPath)) return NextResponse.json({ error: 'PDF not found' }, { status: 404 });

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfjs = await getPdfjs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes) }).promise;
    const page = await doc.getPage(pageNum + 1);
    const vp = page.getViewport({ scale });

    // Use the canvas package for Node.js rendering
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(vp.width, vp.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;

    return NextResponse.json({
      base64: canvas.toBuffer('image/png').toString('base64'),
      width: vp.width,
      height: vp.height,
      scale,
    });
  } catch (err) {
    console.error('Render PDF failed:', err);
    return NextResponse.json({ error: 'Render failed: ' + err.message }, { status: 500 });
  }
}
