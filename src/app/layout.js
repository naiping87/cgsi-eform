export const metadata = {
  title: 'CGSI E-Form',
  description: 'CGSI Electronic Form System',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0e17" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
