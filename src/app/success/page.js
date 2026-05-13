'use client';
import { useState } from 'react';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default function SuccessPage() {
  const [lang, setLang] = useState('en');

  return (
    <main className="min-h-screen bg-[#0a0e17] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none" />
      <div className="relative max-w-sm w-full text-center bg-white/[0.03] border border-white/8 rounded-2xl p-8 backdrop-blur-sm">
        <LanguageSwitcher lang={lang} onLangChange={setLang} />

        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mt-6 mb-5 ring-1 ring-emerald-500/20">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{t(lang, 'successTitle')}</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">{t(lang, 'successDesc')}</p>

        <Link
          href="/"
          className="block w-full py-3.5 bg-indigo-500 text-white font-semibold rounded-2xl text-sm hover:bg-indigo-400 transition-all duration-200 shadow-lg shadow-indigo-500/20"
        >
          {t(lang, 'backToHome')}
        </Link>
      </div>
    </main>
  );
}
