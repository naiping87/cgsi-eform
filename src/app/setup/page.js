'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';
import Script from 'next/script';

const PDF_FILES = {
  'client-info-update': '/forms/client-info-update.pdf',
  'fen-declaration': '/forms/fen-declaration.pdf',
  'change-of-dr': '/forms/change-of-dr.pdf',
  'w8ben': '/forms/w8ben.pdf',
};

let _pdfjsReady = false;
function waitForPdfjs() {
  return new Promise((resolve) => {
    if (_pdfjsReady && window.pdfjsLib) return resolve(window.pdfjsLib);
    const check = setInterval(() => {
      if (window.pdfjsLib) {
        _pdfjsReady = true;
        clearInterval(check);
        resolve(window.pdfjsLib);
      }
    }, 100);
  });
}

function SetupPageContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('t') || searchParams.get('templateId');
  const template = templateId ? getTemplate(templateId) : null;

  const [lang, setLang] = useState('en');
  const [pageNum, setPageNum] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [boxes, setBoxes] = useState([]); // [{page, x, y, width, height}] in PDF coords
  const [drawing, setDrawing] = useState(null); // {sigIndex, startX, startY, curX, curY} in screen coords
  const [activeSlot, setActiveSlot] = useState(null); // which sig index is active
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);
    if (templateId) {
      try {
        const raw = localStorage.getItem(`cgsi-sig-boxes-${templateId}`);
        if (raw) setBoxes(JSON.parse(raw));
      } catch {}
    }
  }, [templateId]);

  // Render PDF
  const renderPage = useCallback(async (pdfjs, pageIdx) => {
    const pdfUrl = PDF_FILES[templateId];
    if (!pdfUrl) return;
    try {
      const doc = await pdfjs.getDocument(pdfUrl).promise;
      const page = await doc.getPage(pageIdx + 1);
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
    } catch (err) {
      console.error('Render error:', err);
    }
  }, [templateId]);

  useEffect(() => {
    if (!templateId || !scriptReady) return;
    setLoading(true);
    let cancelled = false;
    waitForPdfjs().then(async (pdfjs) => {
      if (cancelled) return;
      await renderPage(pdfjs, pageNum);
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [templateId, pageNum, scriptReady, renderPage]);

  // Convert screen coordinates to PDF coordinates
  const screenToPdf = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    const pdfX = px / 1.5;
    const pdfY = pageSize.height - (py / 1.5);
    return { x: pdfX, y: pdfY };
  }, [pageSize]);

  // Convert PDF coordinates to screen coordinates (for rendering overlays)
  const pdfToScreen = useCallback((pdfX, pdfY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { sx: 0, sy: 0 };
    const sx = pdfX * 1.5;
    const sy = (pageSize.height - pdfY) * 1.5;
    return { sx, sy };
  }, [pageSize]);

  const getEventPoint = useCallback((e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (activeSlot === null) return;
    const pt = getEventPoint(e);
    const pdfPt = screenToPdf(pt.clientX, pt.clientY);
    if (!pdfPt) return;
    setDrawing({ sigIndex: activeSlot, startX: pdfPt.x, startY: pdfPt.y, curX: pdfPt.x, curY: pdfPt.y });
    e.preventDefault();
  }, [activeSlot, getEventPoint, screenToPdf]);

  const handlePointerMove = useCallback((e) => {
    if (!drawing) return;
    const pt = getEventPoint(e);
    const pdfPt = screenToPdf(pt.clientX, pt.clientY);
    if (!pdfPt) return;
    setDrawing(prev => ({ ...prev, curX: pdfPt.x, curY: pdfPt.y }));
    e.preventDefault();
  }, [drawing, getEventPoint, screenToPdf]);

  const handlePointerUp = useCallback(() => {
    if (!drawing) return;
    const x1 = Math.min(drawing.startX, drawing.curX);
    const y1 = Math.min(drawing.startY, drawing.curY);
    const x2 = Math.max(drawing.startX, drawing.curX);
    const y2 = Math.max(drawing.startY, drawing.curY);
    const w = x2 - x1;
    const h = y2 - y1;

    if (w > 10 && h > 10) {
      setBoxes(prev => {
        const updated = [...prev];
        while (updated.length <= drawing.sigIndex) updated.push(null);
        updated[drawing.sigIndex] = { page: pageNum, x: Math.round(x1), y: Math.round(y1), width: Math.round(w), height: Math.round(h) };
        return updated;
      });
    }
    setDrawing(null);
    setActiveSlot(null);
  }, [drawing, pageNum]);

  const deleteBox = useCallback((index) => {
    setBoxes(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  }, []);

  const saveToLocal = useCallback(() => {
    localStorage.setItem(`cgsi-sig-boxes-${templateId}`, JSON.stringify(boxes));
    alert('Positions saved!');
  }, [boxes, templateId]);

  // Render drawing preview + saved rectangles to an overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Use an overlay canvas sibling for drawing previews
    let overlay = canvas.nextElementSibling;
    if (!overlay || !overlay.classList.contains('sig-overlay')) {
      overlay = document.createElement('canvas');
      overlay.classList.add('sig-overlay');
      overlay.style.position = 'absolute';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.pointerEvents = 'none';
      canvas.parentElement.appendChild(overlay);
    }
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.width = canvas.style.width;
    overlay.style.height = canvas.style.height;
    const ctx = overlay.getContext('2d');

    // Draw saved boxes for current page (red dashed)
    boxes.forEach((box, i) => {
      if (!box || box.page !== pageNum) return;
      const { sx: x1, sy: y1 } = pdfToScreen(box.x, box.y + box.height);
      const { sx: x2, sy: y2 } = pdfToScreen(box.x + box.width, box.y);
      const w = x2 - x1;
      const h = y2 - y1;
      ctx.strokeStyle = 'rgba(248,113,113,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 2]);
      ctx.strokeRect(x1, y1, w, h);
      ctx.setLineDash([]);
      // Label
      ctx.fillStyle = 'rgba(248,113,113,0.9)';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Sig ${i + 1}`, x1 + 2, y1 - 4);
    });

    // Draw active drawing preview (blue semi-transparent)
    if (drawing) {
      const x1 = Math.min(drawing.startX, drawing.curX);
      const y1 = Math.min(drawing.startY, drawing.curY);
      const x2 = Math.max(drawing.startX, drawing.curX);
      const y2 = Math.max(drawing.startY, drawing.curY);
      const { sx: sx1, sy: sy1 } = pdfToScreen(x1, y2);
      const { sx: sx2, sy: sy2 } = pdfToScreen(x2, y1);
      const w = sx2 - sx1;
      const h = sy2 - sy1;
      ctx.fillStyle = 'rgba(59,130,246,0.2)';
      ctx.fillRect(sx1, sy1, w, h);
      ctx.strokeStyle = 'rgba(59,130,246,0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx1, sy1, w, h);
    }
  }, [boxes, drawing, pageNum, pdfToScreen]);

  if (!template) {
    return (
      <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div className="bg-glow" />
        <p className="text-caption">Select a template first. <a href="/" style={{color:'var(--accent)'}}>Back to Home</a></p>
      </main>
    );
  }

  const pages = Array.from({ length: template.pages || 1 }, (_, i) => i);

  return (
    <main style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Script
        src="/pdf-lib.min.js"
        onLoad={() => setScriptReady(true)}
        strategy="beforeInteractive"
      />
      <div className="bg-glow" />
      <div style={{display:'flex',height:'100vh'}}>
        {/* PDF Canvas Area */}
        <div style={{flex:1,overflow:'auto',background:'#525659',position:'relative',padding:16}}>
          <div style={{marginBottom:10,display:'flex',gap:6,alignItems:'center'}}>
            {pages.length > 1 && pages.map(p => (
              <button key={p} onClick={() => setPageNum(p)}
                style={{padding:'4px 16px',borderRadius:6,border:'none',cursor:'pointer',
                  background:p===pageNum?'var(--accent)':'rgba(255,255,255,0.1)',
                  color:p===pageNum?'#fff':'var(--text-muted)',fontSize:12,fontFamily:'var(--font)'}}>
                Page {p+1}
              </button>
            ))}
            <span style={{color:'#ccc',fontSize:11,marginLeft:'auto'}}>
              {activeSlot !== null
                ? `Drawing signature ${activeSlot + 1} box...`
                : 'Select a signature slot → drag on PDF'}
            </span>
          </div>

          {loading && <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#999'}}>
            <div className="spinner" />&nbsp; Loading...
          </div>}

          <div ref={containerRef} style={{position:'relative',display:'inline-block',maxWidth:'100%'}}>
            <canvas ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              style={{cursor:activeSlot!==null?'crosshair':'default',maxWidth:'100%',display:loading?'none':'block'}} />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{width:320,background:'var(--bg-card)',borderLeft:'1px solid var(--border)',padding:16,overflowY:'auto'}}>
          <div className="flex-between" style={{marginBottom:12}}>
            <h2 className="text-h2">{template.name}</h2>
            <a href="/" style={{color:'var(--text-muted)',fontSize:11,textDecoration:'none'}}>Back</a>
          </div>
          <p className="text-caption" style={{marginBottom:12}}>
            {t(lang, 'clickDragToDraw')}
          </p>

          <div style={{marginBottom:8,fontSize:10,color:'var(--text-muted)'}}>
            {t(lang, 'sig')}: {template.sigCount} &nbsp;|&nbsp; {t(lang, 'pages')}: {template.pages || 1}
          </div>

          {Array.from({ length: template.sigCount }, (_, i) => {
            const box = boxes[i];
            const isActive = activeSlot === i;
            return (
              <div key={i} style={{marginBottom:8,padding:8,borderRadius:8,
                background:isActive?'rgba(129,140,248,0.12)':box?'rgba(52,211,153,0.06)':'rgba(255,255,255,0.02)',
                border:isActive?'1px solid var(--accent)':box?'1px solid rgba(52,211,153,0.2)':'1px solid var(--border)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'#f1f5f9',marginBottom:4}}>
                  {t(lang, 'signature')} {i + 1} {t(lang, 'of')} {template.sigCount}
                </div>
                {box ? (
                  <div style={{fontSize:11,color:'var(--success)',marginBottom:4}}>
                    Page {box.page + 1} &middot; ({box.x}, {box.y}) &middot; {box.width}×{box.height}pt
                  </div>
                ) : (
                  <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>
                    {t(lang, 'sigNotPositioned')}
                  </div>
                )}
                <div style={{display:'flex',gap:6}}>
                  <button
                    onClick={() => { setActiveSlot(isActive ? null : i); setPageNum(box?.page || 0); }}
                    style={{
                      padding:'4px 12px',borderRadius:4,fontSize:10,cursor:'pointer',fontFamily:'var(--font)',
                      border:isActive?'1px solid var(--accent)':'1px solid var(--border)',
                      background:isActive?'var(--accent-glow)':'transparent',
                      color:isActive?'var(--accent)':box?'var(--text-secondary)':'var(--text-muted)',
                    }}>
                    {isActive ? 'Placing...' : box ? 'Redraw' : 'Draw Box'}
                  </button>
                  {box && (
                    <button onClick={() => deleteBox(i)}
                      style={{padding:'4px 8px',borderRadius:4,border:'1px solid rgba(248,113,113,0.2)',background:'transparent',color:'var(--danger)',fontSize:10,cursor:'pointer',fontFamily:'var(--font)'}}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={saveToLocal} className="btn-secondary" style={{fontSize:12}}>
              {t(lang, 'saveBoxes')}
            </button>
            <a href="/" style={{
              display:'block',textAlign:'center',padding:'8px',
              color:'var(--text-muted)',fontSize:11,textDecoration:'none',
            }}>
              ← {t(lang, 'backToHome')}
            </a>
          </div>
          <p style={{fontSize:9,color:'var(--text-muted)',textAlign:'center',marginTop:8}}>
            After saving, go back to Home to upload a PDF and generate the sign link.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <p className="text-caption">Loading...</p>
      </main>
    }>
      <SetupPageContent />
    </Suspense>
  );
}
