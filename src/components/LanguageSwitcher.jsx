'use client';
import { LANGUAGES } from '@/lib/i18n';

export default function LanguageSwitcher({ lang, onLangChange }) {
  return (
    <div className="flex gap-1 mb-4">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => onLangChange(l.code)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            lang === l.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
