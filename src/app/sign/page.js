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
    <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-100/5 h-40 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Loading signature pad...</p>
    </div>
  ),
});

function decodeBase64(str) {
  return new TextDecoder().decode(Uint8Array.from(atob(str), c => c.charCodeAt(0)));
}

function SignPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encoded = searchParams.get('d');

  const [lang, setLang] = useState('en');
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
      if (Date.now() > parsed.x) {
        setExpired(true);
        return;
      }
      setData(parsed);
    } catch {
      setError(true);
    }
  }, [encoded]);

  const handleSignatureChange = useCallback((index) => (sigDataUrl) => {
    setSignatures(prev => {
      const next = [...prev];
      next[index] = sigDataUrl;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const template = getTemplate(data.t);
    const allSigned = Array.from({ length: template.sigCount }, (_, i) => signatures[i]);
    if (allSigned.some(s => !s)) {
      alert(t(lang, 'signatureRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: data.t,
          formData: data.f,
          signatures: allSigned,
        }),
      });

      if (res.ok) {
        router.push('/success');
      } else {
        alert('Error generating PDF. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [data, signatures, lang, router]);

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0e17] flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none" />
        <div className="relative text-center bg-white/[0.03] border border-white/8 rounded-2xl p-8 backdrop-blur-sm">
          <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-rose-500/20">
            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium">Invalid Link</p>
          <p className="text-slate-500 text-sm mt-1">This link is malformed or corrupted.</p>
        </div>
      </main>
    );
  }

  // Expired state
  if (expired) {
    return (
      <main className="min-h-screen bg-[#0a0e17] flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none" />
        <div className="relative text-center bg-white/[0.03] border border-white/8 rounded-2xl p-8 backdrop-blur-sm max-w-sm">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-amber-500/20">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">{t(lang, 'linkExpired')}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{t(lang, 'linkExpiredDesc')}</p>
        </div>
      </main>
    );
  }

  // Loading state
  if (!data) {
    return (
      <main className="min-h-screen bg-[#0a0e17] flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none" />
        <p className="relative text-slate-500">Loading...</p>
      </main>
    );
  }

  const template = getTemplate(data.t);

  return (
    <main className="min-h-screen bg-[#0a0e17]">
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none" />
      <div className="relative max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{t(lang, 'appTitle')}</h1>
            <p className="text-xs text-slate-500 mt-1">Digital Signature</p>
          </div>
          <LanguageSwitcher lang={lang} onLangChange={setLang} />
        </div>

        {/* Form Preview */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2">{t(lang, 'previewForm')}</p>
        <FormPreview lang={lang} templateId={data.t} formData={data.f} />

        {/* Expiry warning */}
        <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-amber-400/80">
            {t(lang, 'linkExpires')}: {new Date(data.x).toLocaleDateString()}
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-6 space-y-6">
          {Array.from({ length: template.sigCount }, (_, i) => (
            <SignaturePad
              key={i}
              onSignatureChange={handleSignatureChange(i)}
              label={`${t(lang, 'signature')} ${i + 1} ${t(lang, 'of')} ${template.sigCount}`}
              t={(key) => t(lang, key)}
            />
          ))}
        </div>

        {/* Confirmation checkbox */}
        <div className="mt-5 bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 rounded accent-indigo-500" required />
            <span className="text-xs text-slate-400 leading-relaxed">{t(lang, 'confirmInfo')}</span>
          </label>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-4 py-4 bg-indigo-500 text-white font-semibold rounded-2xl text-sm hover:bg-indigo-400 disabled:bg-white/5 disabled:text-slate-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            t(lang, 'submitSignature')
          )}
        </button>
      </div>
    </main>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </main>
    }>
      <SignPageContent />
    </Suspense>
  );
}
