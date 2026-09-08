import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename, addSignaturesToPdf } from '@/lib/pdf-generator';
import { sendPDFByEmail } from '@/lib/mailer';
import { verifyData } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, signatures } = body;

    // Only trust fields from a server-signed link, so a client cannot tamper with
    // the recipient emails or form data embedded in the link.
    const payload = await verifyData(token);
    if (!payload) return NextResponse.json({ error: 'Invalid sign link' }, { status: 401 });
    if (payload.x && Date.now() > payload.x) {
      return NextResponse.json({ error: 'Sign link expired' }, { status: 410 });
    }

    const templateId = payload.t;
    const formData = payload.f || {};
    const blobUrl = payload.blobUrl;
    const emails = payload.e || '';
    const sigBoxes = payload.sb || null;
    const fileName = payload.fn || '';
    const positions = payload.p || {};

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
      pdfBuffer = await generatePDF(templateId, formData, sigBuffers, { sigBoxes, positions });
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
