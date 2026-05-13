import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename } from '@/lib/pdf-generator';
import { COORDINATES } from '@/lib/coordinates';
import { getTemplate } from '@/lib/templates';

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, formData, overrides } = body;

    if (!templateId || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate preview PDF (no signatures)
    const pdfBuffer = await generatePDF(templateId, formData, [], overrides || {});
    const filename = getPDFFilename(templateId, formData);

    // Return current field positions so UI can show calibration controls
    const coord = COORDINATES[templateId];
    const template = getTemplate(templateId);
    const fields = template ? template.fields.map(f => ({
      key: f.key,
      label: f.labelKey,
      x: coord?.fields?.[f.key]?.x || 0,
      y: coord?.fields?.[f.key]?.y || 0,
      page: coord?.fields?.[f.key]?.page || 0,
    })) : [];

    return NextResponse.json({
      pdfBase64: pdfBuffer.toString('base64'),
      filename,
      fields,
    });
  } catch (err) {
    console.error('Preview PDF failed:', err);
    return NextResponse.json({ error: 'Preview generation failed' }, { status: 500 });
  }
}
