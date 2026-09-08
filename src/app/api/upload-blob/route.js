import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { verifyData } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Only a valid server-signed onboarding link may upload supporting
        // documents directly to Blob. This keeps the public onboarding
        // endpoint from becoming an anonymous file store.
        const signed = await verifyData(String(clientPayload || ''));
        if (!signed) throw new Error('Invalid onboarding link');
        if (!pathname.startsWith('onboarding/')) throw new Error('Invalid upload path');

        return {
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('upload-blob error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
