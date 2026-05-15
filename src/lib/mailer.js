import nodemailer from 'nodemailer';

// Alternative Gmail SMTP hosts to try if the primary fails
const GMAIL_FALLBACKS = ['smtp.gmail.com', 'smtp.googlemail.com'];

function createTransporter(host, port, secure, user, pass) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // Shorter timeout to fail fast on DNS issues
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

export async function sendPDFByEmail(pdfBuffer, filename, recipients) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = recipients || process.env.TO_EMAIL;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass || !to) {
    throw new Error(
      'SMTP not configured. Missing: ' +
      [!host && 'SMTP_HOST', !user && 'SMTP_USER', !pass && 'SMTP_PASS', !to && 'TO_EMAIL']
        .filter(Boolean).join(', ')
    );
  }

  // If the host is a Gmail host, try fallbacks on DNS failure
  const hostsToTry = host.includes('gmail') || host.includes('googlemail')
    ? [...new Set([host, ...GMAIL_FALLBACKS])]
    : [host];

  let lastError;
  for (const h of hostsToTry) {
    try {
      const transporter = createTransporter(h, port, secure, user, pass);
      const info = await transporter.sendMail({
        from: user,
        to,
        subject: `Signed Form: ${filename}`,
        text: `A client has signed the form.\n\nForm: ${filename}\n\nPlease find the signed PDF attached.`,
        attachments: [{
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }],
      });
      transporter.close();
      return info;
    } catch (err) {
      lastError = err;
      // Only try next host if this one failed due to DNS/connection issues
      if (err.code === 'EDNS' || err.code === 'EBADNAME' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        console.warn(`SMTP host ${h} failed (${err.code}), trying next...`);
        continue;
      }
      // Auth errors or other issues — don't retry
      break;
    }
  }

  throw lastError;
}
