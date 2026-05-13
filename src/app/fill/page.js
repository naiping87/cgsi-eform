'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

import { Suspense } from 'react';

function FillPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('t') || searchParams.get('templateId');
  const template = templateId ? getTemplate(templateId) : null;

  const [lang, setLang] = useState('en');
  const [pageNum, setPageNum] = useState(0);
  const [imgData, setImgData] = useState(null); // { base64, width, height, scale }
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [positions, setPositions] = useState({}); // { fieldKey: { x, y } } — PDF coords
  const [activeField, setActiveField] = useState(null);
  const imgRef = useRef(null);
  const pages = template ? Array.from({ length: template.pages || 1 }, (_, i) => i) : [];

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);

    // Load saved positions
    if (templateId) {
      try {
        const saved = localStorage.getItem(`cgsi-pos-${templateId}`);
        if (saved) setPositions(JSON.parse(saved));
      } catch {}
    }
  }, [templateId]);

  // Load PDF page image
  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    fetch(`/api/render-pdf?templateId=${templateId}&page=${pageNum}&scale=1.5`)
      .then(r => r.json())
      .then(data => {
        if (data.base64) setImgData(data);
        else alert(data.error);
      })
      .catch(err => alert('Failed to load PDF: ' + err.message))
      .finally(() => setLoading(false));
  }, [templateId, pageNum]);

  const handleImageClick = useCallback((e) => {
    if (!activeField || !imgData) return;
    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert image pixel coords → PDF points
    const pdfX = (clickX / imgData.width) * (imgData.width / imgData.scale);
    const pdfY = ((imgData.height - clickY) / imgData.height) * (imgData.height / imgData.scale);

    const newPos = { ...positions, [activeField]: { x: Math.round(pdfX), y: Math.round(pdfY), page: pageNum } };
    setPositions(newPos);
    localStorage.setItem(`cgsi-pos-${templateId}`, JSON.stringify(newPos));
    setActiveField(null);
  }, [activeField, imgData, positions, templateId, pageNum]);

  const handleFieldChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const removePosition = useCallback((key) => {
    const newPos = { ...positions };
    delete newPos[key];
    setPositions(newPos);
    localStorage.setItem(`cgsi-pos-${templateId}`, JSON.stringify(newPos));
  }, [positions, templateId]);

  const generateLink = useCallback(() => {
    const payload = {
      t: templateId,
      f: formData,
      p: positions, // custom positions
      x: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
    const link = `${window.location.origin}/sign?d=${encodeURIComponent(base64)}`;
    navigator.clipboard.writeText(link).then(() => alert('Link copied!'));
  }, [templateId, formData, positions]);

  if (!template) {
    return (
      <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <p className="text-caption">Select a template first. <a href="/" style={{color:'var(--accent)'}}>Back to Home</a></p>
      </main>
    );
  }

  return (
    <main style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="bg-glow" />
      <div style={{display:'flex',height:'100vh'}}>

        {/* LEFT: PDF Image */}
        <div style={{flex:1,overflow:'auto',background:'#333',position:'relative',padding:10}}>
          <div style={{marginBottom:8,display:'flex',gap:6,alignItems:'center'}}>
            {pages.length > 1 && pages.map(p => (
              <button
                key={p}
                onClick={() => setPageNum(p)}
                style={{
                  padding:'4px 16px',borderRadius:6,border:'none',cursor:'pointer',
                  background: p === pageNum ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  color: p === pageNum ? '#fff' : 'var(--text-muted)',
                  fontSize:12,fontFamily:'var(--font)',
                }}
              >
                Page {p + 1}
              </button>
            ))}
            <span style={{color:'var(--text-muted)',fontSize:11,marginLeft:'auto'}}>
              {activeField ? `Click where "${activeField}" goes` : 'Select a field on the right, then click on the PDF'}
            </span>
          </div>

          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400}}>
              <div className="spinner" />
            </div>
          ) : imgData ? (
            <div style={{position:'relative',display:'inline-block'}}>
              <img
                ref={imgRef}
                src={`data:image/png;base64,${imgData.base64}`}
                alt={`PDF Page ${pageNum}`}
                style={{cursor: activeField ? 'crosshair' : 'default',maxWidth:'100%',display:'block'}}
                onClick={handleImageClick}
              />
              {/* Position markers */}
              {Object.entries(positions).filter(([_,p]) => p.page === pageNum).map(([key, pos]) => {
                const mx = (pos.x / (imgData.width / imgData.scale)) * imgData.scale;
                const my = imgData.height - (pos.y / (imgData.height / imgData.scale)) * imgData.scale;
                return (
                  <div
                    key={key}
                    style={{
                      position:'absolute',
                      left: mx - 4,
                      top: my - 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--success)',
                      border: '2px solid #fff',
                      cursor: 'pointer',
                    }}
                    title={`${key}: (${Math.round(pos.x)}, ${Math.round(pos.y)})`}
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        {/* RIGHT: Fields panel */}
        <div style={{width:320,background:'var(--bg-card)',borderLeft:'1px solid var(--border)',padding:16,overflowY:'auto'}}>
          <div className="flex-between" style={{marginBottom:12}}>
            <h2 className="text-h2">{template.name}</h2>
            <a href="/" style={{color:'var(--text-muted)',fontSize:11,textDecoration:'none'}}>← Back</a>
          </div>

          <p className="text-caption" style={{marginBottom:4}}>
            1. Type value &nbsp; 2. Click field name &nbsp; 3. Click position on PDF
          </p>

          <div style={{marginBottom:16}}>
            {template.fields.map((field) => {
              const pos = positions[field.key];
              const isActive = activeField === field.key;
              return (
                <div
                  key={field.key}
                  style={{
                    marginBottom:8,
                    padding:8,
                    borderRadius:8,
                    background: isActive ? 'rgba(129,140,248,0.12)' : pos ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isActive ? '1px solid var(--accent)' : pos ? '1px solid rgba(52,211,153,0.2)' : '1px solid var(--border)',
                    transition:'all 0.15s',
                  }}
                >
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:11,color:'var(--text-muted)'}}>{t(lang, field.key)}</span>
                    {pos && (
                      <button
                        onClick={() => removePosition(field.key)}
                        style={{background:'none',border:'none',color:'var(--danger)',fontSize:10,cursor:'pointer'}}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      style={{fontSize:13,padding:'6px 8px'}}
                    >
                      <option value="">—</option>
                      {field.options?.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      rows={2}
                      style={{fontSize:13,padding:'6px 8px'}}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={t(lang, field.key)}
                      style={{fontSize:13,padding:'6px 8px'}}
                    />
                  )}
                  <button
                    onClick={() => setActiveField(isActive ? null : field.key)}
                    style={{
                      marginTop:4,
                      width:'100%',
                      padding:'4px',
                      borderRadius:4,
                      border:'1px dashed ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                      background: isActive ? 'var(--accent-glow)' : 'transparent',
                      color: isActive ? 'var(--accent)' : pos ? 'var(--success)' : 'var(--text-muted)',
                      fontSize:10,
                      cursor:'pointer',
                      fontFamily:'var(--font)',
                    }}
                  >
                    {isActive ? '⬆ Click on PDF now' : pos ? `✓ Page ${pos.page} (${Math.round(pos.x)}, ${Math.round(pos.y)})` : 'Click to set position'}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={generateLink}
            className="btn-primary"
            disabled={Object.keys(positions).length === 0}
            style={{marginBottom:8}}
          >
            Generate Link
          </button>
          <p style={{fontSize:10,color:'var(--text-muted)',textAlign:'center'}}>
            Positions saved in browser. Link includes custom coordinates.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function FillPage() {
  return (
    <Suspense fallback={
      <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <p className="text-caption">Loading...</p>
      </main>
    }>
      <FillPageContent />
    </Suspense>
  );
}
