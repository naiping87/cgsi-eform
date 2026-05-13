'use client';
import { TEMPLATES } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function TemplateSelector({ lang, selected, onSelect }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
        {t(lang, 'step1')}
      </p>
      <div className="space-y-2">
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => onSelect(tmpl.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              selected === tmpl.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {tmpl.name}
              </div>
              <div className="text-xs text-gray-400">
                {tmpl.pages} {t(lang, 'pages')} · {tmpl.sigCount} {t(lang, 'sig')}
              </div>
            </div>
            {selected === tmpl.id && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
