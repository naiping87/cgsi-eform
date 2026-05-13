import './globals.css';

export const metadata = {
  title: 'E-Form Project',
  description: 'Electronic form processing application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
