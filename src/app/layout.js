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
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: #0a0e17;
            color: #f1f5f9;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -webkit-tap-highlight-color: transparent;
          }
          input, select, textarea {
            font-size: 16px;
            font-family: inherit;
            background: #0f172a;
            color: #f1f5f9;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 12px 16px;
            width: 100%;
            outline: none;
          }
          input:focus, select:focus, textarea:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
          }
          select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 16px center;
            padding-right: 40px;
          }
          select option { background: #111827; color: #f1f5f9; }
          canvas { touch-action: none; border-radius: 12px; }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-in { animation: fadeInUp 0.4s ease forwards; opacity: 0; }
          .animate-scale { animation: scaleIn 0.3s ease forwards; }
          .stagger-1 { animation-delay: 0.05s; }
          .stagger-2 { animation-delay: 0.1s; }
          .stagger-3 { animation-delay: 0.15s; }
          .stagger-4 { animation-delay: 0.2s; }
        `}</style>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
