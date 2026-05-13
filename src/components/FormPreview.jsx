'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function FormPreview({ lang, templateId, formData }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 backdrop-blur-sm">
      <h3 className="font-semibold text-sm text-slate-200 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        {template.name}
      </h3>
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
            <div key={field.key} className="flex text-xs py-0.5">
              <span className="text-slate-500 w-2/5 flex-shrink-0">{t(lang, field.key)}</span>
              <span className="text-slate-200 font-medium truncate">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
