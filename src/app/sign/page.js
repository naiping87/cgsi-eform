'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { getTemplate } from '@/lib/templates';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FormPreview from '@/components/FormPreview';
import SignaturePad from '@/components/SignaturePad';

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
      const json = decodeURIComponent(atob(decodeURIComponent(encoded)));
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

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500">Invalid link.</p>
        </div>
      </main>
    );
  }

  if (expired) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏰</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t(lang, 'linkExpired')}</h2>
          <p className="text-sm text-gray-500">{t(lang, 'linkExpiredDesc')}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  const template = getTemplate(data.t);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">{t(lang, 'appTitle')}</h1>
          <LanguageSwitcher lang={lang} onLangChange={setLang} />
        </div>

        <p className="text-xs text-gray-400 font-semibold uppercase mb-2">{t(lang, 'previewForm')}</p>
        <FormPreview lang={lang} templateId={data.t} formData={data.f} />

        <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠ {t(lang, 'linkExpires')}: {new Date(data.x).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {Array.from({ length: template.sigCount }, (_, i) => (
            <SignaturePad
              key={i}
              onSignatureChange={handleSignatureChange(i)}
              label={`${t(lang, 'signature')} ${i + 1} ${t(lang, 'of')} ${template.sigCount}`}
              lang={lang}
              t={(key) => t(lang, key)}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-0.5" required />
            <span className="text-xs text-gray-600">{t(lang, 'confirmInfo')}</span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-4 py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-base hover:bg-blue-700 disabled:bg-gray-300 active:scale-[0.98] transition-all"
        >
          {submitting ? 'Processing...' : t(lang, 'submitSignature')}
        </button>
      </div>
    </main>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <SignPageContent />
    </Suspense>
  );
}
