'use client';
import { LANGUAGES } from '@/lib/i18n';

export default function LanguageSwitcher({ lang, onLangChange }) {
  return (
    <div className="lang-switch">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => onLangChange(l.code)}
          className={`lang-btn${lang === l.code ? ' active' : ''}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
