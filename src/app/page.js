'use client';
import { useState, useCallback } from 'react';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TemplateSelector from '@/components/TemplateSelector';
import DynamicForm from '@/components/DynamicForm';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function HomePage() {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('cgsi-lang') || 'en';
    return 'en';
  });
  const [templateId, setTemplateId] = useState(null);
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
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}/sign?d=${encodeURIComponent(base64)}`;
    setLink(url);
  }, [templateId, formData]);

  const copyLink = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
  }, [link]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">{t(lang, 'appTitle')}</h1>
          <LanguageSwitcher lang={lang} onLangChange={handleLangChange} />
        </div>

        {!link ? (
          <>
            <TemplateSelector lang={lang} selected={templateId} onSelect={setTemplateId} />

            {templateId && (
              <div className="mt-6">
                <DynamicForm
                  lang={lang}
                  templateId={templateId}
                  formData={formData}
                  onChange={handleFieldChange}
                />
                <button
                  onClick={generateLink}
                  className="w-full mt-6 py-3.5 bg-green-600 text-white font-semibold rounded-xl text-base hover:bg-green-700 active:scale-[0.98] transition-all"
                >
                  {t(lang, 'generateLink')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t(lang, 'linkReady')}</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-600 break-all select-all">{link}</p>
            </div>
            <button
              onClick={copyLink}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 active:scale-[0.98] transition-all mb-2"
            >
              {t(lang, 'copyLink')}
            </button>
            <p className="text-xs text-amber-600">{t(lang, 'linkExpires')}</p>
            <p className="text-xs text-gray-400 mt-3">{t(lang, 'sendToClient')}</p>
            <button
              onClick={() => { setLink(''); setTemplateId(null); setFormData({}); }}
              className="mt-4 text-sm text-blue-600 font-medium"
            >
              {t(lang, 'backToHome')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
