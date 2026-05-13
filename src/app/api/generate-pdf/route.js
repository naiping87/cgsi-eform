import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename, addSignaturesToPdf } from '@/lib/pdf-generator';
import { sendPDFByEmail } from '@/lib/mailer';
import { pdfExists, readPdf } from '@/app/api/store-pdf/route';

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, formData, signatures, overrides, positions, pdfId, pdfBase64, sigOffsets } = body;

    const sigBuffers = (signatures || []).map(sig => {
      if (!sig) return null;
      const base64 = sig.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    }).filter(Boolean);

    let pdfBuffer, filename;
    const pdfIdFromPayload = pdfId || (body.pdfBase64 ? 'from_base64' : null);

    // Try /tmp first (fast, preserves original), then base64 fallback
    if (pdfId && pdfExists(pdfId)) {
      console.log(`Found PDF ${pdfId} in /tmp`);
      pdfBuffer = await addSignaturesToPdf(readPdf(pdfId), templateId, sigBuffers, sigOffsets || []);
      filename = 'signed_form.pdf';
    } else if (pdfBase64) {
      console.log('Using base64 fallback');
      const uploadedBuffer = Buffer.from(pdfBase64, 'base64');
      pdfBuffer = await addSignaturesToPdf(uploadedBuffer, templateId, sigBuffers, sigOffsets || []);
      filename = 'signed_form.pdf';
    } else if (templateId && formData) {
      pdfBuffer = await generatePDF(templateId, formData, sigBuffers, { overrides: overrides || {}, positions: positions || {} });
      filename = getPDFFilename(templateId, formData);
    } else {
      return NextResponse.json({ error: 'Missing PDF data or template' }, { status: 400 });
    }

    let emailSent = false;
    let emailError = null;
    try {
      await sendPDFByEmail(pdfBuffer, filename);
      emailSent = true;
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      emailError = emailErr.message || 'Unknown email error';
    }

    return NextResponse.json({
      success: true,
      filename,
      pdfBase64: pdfBuffer.toString('base64'),
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
