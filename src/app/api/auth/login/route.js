import { NextResponse } from 'next/server';
import { createToken, getAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { password } = await request.json();
    const expected = process.env.LOGIN_PASSWORD;

    if (!expected) {
      return NextResponse.json({ error: 'Login not configured' }, { status: 500 });
    }

    if (password !== expected) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = await createToken();
    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', getAuthCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
