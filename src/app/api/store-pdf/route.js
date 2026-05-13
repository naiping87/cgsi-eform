import { NextResponse } from 'next/server';
import { getTemplate } from '@/lib/templates';
import { SIGNATURE_ANCHORS } from '@/lib/coordinates';
import { findSignaturePosition } from '@/lib/pdf-search';

// In-memory PDF store
const store = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expires < now) store.delete(id);
  }
}, 10 * 60 * 1000);

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
    const id = 'pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    store.set(id, {
      buffer,
      templateId,
      filename: file.name || 'form.pdf',
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    // Detect signature positions from the uploaded PDF
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

    console.log(`Stored PDF ${id}, sig positions:`, sigPositions);

    return NextResponse.json({
      success: true,
      id,
      sigCount: template.sigCount,
      sigPositions,
    });
  } catch (err) {
    console.error('Store PDF failed:', err);
    return NextResponse.json({ error: 'Failed to store PDF' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || !store.has(id)) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }
  const entry = store.get(id);
  return NextResponse.json({ found: true, templateId: entry.templateId, filename: entry.filename });
}

export { store };
