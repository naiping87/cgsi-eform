'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { t } from '@/lib/i18n';
import { getTemplate } from '@/lib/templates';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FormPreview from '@/components/FormPreview';

const SignaturePad = dynamic(() => import('@/components/SignaturePad'), {
  ssr: false,
  loading: () => (
    <div className="sig-container" style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p className="text-caption">Loading signature pad...</p>
    </div>
  ),
});

const decodeBase64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));

// Remove white/light background from signature image, preserving anti-aliased edges
function removeWhiteBackground(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Make white/light-gray pixels transparent, keep stroke anti-aliasing
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0;
        } else if (r > 200 && g > 200 && b > 200) {
          // Partial transparency for anti-aliased edges
          const brightness = (r + g + b) / 3;
          data[i + 3] = Math.round(255 * (1 - (brightness - 200) / 55));
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

function SignPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encoded = searchParams.get('d');

  const [lang, setLang] = useState('en');
  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);
  }, []);

  const [data, setData] = useState(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!encoded) { setError(true); return; }
    try {
      const json = decodeBase64(decodeURIComponent(encoded));
      const parsed = JSON.parse(json);
      if (Date.now() > parsed.x) { setExpired(true); return; }
      setData(parsed);
    } catch { setError(true); }
  }, [encoded]);

  const handleSignatureChange = useCallback((i) => (dataUrl) => {
    setSignatures(prev => { const n = [...prev]; n[i] = dataUrl; return n; });
  }, []);

  const handleSubmit = useCallback(async () => {
    const tpl = getTemplate(data.t);
    const effectiveSigCount = data.sigCount || tpl.sigCount;
    const all = Array.from({ length: effectiveSigCount }, (_, i) => signatures[i]);
    if (all.some(s => !s)) { alert(t(lang, 'signatureRequired')); return; }
    setSubmitting(true);
    try {
      // Remove white background from all signatures before sending
      const processed = await Promise.all(all.map(s => removeWhiteBackground(s)));
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: data.t,
          blobUrl: data.blobUrl,
          formData: data.f || {},
          signatures: processed,
          emails: data.e || '',
          sigBoxes: data.sb || null,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        sessionStorage.setItem('cgsi-pdf-base64', result.pdfBase64 || '');
        sessionStorage.setItem('cgsi-pdf-filename', result.filename || '');
        sessionStorage.setItem('cgsi-pdf-emailSent', String(!!result.emailSent));
        sessionStorage.setItem('cgsi-pdf-emailError', result.emailError || '');
        router.push('/success');
      } else alert('Error generating PDF.');
    } catch { alert('Network error.'); }
    finally { setSubmitting(false); }
  }, [data, signatures, lang, router]);

  if (error) return <ErrorView />;
  if (expired) return <ExpiredView lang={lang} />;
  if (!data) return <LoadingView />;

  const template = getTemplate(data.t);
  const effectiveSigCount = data.sigCount || template.sigCount;

  return (
    <main style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="bg-glow" />
      <div className="page-container">
        <div className="flex-between mb-6">
          <div>
            <h1 className="text-h1">{t(lang, 'appTitle')}</h1>
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Digital Signature</p>
          </div>
          <LanguageSwitcher lang={lang} onLangChange={setLang} />
        </div>

        <p className="text-subtitle" style={{marginBottom:8}}>{t(lang, 'previewForm')}</p>
        <FormPreview lang={lang} templateId={data.t} formData={data.f} />

        <div className="badge-warning" style={{marginTop:14,width:'100%'}}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t(lang, 'linkExpires')}: {new Date(data.x).toLocaleDateString()}
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: effectiveSigCount }, (_, i) => (
            <SignaturePad
              key={i}
              onSignatureChange={handleSignatureChange(i)}
              label={`${t(lang, 'signature')} ${i + 1} ${t(lang, 'of')} ${effectiveSigCount}`}
              t={(k) => t(lang, k)}
            />
          ))}
        </div>

        <div className="mt-6">
          <label className="checkbox-wrap">
            <input type="checkbox" required />
            <span className="checkbox-label">{t(lang, 'confirmInfo')}</span>
          </label>
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="btn-primary mt-6">
          {submitting ? (
            <><div className="spinner" /> Processing...</>
          ) : (
            <>{t(lang, 'submitSignature')}</>
          )}
        </button>
      </div>
    </main>
  );
}

function ErrorView() {
  return (
    <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="bg-glow" />
      <div className="card-highlight" style={{textAlign:'center',maxWidth:320}}>
        <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(248,113,113,0.12)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 style={{fontSize:15,fontWeight:600,color:'#f1f5f9',marginBottom:4}}>Invalid Link</h3>
        <p className="text-caption">This link is malformed or corrupted.</p>
      </div>
    </main>
  );
}

function ExpiredView({ lang }) {
  return (
    <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="bg-glow" />
      <div className="card-highlight" style={{textAlign:'center',maxWidth:340}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(251,191,36,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',border:'1px solid rgba(251,191,36,0.15)'}}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--warning)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-h2" style={{marginBottom:6}}>{t(lang, 'linkExpired')}</h2>
        <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}>{t(lang, 'linkExpiredDesc')}</p>
      </div>
    </main>
  );
}

function LoadingView() {
  return (
    <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <p className="text-caption">Loading...</p>
    </main>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <SignPageContent />
    </Suspense>
  );
}
