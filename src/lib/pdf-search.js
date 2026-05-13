let pdfjsLib = null;

async function getPdfjsLib() {
  if (pdfjsLib) return pdfjsLib;
  try {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    return pdfjsLib;
  } catch (err) {
    console.warn('pdfjs-dist not available, text search disabled:', err.message);
    return null;
  }
}

/**
 * Search for text patterns in a PDF page and return their bounding boxes.
 * @param {Buffer} pdfBuffer - Raw PDF file bytes
 * @param {string[]} patterns - Text patterns to search for (case-insensitive)
 * @param {number} pageIndex - 0-based page index
 * @returns {Promise<{x:number, y:number, width:number, height:number, text:string}[]>}
 */
export async function findTextInPdf(pdfBuffer, patterns, pageIndex = 0) {
  const lib = await getPdfjsLib();
  if (!lib) return [];

  const data = new Uint8Array(pdfBuffer);
  const doc = await lib.getDocument({ data, disableAutoFetch: true, disableStream: true }).promise;
  const page = await doc.getPage(pageIndex + 1);
  const content = await page.getTextContent();

  const results = [];
  const lowerPatterns = patterns.map(p => p.toLowerCase());

  for (const item of content.items) {
    const text = item.str || '';
    const lowerText = text.toLowerCase();
    for (const pattern of lowerPatterns) {
      if (lowerText.includes(pattern)) {
        const x = item.transform[4];
        const y = item.transform[5];
        const w = item.width || 40;
        const h = item.height || 12;
        results.push({ x, y, width: w, height: h, text, pattern });
      }
    }
  }

  results.sort((a, b) => b.y - a.y || a.x - b.x);
  return results;
}

/**
 * Find signature placement position using anchor text + relative offset.
 * Falls back to config fallbackX/fallbackY if text search fails or is unavailable.
 */
export async function findSignaturePosition(pdfBuffer, config, pageSize) {
  const { anchors, offsetX = 10, offsetY = -15, page = 0, fallbackX, fallbackY } = config;

  try {
    const matches = await findTextInPdf(pdfBuffer, anchors, page);
    if (matches.length > 0) {
      const anchor = matches[0];
      return {
        x: anchor.x + offsetX,
        y: anchor.y + offsetY,
      };
    }
    console.warn(`Anchor text [${anchors.join(', ')}] not found on page ${page}, using fallback`);
  } catch (err) {
    console.warn('PDF text search error, using fallback:', err.message);
  }

  return {
    x: fallbackX || pageSize.width * 0.5,
    y: fallbackY || pageSize.height * 0.07,
  };
}
