import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { COORDINATES } from './coordinates';
import { TEMPLATES, TEMPLATE_SHORT_NAMES } from './templates';

const FORMS_DIR = path.join(process.cwd(), 'public', 'forms');

const PDF_FILES = {
  'client-info-update': 'client-info-update.pdf',
  'fen-declaration': 'fen-declaration.pdf',
  'change-of-dr': 'change-of-dr.pdf',
  'w8ben': 'w8ben.pdf',
};

// Replace select option values with their display labels
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

// signatureBuffers: Array of Buffer containing PNG binary data from base64 data URLs
export async function generatePDF(templateId, formData, signatureBuffers) {
  const pdfPath = path.join(FORMS_DIR, PDF_FILES[templateId]);
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const coord = COORDINATES[templateId];

  const pages = pdfDoc.getPages();

  // Fill text fields
  if (coord.fields) {
    for (const [key, pos] of Object.entries(coord.fields)) {
      const value = formData[key];
      if (!value) continue;

      const page = pages[pos.page];
      const displayValue = getDisplayValue(templateId, key, value);

      page.drawText(displayValue, {
        x: pos.x,
        y: pos.y,
        size: pos.size || 10,
        font,
        color: rgb(0, 0, 0),
        maxWidth: pos.maxWidth || 400,
      });
    }
  }

  // Overlay signature images
  if (coord.signatures && signatureBuffers) {
    for (let i = 0; i < coord.signatures.length; i++) {
      const sigPos = coord.signatures[i];
      const sigBuf = signatureBuffers[i];
      if (!sigBuf) continue;

      const page = pages[sigPos.page];
      const sigImage = await pdfDoc.embedPng(sigBuf);

      page.drawImage(sigImage, {
        x: sigPos.x,
        y: sigPos.y,
        width: sigPos.w,
        height: sigPos.h,
      });
    }
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
