'use client';
import { useState } from 'react';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default function SuccessPage() {
  const [lang, setLang] = useState('en');

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <LanguageSwitcher lang={lang} onLangChange={setLang} />
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t(lang, 'successTitle')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t(lang, 'successDesc')}</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors"
        >
          {t(lang, 'backToHome')}
        </Link>
      </div>
    </main>
  );
}
