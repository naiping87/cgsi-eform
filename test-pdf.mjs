import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const formsDir = 'C:/Users/ediso/Downloads/(No subject)';

async function analyze(pdfPath, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`  File: ${path.basename(pdfPath)}`);
  console.log(`${'='.repeat(60)}`);

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  console.log(`  Pages: ${doc.numPages}`);

  let totalTextItems = 0;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items;
    totalTextItems += items.length;

    console.log(`\n  --- Page ${i}/${doc.numPages}: ${items.length} text items ---`);

    if (items.length === 0) {
      console.log('  ⚠️  NO TEXT — THIS PAGE IS IMAGE-BASED!');
      continue;
    }

    // Show first 25 text items with coordinates
    const sample = items.slice(0, 25);
    console.log('  First text items:');
    sample.forEach((it) => {
      const x = it.transform[4].toFixed(0).padStart(4);
      const y = it.transform[5].toFixed(0).padStart(4);
      const h = (it.height || 0).toFixed(1);
      console.log(`    (x:${x} y:${y} h:${h}) "${it.str}"`);
    });

    // Also show some items from middle/lower part of page to check coverage
    const mid = items.slice(Math.floor(items.length / 2), Math.floor(items.length / 2) + 10);
    if (mid.length > 0) {
      console.log('  Middle items sample:');
      mid.forEach((it) => {
        const x = it.transform[4].toFixed(0).padStart(4);
        const y = it.transform[5].toFixed(0).padStart(4);
        console.log(`    (x:${x} y:${y}) "${it.str}"`);
      });
    }
  }

  console.log(`\n  TOTAL text items across all pages: ${totalTextItems}`);
  
  if (totalTextItems > 0) {
    console.log('  ✅ TEXT-BASED — can be parsed with pdfjs-dist');
  } else {
    console.log('  ❌ IMAGE-BASED — needs OCR / vision AI');
  }
  
  return { label, pages: doc.numPages, textItems: totalTextItems, textBased: totalTextItems > 0 };
}

async function main() {
  console.log('CGSI Form PDF Analysis');
  console.log('Directory:', formsDir);
  console.log('');

  const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDF files:\n`);
  files.forEach(f => console.log(`  - ${f}`));

  const results = [];

  for (const file of files) {
    const pdfPath = path.join(formsDir, file);
    try {
      const r = await analyze(pdfPath, file);
      results.push(r);
    } catch (err) {
      console.error(`\n  ❌ ERROR: ${err.message}`);
      results.push({ label: file, pages: 0, textItems: 0, textBased: false, error: err.message });
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    const status = r.textBased ? '✅ TEXT' : r.error ? '❌ ERROR' : '❌ IMAGE';
    console.log(`  ${status} | ${r.pages}p | ${r.textItems} items | ${r.label}`);
  });

  const allText = results.every(r => r.textBased);
  console.log(`\n  Verdict: ${allText ? 'ALL forms are text-based — PDF parsing is viable!' : 'Some forms need alternative approach'}`);
}

main().catch(console.error);
