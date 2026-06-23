import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename, addSignaturesToPdf } from '@/lib/pdf-generator';
import { sendPDFByEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, formData, signatures, blobUrl, emails, sigBoxes, fileName } = body;

    const sigBuffers = (signatures || []).map(sig => {
      if (!sig) return null;
      const base64 = sig.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    }).filter(Boolean);

    let pdfBuffer, filename;

    if (blobUrl) {
      const res = await fetch(blobUrl);
      if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      pdfBuffer = await addSignaturesToPdf(buffer, templateId, sigBuffers, sigBoxes);
      // Use original filename if available, so dealer can easily identify which customer's form
      if (fileName) {
        const baseName = fileName.replace(/\.pdf$/i, '').replace(/[<>:"/\\|?*]/g, '').trim() || 'form';
        filename = `signed_${baseName}.pdf`;
      } else {
        filename = 'signed_form.pdf';
      }
    } else if (templateId && formData) {
      pdfBuffer = await generatePDF(templateId, formData, sigBuffers, { sigBoxes });
      filename = getPDFFilename(templateId, formData);
    } else {
      return NextResponse.json({ error: 'Missing PDF data' }, { status: 400 });
    }

    let emailSent = false;
    let emailError = null;
    try {
      await sendPDFByEmail(pdfBuffer, filename, emails);
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
