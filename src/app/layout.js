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
        <meta name="theme-color" content="#06080d" />
        <style>{`
          /* ===== RESET ===== */
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

          /* ===== VARIABLES ===== */
          :root{
            --bg:#06080d;
            --bg-card:rgba(255,255,255,0.02);
            --bg-card-hover:rgba(255,255,255,0.04);
            --bg-input:#0c1018;
            --border:rgba(255,255,255,0.06);
            --border-focus:#818cf8;
            --accent:#818cf8;
            --accent-glow:rgba(129,140,248,0.15);
            --success:#34d399;
            --success-glow:rgba(52,211,153,0.15);
            --warning:#fbbf24;
            --danger:#f87171;
            --text:#e2e8f0;
            --text-secondary:#94a3b8;
            --text-muted:#64748b;
            --radius:14px;
            --radius-sm:10px;
            --radius-xs:6px;
            --font:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
          }

          /* ===== BASE ===== */
          body{
            font-family:var(--font);
            background:var(--bg);
            color:var(--text);
            min-height:100vh;
            -webkit-font-smoothing:antialiased;
            -webkit-tap-highlight-color:transparent;
            line-height:1.5;
          }

          /* ===== BACKGROUND EFFECTS ===== */
          .bg-glow{
            position:fixed;inset:0;pointer-events:none;z-index:0;
            background:
              radial-gradient(ellipse 80% 50% at 50% -20%,rgba(129,140,248,0.06),transparent),
              radial-gradient(ellipse 60% 40% at 100% 80%,rgba(52,211,153,0.04),transparent);
          }

          /* ===== SCROLLBAR ===== */
          ::-webkit-scrollbar{width:3px}
          ::-webkit-scrollbar-track{background:transparent}
          ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:99px}

          /* ===== TYPOGRAPHY ===== */
          .text-h1{font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#f8fafc}
          .text-h2{font-size:16px;font-weight:600;letter-spacing:-0.01em;color:#f1f5f9}
          .text-subtitle{font-size:11px;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em}
          .text-body{font-size:14px;color:var(--text-secondary)}
          .text-caption{font-size:12px;color:var(--text-muted)}
          .text-label{font-size:12px;font-weight:500;color:var(--text-secondary)}

          /* ===== FORM ELEMENTS ===== */
          input,select,textarea{
            font-size:15px;font-family:var(--font);background:var(--bg-input);
            color:var(--text);border:1px solid var(--border);border-radius:var(--radius-sm);
            padding:12px 14px;width:100%;outline:none;
            transition:border-color 0.2s,box-shadow 0.2s;
          }
          input::placeholder,textarea::placeholder{color:var(--text-muted)}
          input:focus,select:focus,textarea:focus{
            border-color:var(--border-focus);
            box-shadow:0 0 0 3px var(--accent-glow);
          }
          textarea{resize:vertical;min-height:80px}
          select{
            appearance:none;cursor:pointer;
            background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat:no-repeat;background-position:right 12px center;padding-right:38px;
          }
          select option{background:#111827;color:var(--text)}

          /* ===== CARD ===== */
          .card{
            background:var(--bg-card);border:1px solid var(--border);
            border-radius:var(--radius);padding:16px;
            backdrop-filter:blur(12px);
          }
          .card-highlight{
            background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
            border-radius:var(--radius);padding:16px;
            box-shadow:0 4px 24px rgba(0,0,0,0.2);
          }

          /* ===== BUTTONS ===== */
          .btn-primary{
            display:flex;align-items:center;justify-content:center;gap:8px;
            width:100%;padding:14px 20px;
            background:var(--accent);color:#fff;
            font-size:15px;font-weight:600;font-family:var(--font);
            border:none;border-radius:var(--radius);
            cursor:pointer;transition:all 0.2s;
            box-shadow:0 4px 16px var(--accent-glow);
          }
          .btn-primary:hover{background:#9ca3f0;transform:translateY(-1px)}
          .btn-primary:active{transform:scale(0.98)}
          .btn-primary:disabled{background:rgba(255,255,255,0.06);color:var(--text-muted);box-shadow:none;cursor:not-allowed;transform:none}
          .btn-secondary{
            display:flex;align-items:center;justify-content:center;gap:8px;
            width:100%;padding:13px 20px;
            background:rgba(255,255,255,0.06);color:var(--text);
            font-size:14px;font-weight:500;font-family:var(--font);
            border:1px solid var(--border);border-radius:var(--radius);
            cursor:pointer;transition:all 0.2s;
          }
          .btn-secondary:hover{background:rgba(255,255,255,0.1)}
          .btn-secondary:active{transform:scale(0.98)}

          /* ===== TEMPLATE CARD ===== */
          .template-card{
            display:flex;align-items:center;gap:14px;
            width:100%;padding:14px;
            background:var(--bg-card);border:1px solid var(--border);
            border-radius:var(--radius);cursor:pointer;
            transition:all 0.2s;text-align:left;
            font-family:var(--font);color:var(--text);
          }
          .template-card:hover{background:var(--bg-card-hover);border-color:rgba(255,255,255,0.1);}
          .template-card.selected{
            background:rgba(129,140,248,0.06);border-color:rgba(129,140,248,0.3);
            box-shadow:0 0 0 1px rgba(129,140,248,0.1);
          }
          .template-icon{
            width:42px;height:42px;border-radius:var(--radius-xs);
            display:flex;align-items:center;justify-content:center;flex-shrink:0;
          }
          .template-icon.indigo{background:rgba(129,140,248,0.12);color:#a5b4fc}
          .template-icon.emerald{background:rgba(52,211,153,0.12);color:#6ee7b7}
          .template-icon.amber{background:rgba(251,191,36,0.12);color:#fcd34d}
          .template-icon.rose{background:rgba(248,113,113,0.12);color:#fca5a5}
          .template-name{font-size:14px;font-weight:600;color:#f1f5f9}
          .template-meta{font-size:12px;color:var(--text-muted);margin-top:2px}
          .radio-circle{
            width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,0.12);
            display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;
          }
          .radio-circle.checked{border-color:var(--accent);background:var(--accent)}

          /* ===== LANGUAGE SWITCHER ===== */
          .lang-switch{
            display:inline-flex;gap:2px;padding:3px;
            background:rgba(255,255,255,0.04);border-radius:99px;
            border:1px solid var(--border);
          }
          .lang-btn{
            padding:6px 14px;border-radius:99px;font-size:12px;font-weight:600;
            border:none;cursor:pointer;transition:all 0.2s;
            background:transparent;color:var(--text-muted);
            font-family:var(--font);
          }
          .lang-btn.active{background:var(--accent);color:#fff;box-shadow:0 2px 8px var(--accent-glow)}

          /* ===== SIGNATURE AREA ===== */
          .sig-container{
            border:1px solid var(--border);border-radius:var(--radius);
            overflow:hidden;background:#f8fafc;
          }
          .sig-header{
            display:flex;justify-content:space-between;align-items:center;
            margin-bottom:6px;padding:0 2px;
          }
          .sig-label{font-size:12px;font-weight:500;color:var(--text-secondary)}
          .sig-clear{font-size:12px;font-weight:500;color:var(--danger);background:none;border:none;cursor:pointer;font-family:var(--font)}
          .sig-clear:hover{color:#fca5a5}
          .sig-hint{font-size:11px;color:var(--text-muted);text-align:center;margin-top:6px}

          /* ===== FORM PREVIEW ===== */
          .preview-card{
            background:rgba(255,255,255,0.02);border:1px solid var(--border);
            border-radius:var(--radius);padding:16px;
          }
          .preview-title{font-size:13px;font-weight:600;color:#f1f5f9;margin-bottom:10px;display:flex;align-items:center;gap:8px}
          .preview-row{display:flex;font-size:12px;padding:3px 0}
          .preview-key{color:var(--text-muted);width:45%;flex-shrink:0}
          .preview-val{color:var(--text);font-weight:500}

          /* ===== STATUS BADGES ===== */
          .badge-warning{
            display:inline-flex;align-items:center;gap:6px;
            padding:8px 14px;border-radius:var(--radius-sm);
            background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.15);
            font-size:12px;color:var(--warning);
          }

          /* ===== SUCCESS STATE ===== */
          .success-circle{
            width:72px;height:72px;border-radius:50%;
            background:var(--success-glow);display:flex;
            align-items:center;justify-content:center;margin:0 auto;
            border:1px solid rgba(52,211,153,0.2);
          }

          /* ===== CHECKBOX ===== */
          .checkbox-wrap{
            display:flex;align-items:flex-start;gap:10px;cursor:pointer;
            padding:14px;border-radius:var(--radius-sm);
            background:rgba(255,255,255,0.02);border:1px solid var(--border);
          }
          .checkbox-wrap input[type=checkbox]{
            width:18px;height:18px;accent-color:var(--accent);cursor:pointer;margin-top:1px;flex-shrink:0;
          }
          .checkbox-label{font-size:12px;color:var(--text-secondary);line-height:1.6;cursor:pointer}

          /* ===== LINK DISPLAY ===== */
          .link-box{
            background:rgba(0,0,0,0.3);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:12px 14px;
            font-size:11px;color:var(--text-secondary);word-break:break-all;
            font-family:'SF Mono',monospace;line-height:1.6;
          }
          .link-copied{
            background:var(--success-glow);border-color:rgba(52,211,153,0.3);
            color:var(--success);
          }

          /* ===== PAGE LAYOUT ===== */
          .page-container{position:relative;max-width:448px;margin:0 auto;padding:24px 16px}

          /* ===== SPACING ===== */
          .mt-6{margin-top:24px}.mt-8{margin-top:32px}.mb-4{margin-bottom:16px}.mb-6{margin-bottom:24px}
          .gap-2{gap:8px}.gap-3{gap:12px}.gap-4{gap:16px}
          .space-y-2>*+*{margin-top:8px}.space-y-3>*+*{margin-top:12px}
          .flex-between{display:flex;justify-content:space-between;align-items:center}
          .flex-center{display:flex;align-items:center;justify-content:center}
          .flex-col{display:flex;flex-direction:column}
          .inline-flex{display:inline-flex;align-items:center}

          /* ===== ANIMATIONS ===== */
          @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
          @keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          .animate-in{animation:fadeInUp 0.4s ease forwards;opacity:0}
          .animate-scale{animation:scaleIn 0.3s ease forwards}
          .stagger-1{animation-delay:0.05s}.stagger-2{animation-delay:0.1s}
          .stagger-3{animation-delay:0.15s}.stagger-4{animation-delay:0.2s}

          canvas{touch-action:none;border-radius:0}

          /* ===== SPINNER ===== */
          .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite}

          /* ===== SECTION HEADER ===== */
          .section-header{margin-bottom:16px}
          .section-header h1{font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.02em;margin-bottom:2px}
          .section-header p{font-size:12px;color:var(--text-muted)}

          /* ===== DIVIDER ===== */
          .divider{height:1px;background:var(--border);margin:20px 0}
        `}</style>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
