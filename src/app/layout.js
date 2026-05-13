export const metadata = {
  title: 'CGSI E-Form',
  description: 'CGSI Electronic Form System',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#f8fafc" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
