// Auth utilities — compatible with both Edge (middleware) and Node.js (API routes)
const COOKIE_NAME = 'cgsi-auth';
const SESSION_DAYS = 1;

function getSecret() {
  return process.env.LOGIN_PASSWORD || 'change-me';
}

function base64url(buf) {
  if (typeof buf === 'string') {
    return btoa(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // Uint8Array → base64url
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function parseBase64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Web Crypto HMAC-SHA256
async function hmac(key, data) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, typeof data === 'string' ? enc.encode(data) : data);
  return new Uint8Array(sig);
}

// Create a signed token: base64url(payload).base64url(signature)
export async function createToken() {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 });
  const payloadB64 = base64url(payload);
  const sig = await hmac(getSecret(), payloadB64);
  return `${payloadB64}.${base64url(sig)}`;
}

// Verify a signed token. Returns true if valid and not expired.
export async function verifyToken(token) {
  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return false;

    const expectedSig = await hmac(getSecret(), payloadB64);
    const actualSig = parseBase64url(sigB64);

    // Constant-time comparison
    if (expectedSig.length !== actualSig.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) diff |= expectedSig[i] ^ actualSig[i];
    if (diff !== 0) return false;

    const payload = JSON.parse(new TextDecoder().decode(parseBase64url(payloadB64)));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getAuthCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

export function getClearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`;
}

export { COOKIE_NAME };
