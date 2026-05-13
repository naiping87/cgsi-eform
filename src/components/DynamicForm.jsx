'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function DynamicForm({ lang, templateId, formData, onChange }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
        {t(lang, 'step2')}
      </p>
      <p className="text-xs text-gray-400 mb-3">{t(lang, 'fillInfo')}</p>
      <div className="space-y-3">
        {template.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t(lang, field.key)}
            </label>
            {field.type === 'select' ? (
              <select
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">--</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            ) : (
              <input
                type="text"
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
