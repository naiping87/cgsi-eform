'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SuccessPage() {
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const [pdfBase64, setPdfBase64] = useState(null);
  const [filename, setFilename] = useState('');
  const [emailSent, setEmailSent] = useState(null);
  const [emailError, setEmailError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);

    setPdfBase64(sessionStorage.getItem('cgsi-pdf-base64') || null);
    setFilename(sessionStorage.getItem('cgsi-pdf-filename') || '');
    const es = sessionStorage.getItem('cgsi-pdf-emailSent');
    setEmailSent(es ? es === 'true' : null);
    setEmailError(sessionStorage.getItem('cgsi-pdf-emailError') || null);
  }, []);

  const handleClose = () => {
    // window.close() only works for windows opened by JS.
    // Fall back to redirecting home.
    if (window.opener) {
      window.close();
    } else {
      router.push('/');
    }
  };

  const downloadPDF = () => {
    if (!pdfBase64) return;
    const byteChars = atob(pdfBase64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    const byteArr = new Uint8Array(byteNums);
    const blob = new Blob([byteArr], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'signed-form.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="bg-glow" />
      <div style={{position:'relative',maxWidth:360,width:'100%'}}>
        <LanguageSwitcher lang={lang} onLangChange={setLang} />

        <div className="card-highlight" style={{textAlign:'center',marginTop:20}}>
          <div className="success-circle" style={{margin:'0 auto 20px'}}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-h2" style={{marginBottom:6}}>{t(lang, 'successTitle')}</h2>
          <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:8}}>
            {t(lang, 'successDesc')}
          </p>

          {/* Email status */}
          {emailSent === false && (
            <div className="badge-warning" style={{marginBottom:16,justifyContent:'center',width:'100%'}}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Email not sent: {emailError || 'SMTP not configured'}
            </div>
          )}
          {emailSent === true && (
            <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:'var(--radius-sm)',background:'var(--success-glow)',border:'1px solid rgba(52,211,153,0.15)',fontSize:12,color:'var(--success)',marginBottom:16}}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Email sent successfully
            </div>
          )}

          {/* PDF action buttons */}
          {pdfBase64 && (
            <button onClick={downloadPDF} className="btn-primary" style={{marginBottom:8}}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {t(lang, 'downloadPDF') || 'Download PDF'}
            </button>
          )}
          <button
            onClick={handleClose}
            className="btn-secondary"
            style={{marginTop:8,textDecoration:'none',display:'flex'}}
          >
            {t(lang, 'closePage') || 'Close Page'}
          </button>
        </div>
      </div>
    </main>
  );
}
