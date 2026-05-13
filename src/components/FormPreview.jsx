'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function FormPreview({ lang, templateId, formData }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h3 className="font-semibold text-sm text-gray-800 mb-2">{template.name}</h3>
      <div className="space-y-1.5">
        {template.fields.map((field) => {
          const value = formData[field.key];
          if (!value) return null;
          let displayValue = value;
          if (field.type === 'select' && field.options) {
            const opt = field.options.find(o => o.value === value);
            displayValue = opt ? opt.label : value;
          }
          return (
            <div key={field.key} className="flex text-xs">
              <span className="text-gray-400 w-1/3 flex-shrink-0">{t(lang, field.key)}:</span>
              <span className="text-gray-800 font-medium truncate">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
