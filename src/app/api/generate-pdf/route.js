import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename, addSignaturesToPdf } from '@/lib/pdf-generator';
import { sendPDFByEmail } from '@/lib/mailer';
import { store } from '@/app/api/store-pdf/route';

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, formData, signatures, overrides, positions, pdfId } = body;

    // Signature buffer extraction
    const sigBuffers = (signatures || []).map(sig => {
      if (!sig) return null;
      const base64 = sig.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    }).filter(Boolean);

    let pdfBuffer, filename;

    if (pdfId && store.has(pdfId)) {
      // Use uploaded PDF — only add signatures
      const entry = store.get(pdfId);
      pdfBuffer = await addSignaturesToPdf(entry.buffer, entry.templateId, sigBuffers);
      filename = entry.filename.replace(/\.pdf$/i, '') + '_signed.pdf';

      // Clean up stored PDF after use
      store.delete(pdfId);
    } else {
      // Fallback: generate from template + formData
      if (!templateId || !formData) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      pdfBuffer = await generatePDF(templateId, formData, sigBuffers, { overrides: overrides || {}, positions: positions || {} });
      filename = getPDFFilename(templateId, formData);
    }

    // Send email
    let emailSent = false;
    let emailError = null;
    try {
      await sendPDFByEmail(pdfBuffer, filename);
      emailSent = true;
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      emailError = emailErr.message || 'Unknown email error';
    }

    const pdfBase64 = pdfBuffer.toString('base64');
    return NextResponse.json({
      success: true,
      filename,
      pdfBase64,
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
