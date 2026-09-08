import { NextResponse } from 'next/server';
import { signData } from '@/lib/auth';

// Dealer-authenticated endpoint that signs a sign-link payload server-side.
// The returned token is verified by /api/generate-pdf and /api/submit-onboarding,
// so a client cannot tamper with recipient emails or form data embedded in the link.
export async function POST(request) {
  try {
    const { payload } = await request.json();
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const token = await signData(payload);
    return NextResponse.json({ token });
  } catch (err) {
    console.error('create-sign-link error:', err);
    return NextResponse.json({ error: 'Failed to create sign link' }, { status: 500 });
  }
}
