import { NextResponse } from 'next/server';
import { getTemplate } from '@/lib/templates';

// In-memory PDF store (persists within a server instance)
// Keyed by UUID, stores { buffer, templateId, expires }
const store = new Map();

// Clean expired entries every 10 minutes
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
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    console.log(`Stored PDF ${id} (${buffer.length} bytes) for template ${templateId}. Store size: ${store.size}`);

    return NextResponse.json({
      success: true,
      id,
      sigCount: template.sigCount,
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
