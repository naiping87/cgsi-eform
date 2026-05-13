import { NextResponse } from 'next/server';
import { getTemplate } from '@/lib/templates';
import { SIGNATURE_ANCHORS } from '@/lib/coordinates';
import { findSignaturePosition } from '@/lib/pdf-search';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TMP_DIR = path.join(os.tmpdir(), 'cgsi-pdfs');

// Ensure tmp dir exists
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

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

    // Save to /tmp (persists within Vercel instance)
    const filePath = path.join(TMP_DIR, id + '.pdf');
    fs.writeFileSync(filePath, buffer);

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

    console.log(`Stored PDF ${id} at ${filePath}, sig positions:`, sigPositions);

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

export function getPdfPath(id) {
  return path.join(TMP_DIR, id + '.pdf');
}

export function pdfExists(id) {
  return fs.existsSync(getPdfPath(id));
}

export function readPdf(id) {
  return fs.readFileSync(getPdfPath(id));
}
