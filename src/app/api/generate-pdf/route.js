import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename } from '@/lib/pdf-generator';
import { sendPDFByEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, formData, signatures } = body;

    if (!templateId || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // signatures are base64 data URL strings, extract raw base64 part
    const sigBuffers = signatures.map(sig => {
      if (!sig) return null;
      const base64 = sig.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    }).filter(Boolean);

    const pdfBuffer = await generatePDF(templateId, formData, sigBuffers);
    const filename = getPDFFilename(templateId, formData);

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
