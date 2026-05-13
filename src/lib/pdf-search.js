import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure pdfjs worker (Node.js compatible)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

/**
 * Search for text patterns in a PDF page and return their bounding boxes.
 * @param {Buffer} pdfBuffer - Raw PDF file bytes
 * @param {string[]} patterns - Text patterns to search for (case-insensitive)
 * @param {number} pageIndex - 0-based page index
 * @returns {Promise<{x:number, y:number, width:number, height:number, text:string}[]>}
 */
export async function findTextInPdf(pdfBuffer, patterns, pageIndex = 0) {
  const data = new Uint8Array(pdfBuffer);
  const doc = await pdfjsLib.getDocument({ data, disableAutoFetch: true, disableStream: true }).promise;
  const page = await doc.getPage(pageIndex + 1); // pdfjs uses 1-based pages
  const content = await page.getTextContent();

  const results = [];
  const lowerPatterns = patterns.map(p => p.toLowerCase());

  for (const item of content.items) {
    const text = item.str || '';
    const lowerText = text.toLowerCase();

    for (const pattern of lowerPatterns) {
      if (lowerText.includes(pattern)) {
        // transform[4]=translateX, transform[5]=translateY (PDF points, origin bottom-left)
        const x = item.transform[4];
        const y = item.transform[5];
        const w = item.width || 40;
        const h = item.height || 12;
        results.push({ x, y, width: w, height: h, text, pattern });
      }
    }
  }

  // Sort by y descending (top-to-bottom in PDF coordinates) then x ascending (left-to-right)
  results.sort((a, b) => b.y - a.y || a.x - b.x);
  return results;
}

/**
 * Find signature placement position using anchor text + relative offset.
 *
 * Strategy: search for anchor texts in priority order, return best match.
 * If no anchor found, use page-size-based fallback position.
 *
 * @param {Buffer} pdfBuffer
 * @param {{anchors: string[], offsetX: number, offsetY: number, fallbackX: number, fallbackY: number, page: number}} config
 * @param {{width:number, height:number}} pageSize - PDF page dimensions in points
 * @returns {Promise<{x:number, y:number}>}
 */
export async function findSignaturePosition(pdfBuffer, config, pageSize) {
  const { anchors, offsetX = 10, offsetY = -15, page = 0, fallbackX, fallbackY } = config;

  try {
    const matches = await findTextInPdf(pdfBuffer, anchors, page);

    if (matches.length > 0) {
      const anchor = matches[0];
      // Place signature: right of anchor by offsetX, below anchor by offsetY
      // PDF coords: origin bottom-left, so "below" = subtract from y
      return {
        x: anchor.x + offsetX,
        y: anchor.y + offsetY,
      };
    }
  } catch (err) {
    console.warn('PDF text search failed, using fallback:', err.message);
  }

  // Fallback: percentage-based positioning from page dimensions
  return {
    x: fallbackX || pageSize.width * 0.5,
    y: fallbackY || pageSize.height * 0.07,
  };
}
