'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function DynamicForm({ lang, templateId, formData, onChange }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div style={{marginTop:28}}>
      <p className="text-subtitle" style={{marginBottom:4}}>{t(lang, 'step2')}</p>
      <p className="text-caption" style={{marginBottom:16}}>{t(lang, 'fillInfo')}</p>
      <div className="space-y-3">
        {template.fields.map((field) => (
          <div key={field.key}>
            <label className="text-label" style={{display:'block',marginBottom:6,marginLeft:2}}>
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
