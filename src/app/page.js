'use client';
import { useState, useCallback, useEffect } from 'react';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TemplateSelector from '@/components/TemplateSelector';
import DynamicForm from '@/components/DynamicForm';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function encodeBase64(str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

export default function HomePage() {
  const [lang, setLang] = useState('en');
  const [templateId, setTemplateId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);
  }, []);
  const [formData, setFormData] = useState({});
  const [link, setLink] = useState('');

  const handleLangChange = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('cgsi-lang', newLang);
  }, []);

  const handleFieldChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const generateLink = useCallback(() => {
    const payload = {
      t: templateId,
      f: formData,
      x: Date.now() + SEVEN_DAYS,
    };
    const json = JSON.stringify(payload);
    const base64 = encodeBase64(json);
    const url = `${window.location.origin}/sign?d=${encodeURIComponent(base64)}`;
    setLink(url);
  }, [templateId, formData]);

  const copyLink = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
  }, [link]);

  return (
    <main className="min-h-screen bg-[#0a0e17]">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{t(lang, 'appTitle')}</h1>
            <p className="text-xs text-slate-500 mt-1">Digital Form System</p>
          </div>
          <LanguageSwitcher lang={lang} onLangChange={handleLangChange} />
        </div>

        {!link ? (
          <>
            <TemplateSelector lang={lang} selected={templateId} onSelect={setTemplateId} />

            {templateId && (
              <>
                <DynamicForm
                  lang={lang}
                  templateId={templateId}
                  formData={formData}
                  onChange={handleFieldChange}
                />
                <button
                  onClick={generateLink}
                  className="w-full mt-8 py-4 bg-indigo-500 text-white font-semibold rounded-2xl text-sm hover:bg-indigo-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                >
                  {t(lang, 'generateLink')}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="animate-scale mt-4 bg-white/[0.03] border border-white/8 rounded-2xl p-8 text-center backdrop-blur-sm">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-emerald-500/20">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{t(lang, 'linkReady')}</h2>
            <p className="text-xs text-slate-500 mb-4">{t(lang, 'sendToClient')}</p>

            <div className="bg-white/[0.04] border border-white/8 rounded-xl p-3 mb-4">
              <p className="text-xs text-slate-300 break-all select-all leading-relaxed">{link}</p>
            </div>

            <button
              onClick={copyLink}
              className="w-full py-3.5 bg-white/10 text-white font-semibold rounded-xl text-sm hover:bg-white/15 active:scale-[0.98] transition-all duration-200 mb-3 border border-white/5"
            >
              {t(lang, 'copyLink')}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400/80">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t(lang, 'linkExpires')}
            </div>

            <button
              onClick={() => { setLink(''); setTemplateId(null); setFormData({}); }}
              className="mt-6 text-sm text-slate-500 hover:text-slate-300 transition-colors font-medium"
            >
              ← {t(lang, 'backToHome')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
