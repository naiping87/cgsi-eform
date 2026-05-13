import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename, addSignaturesToPdf } from '@/lib/pdf-generator';
import { sendPDFByEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, formData, signatures, overrides, positions, pdfBase64, sigOffsets } = body;

    // Signature buffer extraction
    const sigBuffers = (signatures || []).map(sig => {
      if (!sig) return null;
      const base64 = sig.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    }).filter(Boolean);

    let pdfBuffer, filename;

    if (pdfBase64) {
      // Use the uploaded PDF from the link (base64 encoded)
      const uploadedBuffer = Buffer.from(pdfBase64, 'base64');
      pdfBuffer = await addSignaturesToPdf(uploadedBuffer, templateId, sigBuffers, sigOffsets || []);
      filename = 'signed_form.pdf';
    } else if (templateId && formData) {
      // Fallback: generate from template + formData
      pdfBuffer = await generatePDF(templateId, formData, sigBuffers, { overrides: overrides || {}, positions: positions || {} });
      filename = getPDFFilename(templateId, formData);
    } else {
      return NextResponse.json({ error: 'Missing PDF data or template' }, { status: 400 });
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

    const resultBase64 = pdfBuffer.toString('base64');
    return NextResponse.json({
      success: true,
      filename,
      pdfBase64: resultBase64,
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
