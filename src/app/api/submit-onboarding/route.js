import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { sendPDFByEmail } from '@/lib/mailer';
import { detectFormat, imageToGrayscale } from '@/lib/image-utils';

/**
 * Convert image buffer to grayscale by iterating pixels.
 * Works for JPEG and PNG buffers. Returns a JPEG buffer.
 */
async function toGrayscaleJpeg(imageBuffer, format) {
  try {
    // Use a simple approach: create a PDF page with the image,
    // but actually we'll just pass the buffer through.
    // Full pixel-level grayscale conversion requires a native image lib.
    // For now, return the buffer as-is (most IC photos are already grayscale-friendly).
    return imageBuffer;
  } catch { return imageBuffer; }
}

/**
 * Merge IC front and back onto a single A4 page, top-bottom layout.
 * Both images are scaled to fit half the page each.
 */
async function mergeICFrontBack(frontBuf, backBuf, frontFormat, backFormat) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 portrait
  const halfH = (page.getHeight() - 60) / 2;

  let frontImg, backImg;
  if (frontFormat === 'png') frontImg = await doc.embedPng(frontBuf);
  else frontImg = await doc.embedJpg(frontBuf);
  if (backFormat === 'png') backImg = await doc.embedPng(backBuf);
  else backImg = await doc.embedJpg(backBuf);

  // Top half — IC Front
  const fScale = Math.min((page.getWidth() - 80) / frontImg.width, halfH / frontImg.height);
  const fw = frontImg.width * fScale;
  const fh = frontImg.height * fScale;
  const fx = (page.getWidth() - fw) / 2;
  const fy = page.getHeight() - 40 - fh;

  // Bottom half — IC Back
  const bScale = Math.min((page.getWidth() - 80) / backImg.width, halfH / backImg.height);
  const bw = backImg.width * bScale;
  const bh = backImg.height * bScale;
  const bx = (page.getWidth() - bw) / 2;
  const by = fy - 20 - bh;

  page.drawImage(frontImg, { x: fx, y: fy, width: fw, height: fh });
  page.drawImage(backImg, { x: bx, y: by, width: bw, height: bh });

  // Label
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('IC Front', { x: fx, y: fy + fh + 4, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('IC Back', { x: bx, y: by + bh + 4, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

  return Buffer.from(await doc.save());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { formData, fileUrls, dealerEmail } = body;

    // ===== Generate info sheet PDF =====
    const infoDoc = await PDFDocument.create();
    const font = await infoDoc.embedFont(StandardFonts.Helvetica);
    let page = infoDoc.addPage([595, 842]);
    const pw = page.getWidth();
    let y = page.getHeight() - 50;

    function wl(label, value, bold) {
      if (y < 60) { page = infoDoc.addPage([595, 842]); y = page.getHeight() - 50; }
      page.drawText(label + ':', { x: 40, y, size: bold ? 11 : 9, font, color: bold ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3) });
      page.drawText(value || '—', { x: 200, y, size: 10, font, color: rgb(0, 0, 0), maxWidth: 350 });
      y -= bold ? 24 : 18;
    }
    function sec(title) {
      if (y < 80) { page = infoDoc.addPage([595, 842]); y = page.getHeight() - 50; }
      page.drawText(title, { x: 40, y, size: 13, font, color: rgb(0, 0, 0) });
      y -= 22;
      page.drawLine({ start: { x: 40, y }, end: { x: pw - 40, y }, color: rgb(0.8, 0.8, 0.8), thickness: 1 });
      y -= 10;
    }

    sec('Personal Details');
    wl('Full Name', formData?.fullName, true);
    wl('Marital Status', formData?.maritalStatus);
    wl('Email', formData?.email);
    wl('Mobile Number', formData?.mobileNo);
    wl('Mailing Address', formData?.mailingAddress);

    sec('Emergency Contact');
    wl('Full Name', formData?.emergencyName, true);
    wl('Mobile Number', formData?.emergencyMobile);
    wl('Relationship', formData?.emergencyRelation);

    sec('Employment');
    wl('Company Name', formData?.companyName, true);
    wl('Occupation', formData?.occupation);
    wl('Nature of Business', formData?.natureOfBiz);
    wl('Years in Employment', formData?.yearsEmployed);
    wl('Office Address', formData?.officeAddress);
    wl('Office Phone', formData?.officePhone);
    wl('Income Tax Number', formData?.incomeTaxNo);

    const infoBuf = Buffer.from(await infoDoc.save());

    // ===== Fetch files and build merge items =====
    const mergeItems = [{ buffer: infoBuf, type: 'pdf' }];
    let icFrontBuf = null, icBackBuf = null, icFrontFmt = null, icBackFmt = null;

    for (const [key, url] of Object.entries(fileUrls || {})) {
      if (!url) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) { console.warn(`Fetch ${key}: ${res.status}`); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        const fmt = detectFormat(buf);

        if (key === 'icFront') {
          const gray = await imageToGrayscale(buf);
          icFrontBuf = gray ? gray.buffer : buf;
          icFrontFmt = 'jpeg';
        } else if (key === 'icBack') {
          const gray = await imageToGrayscale(buf);
          icBackBuf = gray ? gray.buffer : buf;
          icBackFmt = 'jpeg';
        }
        else if (fmt === 'pdf') { mergeItems.push({ buffer: buf, type: 'pdf' }); }
        else if (fmt === 'png' || fmt === 'jpeg') { mergeItems.push({ buffer: buf, type: 'image', format: fmt }); }
      } catch (e) { console.warn(`Process ${key}:`, e.message); }
    }

    // ===== Merge IC front + back onto one page (top-bottom, A4) =====
    if (icFrontBuf && icBackBuf) {
      const icMergedBuf = await mergeICFrontBack(icFrontBuf, icBackBuf, icFrontFmt, icBackFmt);
      mergeItems.push({ buffer: icMergedBuf, type: 'pdf' });
    } else {
      if (icFrontBuf) mergeItems.push({ buffer: icFrontBuf, type: 'image', format: icFrontFmt || 'jpeg' });
      if (icBackBuf) mergeItems.push({ buffer: icBackBuf, type: 'image', format: icBackFmt || 'jpeg' });
    }

    // ===== Merge all into single PDF =====
    const mergedPdf = await mergeAll(mergeItems);

    // ===== Email =====
    let emailResult = { success: false, error: 'No email configured' };
    const recipient = dealerEmail || process.env.TO_EMAIL || process.env.SMTP_USER;
    if (recipient) {
      const name = (formData?.fullName || 'Customer').replace(/[<>:"/\\|?*]/g, '').trim();
      try {
        await sendPDFByEmail(mergedPdf, `onboarding_${name.replace(/\s+/g, '_')}.pdf`, recipient);
        emailResult = { success: true };
      } catch (e) { emailResult = { success: false, error: e.message }; }
    }

    return NextResponse.json({ success: true, emailSent: emailResult.success, emailError: emailResult.error || null });
  } catch (err) {
    console.error('submit-onboarding error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Local merge function (avoids circular dependency with pdf-merger's pdf-lib version)
async function mergeAll(items) {
  if (items.length === 0) throw new Error('No items to merge');
  const mergedDoc = await PDFDocument.create();
  for (const item of items) {
    if (item.type === 'pdf') {
      const src = await PDFDocument.load(item.buffer);
      const pages = await mergedDoc.copyPages(src, src.getPageIndices());
      pages.forEach((p) => mergedDoc.addPage(p));
    } else if (item.type === 'image') {
      const page = mergedDoc.addPage([595, 842]);
      let img;
      if (item.format === 'png') img = await mergedDoc.embedPng(item.buffer);
      else img = await mergedDoc.embedJpg(item.buffer);
      const s = Math.min((page.getWidth() - 80) / img.width, (page.getHeight() - 80) / img.height);
      page.drawImage(img, { x: (page.getWidth() - img.width * s) / 2, y: (page.getHeight() - img.height * s) / 2, width: img.width * s, height: img.height * s });
    }
  }
  return Buffer.from(await mergedDoc.save());
}
