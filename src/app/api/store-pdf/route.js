import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getTemplate } from '@/lib/templates';
import { SIGNATURE_ANCHORS } from '@/lib/coordinates';
import { findSignaturePosition } from '@/lib/pdf-search';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');
    const templateId = formData.get('templateId');

    if (!file || !templateId) {
      return NextResponse.json({ error: 'Missing PDF file or templateId' }, { status: 400 });
    }

    const template = getTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = 'pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    // Store in Vercel Blob
    const blob = await put(id, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Detect signature positions
    const anchorConfigs = SIGNATURE_ANCHORS[templateId] || [];
    const sigPositions = [];

    for (const cfg of anchorConfigs) {
      try {
        const pos = await findSignaturePosition(buffer, cfg, { width: 595, height: 842 });
        sigPositions.push({
          x: Math.round(pos.x),
          y: Math.round(pos.y),
          page: cfg.page,
          anchor: cfg.anchors?.[0] || 'unknown',
        });
      } catch {
        sigPositions.push({ x: cfg.fallbackX || 0, y: cfg.fallbackY || 0, page: cfg.page, anchor: 'fallback' });
      }
    }

    return NextResponse.json({
      success: true,
      blobUrl: blob.url,
      sigCount: template.sigCount,
      sigPositions,
    });
  } catch (err) {
    console.error('Store PDF failed:', err);
    return NextResponse.json({ error: 'Failed to store PDF' }, { status: 500 });
  }
}
