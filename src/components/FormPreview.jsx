'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function FormPreview({ lang, templateId, formData }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div className="preview-card">
      <div className="preview-title">
        <span style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',flexShrink:0}} />
        {template.name}
      </div>
      <div>
        {template.fields.map((field) => {
          const value = formData[field.key];
          if (!value) return null;
          let displayValue = value;
          if (field.type === 'select' && field.options) {
            const opt = field.options.find(o => o.value === value);
            displayValue = opt ? opt.label : value;
          }
          return (
            <div key={field.key} className="preview-row">
              <span className="preview-key">{t(lang, field.key)}</span>
              <span className="preview-val">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
