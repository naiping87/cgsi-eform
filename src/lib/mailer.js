import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPDFByEmail(pdfBuffer, filename) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.TO_EMAIL,
    subject: `Signed Form: ${filename}`,
    text: `A client has signed the form.\n\nForm: ${filename}\n\nPlease find the signed PDF attached.`,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
