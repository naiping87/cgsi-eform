'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

const PDF_FILES = {
  'client-info-update': '/forms/client-info-update.pdf',
  'fen-declaration': '/forms/fen-declaration.pdf',
  'change-of-dr': '/forms/change-of-dr.pdf',
  'w8ben': '/forms/w8ben.pdf',
};

let _pdfjs = null;
async function loadPdfjs() {
  if (_pdfjs) return _pdfjs;
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  _pdfjs = pdfjs;
  return pdfjs;
}

function FillPageContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('t') || searchParams.get('templateId');
  const template = templateId ? getTemplate(templateId) : null;

  const [lang, setLang] = useState('en');
  const [pageNum, setPageNum] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 }); // PDF points
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [positions, setPositions] = useState({});
  const [activeField, setActiveField] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pages = template ? Array.from({ length: template.pages || 1 }, (_, i) => i) : [];

  // Load saved positions
  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);
    if (templateId) {
      try {
        const raw = localStorage.getItem(`cgsi-pos-${templateId}`);
        if (raw) setPositions(JSON.parse(raw));
      } catch {}
    }
  }, [templateId]);

  // Render PDF page to canvas
  useEffect(() => {
    if (!templateId) return;
    const pdfUrl = PDF_FILES[templateId];
    if (!pdfUrl) return;
    setLoading(true);

    let cancelled = false;
    loadPdfjs().then(async (pdfjs) => {
      if (cancelled) return;
      try {
        const doc = await pdfjs.getDocument(pdfUrl).promise;
        const page = await doc.getPage(pageNum + 1);
        const vp = page.getViewport({ scale: 1.5 });
        setPageSize({ width: vp.width / 1.5, height: vp.height / 1.5 });

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Render error:', err);
          alert('Failed to render PDF: ' + err.message);
          setLoading(false);
        }
      }
    });

    return () => { cancelled = true; };
  }, [templateId, pageNum]);

  const handleCanvasClick = useCallback((e) => {
    if (!activeField || !pageSize) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Click position relative to canvas display size
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to canvas pixel position
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = clickX * scaleX;
    const py = clickY * scaleY;

    // Convert canvas pixel → PDF points (canvas rendered at 1.5x scale)
    const pdfX = px / 1.5;
    const pdfY = pageSize.height - (py / 1.5); // flip Y: canvas top=0, PDF bottom=0

    const newPos = {
      ...positions,
      [activeField]: { x: Math.round(pdfX), y: Math.round(pdfY), page: pageNum }
    };
    setPositions(newPos);
    localStorage.setItem(`cgsi-pos-${templateId}`, JSON.stringify(newPos));
    setActiveField(null);
  }, [activeField, pageSize, positions, templateId, pageNum]);

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
      p: positions,
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
        {/* LEFT: PDF Canvas */}
        <div ref={containerRef} style={{flex:1,overflow:'auto',background:'#525659',position:'relative',padding:16}}>
          <div style={{marginBottom:10,display:'flex',gap:6,alignItems:'center'}}>
            {pages.length > 1 && pages.map(p => (
              <button key={p} onClick={() => setPageNum(p)}
                style={{
                  padding:'4px 16px',borderRadius:6,border:'none',cursor:'pointer',
                  background: p === pageNum ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  color: p === pageNum ? '#fff' : 'var(--text-muted)',
                  fontSize:12,fontFamily:'var(--font)',
                }}>
                Page {p + 1}
              </button>
            ))}
            <span style={{color:'#ccc',fontSize:11,marginLeft:'auto'}}>
              {activeField ? `Click where "${activeField}" goes on the PDF` : 'Select a field → click PDF to place it'}
            </span>
          </div>

          {loading && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#999'}}>
              <div className="spinner" />&nbsp; Loading PDF...
            </div>
          )}

          <div style={{position:'relative',display:'inline-block',maxWidth:'100%'}}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{cursor: activeField ? 'crosshair' : 'default',maxWidth:'100%',display:loading?'none':'block'}}
            />
            {/* Position markers */}
            {pageSize && Object.entries(positions).filter(([_,p]) => p.page === pageNum).map(([key, pos]) => {
              const mx = (pos.x / pageSize.width) * (canvasRef.current?.width || 1);
              const my = ((pageSize.height - pos.y) / pageSize.height) * (canvasRef.current?.height || 1);
              return (
                <div key={key}
                  style={{
                    position:'absolute',
                    left: mx - 5,
                    top: my - 5,
                    width:10,height:10,borderRadius:'50%',
                    background:'var(--success)',border:'2px solid #fff',
                    cursor:'pointer',zIndex:10,
                  }}
                  title={`${key}: (${Math.round(pos.x)}, ${Math.round(pos.y)})`}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT: Fields panel */}
        <div style={{width:320,background:'var(--bg-card)',borderLeft:'1px solid var(--border)',padding:16,overflowY:'auto'}}>
          <div className="flex-between" style={{marginBottom:12}}>
            <h2 className="text-h2">{template.name}</h2>
            <a href="/" style={{color:'var(--text-muted)',fontSize:11,textDecoration:'none'}}>Back</a>
          </div>

          <p className="text-caption" style={{marginBottom:12}}>
            1. Type value &nbsp; 2. Click field name &nbsp; 3. Click where it goes on PDF
          </p>

          {template.fields.map((field) => {
            const pos = positions[field.key];
            const isActive = activeField === field.key;
            return (
              <div key={field.key}
                style={{
                  marginBottom:8,padding:8,borderRadius:8,
                  background: isActive ? 'rgba(129,140,248,0.12)' : pos ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                  border: isActive ? '1px solid var(--accent)' : pos ? '1px solid rgba(52,211,153,0.2)' : '1px solid var(--border)',
                }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>{t(lang, field.key)}</span>
                  {pos && (
                    <button onClick={() => removePosition(field.key)}
                      style={{background:'none',border:'none',color:'var(--danger)',fontSize:10,cursor:'pointer'}}>✕</button>
                  )}
                </div>
                {field.type === 'select' ? (
                  <select value={formData[field.key] || ''} onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    style={{fontSize:13,padding:'6px 8px',width:'100%'}}>
                    <option value="">—</option>
                    {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={formData[field.key] || ''} onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    rows={2} style={{fontSize:13,padding:'6px 8px',width:'100%'}} />
                ) : (
                  <input type="text" value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={t(lang, field.key)} style={{fontSize:13,padding:'6px 8px',width:'100%'}} />
                )}
                <button onClick={() => setActiveField(isActive ? null : field.key)}
                  style={{
                    marginTop:4,width:'100%',padding:'4px',borderRadius:4,
                    border:'1px dashed ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    color: isActive ? 'var(--accent)' : pos ? 'var(--success)' : 'var(--text-muted)',
                    fontSize:10,cursor:'pointer',fontFamily:'var(--font)',
                  }}>
                  {isActive ? 'Click on PDF now ↑' : pos ? `✓ Pg${pos.page} (${Math.round(pos.x)},${Math.round(pos.y)})` : 'Set position'}
                </button>
              </div>
            );
          })}

          <button onClick={generateLink} className="btn-primary"
            disabled={Object.keys(positions).length === 0} style={{marginTop:12}}>
            Generate Link
          </button>
          <p style={{fontSize:10,color:'var(--text-muted)',textAlign:'center',marginTop:6}}>
            Click positions are saved. Link includes exact PDF coordinates.
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
