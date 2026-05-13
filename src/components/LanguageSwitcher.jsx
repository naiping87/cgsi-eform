'use client';
import { LANGUAGES } from '@/lib/i18n';

export default function LanguageSwitcher({ lang, onLangChange }) {
  return (
    <div className="inline-flex gap-0.5 bg-white/5 rounded-full p-0.5 backdrop-blur-sm border border-white/5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => onLangChange(l.code)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            lang === l.code
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
