'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function DynamicForm({ lang, templateId, formData, onChange }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div className="mt-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1">
        {t(lang, 'step2')}
      </p>
      <p className="text-xs text-slate-500 mb-4">{t(lang, 'fillInfo')}</p>
      <div className="space-y-3">
        {template.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
              {t(lang, field.key)}
            </label>
            {field.type === 'select' ? (
              <select
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                <option value="">—</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                rows={3}
                className="resize-none"
              />
            ) : (
              <input
                type="text"
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
