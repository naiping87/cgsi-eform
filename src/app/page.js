'use client';
import { useState, useCallback, useEffect } from 'react';
import { t } from '@/lib/i18n';
import { getTemplate } from '@/lib/templates';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TemplateSelector from '@/components/TemplateSelector';
import DynamicForm from '@/components/DynamicForm';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const encodeBase64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

function loadCalibration(templateId) {
  try {
    const raw = localStorage.getItem(`cgsi-cal-${templateId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCalibration(templateId, cal) {
  localStorage.setItem(`cgsi-cal-${templateId}`, JSON.stringify(cal));
}

export default function HomePage() {
  const [lang, setLang] = useState('en');
  const [templateId, setTemplateId] = useState(null);
  const [formData, setFormData] = useState({});
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [calFields, setCalFields] = useState([]);
  const [showCal, setShowCal] = useState(false);
  const [calibration, setCalibration] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);

    // Load saved calibration for selected template
    if (templateId) {
      setCalibration(loadCalibration(templateId));
      setShowCal(false);
    }
  }, [templateId]);

  const handleLangChange = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('cgsi-lang', newLang);
  }, []);

  const handleFieldChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const previewPDF = useCallback(async () => {
    setPreviewing(true);
    try {
      const res = await fetch('/api/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, formData, overrides: calibration }),
      });
      if (res.ok) {
        const result = await res.json();
        setCalFields(result.fields || []);
        setShowCal(true);

        // Open PDF preview in new tab
        const byteChars = atob(result.pdfBase64);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' });
        window.open(URL.createObjectURL(blob), '_blank');
      }
    } catch (err) {
      alert('Preview failed: ' + err.message);
    }
    setPreviewing(false);
  }, [templateId, formData, calibration]);

  const adjustField = useCallback((key, dx, dy) => {
    setCalibration(prev => {
      const next = { ...prev };
      if (!next[key]) next[key] = { x: 0, y: 0 };
      next[key] = { ...next[key], x: (next[key].x || 0) + dx, y: (next[key].y || 0) + dy };
      saveCalibration(templateId, next);
      return next;
    });
  }, [templateId]);

  const resetCalibration = useCallback(() => {
    if (confirm('Reset all calibration offsets?')) {
      setCalibration({});
      saveCalibration(templateId, {});
    }
  }, [templateId]);

  const generateLink = useCallback(() => {
    saveCalibration(templateId, calibration);
    const payload = { t: templateId, f: formData, x: Date.now() + SEVEN_DAYS, o: calibration };
    const base64 = encodeBase64(JSON.stringify(payload));
    setLink(`${window.location.origin}/sign?d=${encodeURIComponent(base64)}`);
  }, [templateId, formData, calibration]);

  const copyLink = useCallback(() => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [link]);

  const template = templateId ? getTemplate(templateId) : null;

  return (
    <main style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="bg-glow" />
      <div className="page-container">

        <div className="flex-between mb-6">
          <div>
            <h1 className="text-h1">{t(lang, 'appTitle')}</h1>
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Digital Form System</p>
          </div>
          <LanguageSwitcher lang={lang} onLangChange={handleLangChange} />
        </div>

        {!link ? (
          <>
            <TemplateSelector lang={lang} selected={templateId} onSelect={setTemplateId} />

            {templateId && (
              <>
                <DynamicForm lang={lang} templateId={templateId} formData={formData} onChange={handleFieldChange} />

                <a href={`/fill?t=${templateId}`} className="btn-secondary" style={{textDecoration:'none',marginBottom:10,marginTop:28}}>
                  Fill PDF Visually (Click-to-Place)
                </a>

                <div style={{display:'flex',gap:10}}>
                  <button onClick={previewPDF} disabled={previewing} className="btn-secondary" style={{flex:1}}>
                    {previewing ? (
                      <><div className="spinner" /> Previewing...</>
                    ) : (
                      <>{t(lang, 'previewPDF') || 'Preview PDF'}</>
                    )}
                  </button>
                  <button onClick={generateLink} className="btn-primary" style={{flex:2}}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    {t(lang, 'generateLink')}
                  </button>
                </div>

                {/* Calibration Panel */}
                {showCal && calFields.length > 0 && (
                  <div style={{marginTop:20}}>
                    <div className="card" style={{padding:12}}>
                      <div className="flex-between" style={{marginBottom:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)'}}>
                          Adjust Field Positions
                        </span>
                        <button
                          onClick={resetCalibration}
                          style={{background:'none',border:'none',color:'var(--danger)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)'}}
                        >
                          Reset All
                        </button>
                      </div>
                      <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>
                        Adjust offsets, then click Preview PDF to check. Click Generate Link when done.
                      </p>
                      <div style={{maxHeight:200,overflowY:'auto'}}>
                        {calFields.map((f) => {
                          const o = calibration[f.key] || { x: 0, y: 0 };
                          return (
                            <div key={f.key} className="flex-between" style={{padding:'3px 0',borderBottom:'1px solid var(--border)',fontSize:11}}>
                              <span style={{color:'var(--text-muted)',width:150,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                {f.label || f.key}
                              </span>
                              <span style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{color:'var(--text-muted)',width:45,textAlign:'right'}}>X{o.x || 0}</span>
                                <button onClick={() => adjustField(f.key, -5, 0)} style={btnStyle}>−5</button>
                                <button onClick={() => adjustField(f.key, -1, 0)} style={btnStyle}>−</button>
                                <button onClick={() => adjustField(f.key, 1, 0)} style={btnStyle}>+</button>
                                <button onClick={() => adjustField(f.key, 5, 0)} style={btnStyle}>+5</button>
                              </span>
                              <span style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{color:'var(--text-muted)',width:45,textAlign:'right'}}>Y{o.y || 0}</span>
                                <button onClick={() => adjustField(f.key, 0, 5)} style={btnStyle}>+5</button>
                                <button onClick={() => adjustField(f.key, 0, 1)} style={btnStyle}>+</button>
                                <button onClick={() => adjustField(f.key, 0, -1)} style={btnStyle}>−</button>
                                <button onClick={() => adjustField(f.key, 0, -5)} style={btnStyle}>−5</button>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="animate-scale">
            <div className="card-highlight" style={{textAlign:'center'}}>
              <div className="success-circle" style={{marginBottom:20}}>
                <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <h2 className="text-h2" style={{marginBottom:4}}>{t(lang, 'linkReady')}</h2>
              <p className="text-caption" style={{marginBottom:16}}>{t(lang, 'sendToClient')}</p>

              <div className={`link-box${copied ? ' link-copied' : ''}`} style={{marginBottom:12}}>
                {link}
              </div>

              <button onClick={copyLink} className={`btn-${copied ? 'primary' : 'secondary'}`}>
                {copied ? (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    {t(lang, 'copyLink')}
                  </>
                )}
              </button>

              <div className="badge-warning" style={{marginTop:14,marginLeft:'auto',marginRight:'auto',width:'fit-content'}}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t(lang, 'linkExpires')}
              </div>

              <button
                onClick={() => { setLink(''); setTemplateId(null); setFormData({}); }}
                style={{marginTop:18,background:'none',border:'none',color:'var(--text-muted)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)'}}
              >
                ← {t(lang, 'backToHome')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const btnStyle = {
  background:'rgba(255,255,255,0.06)',
  border:'1px solid var(--border)',
  borderRadius:4,
  color:'var(--text)',
  cursor:'pointer',
  fontSize:10,
  padding:'1px 5px',
  fontFamily:'var(--font)',
};
