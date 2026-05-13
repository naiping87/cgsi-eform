import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { COORDINATES, SIGNATURE_ANCHORS } from './coordinates';
import { TEMPLATES, TEMPLATE_SHORT_NAMES } from './templates';
import { findSignaturePosition } from './pdf-search';

const FORMS_DIR = path.join(process.cwd(), 'public', 'forms');

const PDF_FILES = {
  'client-info-update': 'client-info-update.pdf',
  'fen-declaration': 'fen-declaration.pdf',
  'change-of-dr': 'change-of-dr.pdf',
  'w8ben': 'w8ben.pdf',
};

function getDisplayValue(templateId, key, value) {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) return value;
  const field = template.fields.find(f => f.key === key);
  if (field && field.type === 'select' && field.options) {
    const option = field.options.find(o => o.value === value);
    return option ? option.label : value;
  }
  return value;
}

export async function generatePDF(templateId, formData, signatureBuffers, options = {}) {
  const { overrides = {}, positions = {} } = options;
  const pdfPath = path.join(FORMS_DIR, PDF_FILES[templateId]);
  const pdfBytes = fs.readFileSync(pdfPath);

  // ---- Phase 1: Load PDF and get actual page sizes ----
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // ---- Phase 2: Find signature positions via text anchors ----
  // Use actual page dimensions from the loaded PDF for accurate fallback
  const anchorConfigs = SIGNATURE_ANCHORS[templateId] || [];
  const sigPositions = [];

  for (const cfg of anchorConfigs) {
    const pageSize = cfg.page < pages.length
      ? pages[cfg.page].getSize()
      : { width: 595, height: 842 };
    const pos = await findSignaturePosition(pdfBytes, cfg, pageSize);
    sigPositions.push({ ...pos, page: cfg.page, sigWidth: cfg.sigWidth, sigMaxHeight: cfg.sigMaxHeight });
  }

  // ---- Phase 3: Fill text fields ----
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const coord = COORDINATES[templateId];

  if (coord && coord.fields) {
    for (const [key, pos] of Object.entries(coord.fields)) {
      const value = formData[key];
      if (!value) continue;
      const displayValue = getDisplayValue(templateId, key, value);

      // Priority: user-clicked positions > calibration overrides > default coordinates
      const p = positions[key] || {};
      const o = overrides[key] || {};
      const x = p.x ?? o.x ?? pos.x;
      const y = p.y ?? o.y ?? pos.y;
      const sz = o.size ?? pos.size ?? 10;
      const pageIdx = p.page ?? pos.page;
      const page = pages[pageIdx];
      if (!page) continue;

      page.drawText(displayValue, {
        x, y,
        size: sz,
        font,
        color: rgb(0, 0, 0),
        maxWidth: o.maxWidth ?? pos.maxWidth ?? 400,
      });
    }
  }

  // ---- Phase 4: Overlay signature images at anchor-derived positions ----
  if (signatureBuffers && signatureBuffers.length > 0) {
    for (let i = 0; i < signatureBuffers.length; i++) {
      const sigBuf = signatureBuffers[i];
      if (!sigBuf) continue;

      const sigPos = sigPositions[i];
      if (!sigPos) continue;

      const page = pages[sigPos.page];
      const sigImage = await pdfDoc.embedPng(sigBuf);

      // Calculate proportional height from width
      const imgRatio = sigImage.width / sigImage.height;
      let sigW = sigPos.sigWidth;
      let sigH = sigW / imgRatio;

      // Cap height to avoid exceeding form boundaries
      const maxH = sigPos.sigMaxHeight || 60;
      if (sigH > maxH) {
        sigH = maxH;
        sigW = sigH * imgRatio;
      }

      page.drawImage(sigImage, {
        x: sigPos.x,
        y: sigPos.y,
        width: sigW,
        height: sigH,
      });
    }
  }

  const outputBytes = await pdfDoc.save();
  return Buffer.from(outputBytes);
}

// Add signatures to an uploaded (already filled) PDF
export async function addSignaturesToPdf(pdfBuffer, templateId, signatureBuffers) {
  if (!signatureBuffers || signatureBuffers.length === 0) return pdfBuffer;

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  const anchorConfigs = SIGNATURE_ANCHORS[templateId] || [];

  for (let i = 0; i < Math.min(signatureBuffers.length, anchorConfigs.length); i++) {
    const sigBuf = signatureBuffers[i];
    if (!sigBuf) continue;

    const cfg = anchorConfigs[i];
    const pageSize = cfg.page < pages.length
      ? pages[cfg.page].getSize()
      : { width: 595, height: 842 };

    const sigPos = await findSignaturePosition(pdfBuffer, cfg, pageSize);
    const page = pages[cfg.page];
    const sigImage = await pdfDoc.embedPng(sigBuf);

    const imgRatio = sigImage.width / sigImage.height;
    let sigW = cfg.sigWidth;
    let sigH = sigW / imgRatio;
    const maxH = cfg.sigMaxHeight || 60;
    if (sigH > maxH) { sigH = maxH; sigW = sigH * imgRatio; }

    page.drawImage(sigImage, {
      x: sigPos.x,
      y: sigPos.y,
      width: sigW,
      height: sigH,
    });
  }

  const outputBytes = await pdfDoc.save();
  return Buffer.from(outputBytes);
}

export function getPDFFilename(templateId, formData) {
  const shortName = TEMPLATE_SHORT_NAMES[templateId] || templateId;
  const clientName = (formData.clientName || formData.applicantName || formData.beneficialOwnerName || 'unknown')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return `${shortName}_${clientName}.pdf`;
}
