'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

const PDF_FILES = {
  'client-info-update': '/forms/client-info-update.pdf',
  'fen-declaration': '/forms/fen-declaration.pdf',
  'change-of-dr': '/forms/change-of-dr.pdf',
  'w8ben': '/forms/w8ben.pdf',
};

const SCALE = 1.5;
let _pdfjsLib = null;

function loadPdfjs() {
  return new Promise((resolve) => {
    if (_pdfjsLib) return resolve(_pdfjsLib);
    if (window.pdfjsLib) { _pdfjsLib = window.pdfjsLib; return resolve(_pdfjsLib); }
    const script = document.createElement('script');
    script.src = '/pdf-lib.min.js';
    script.onload = () => {
      const check = setInterval(() => {
        if (window.pdfjsLib) { _pdfjsLib = window.pdfjsLib; clearInterval(check); resolve(_pdfjsLib); }
      }, 50);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function SetupPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('t') || searchParams.get('templateId');
  const template = templateId ? getTemplate(templateId) : null;

  const [lang, setLang] = useState('en');
  const [pageNum, setPageNum] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState([]);
  const [drawing, setDrawing] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);
  }, []);

  // Load saved boxes from localStorage
  useEffect(() => {
    if (!templateId) return;
    try {
      const raw = localStorage.getItem(`cgsi-sig-boxes-${templateId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setBoxes(parsed);
      }
    } catch {}
  }, [templateId]);

  // Load pdfjs and render PDF
  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;

    loadPdfjs().then(async (pdfjs) => {
      if (cancelled || !pdfjs) { if (!cancelled) setLoading(false); return; }
      const pdfUrl = PDF_FILES[templateId];
      if (!pdfUrl) { setLoading(false); return; }
      try {
        const doc = await pdfjs.getDocument(pdfUrl).promise;
        const page = await doc.getPage(pageNum + 1);
        const vp = page.getViewport({ scale: SCALE });
        setPageSize({ width: vp.width / SCALE, height: vp.height / SCALE });

        const canvas = canvasRef.current;
        if (!canvas) { setLoading(false); return; }
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error('Render error:', err);
        if (!cancelled) setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [templateId, pageNum]);

  // ---- Coordinate helpers ----
  const screenToPdf = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);
    return { x: px / SCALE, y: pageSize.height - py / SCALE };
  }, [pageSize]);

  const pdfToScreen = useCallback((pdfX, pdfY) => {
    const sx = pdfX * SCALE;
    const sy = (pageSize.height - pdfY) * SCALE;
    return { sx, sy };
  }, [pageSize]);

  const getPoint = useCallback((e) => {
    if (e.touches) {
      if (e.touches.length > 0) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      if (e.changedTouches?.length > 0) return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }, []);

  // ---- Drawing handlers ----
  const handlePointerDown = useCallback((e) => {
    // Check if we're in drawing mode for any slot
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getPoint(e);
    const pdfPt = screenToPdf(pt.clientX, pt.clientY);
    if (!pdfPt) return;
    setDrawing({ startX: pdfPt.x, startY: pdfPt.y, curX: pdfPt.x, curY: pdfPt.y });
    e.preventDefault();
  }, [getPoint, screenToPdf]);

  const handlePointerMove = useCallback((e) => {
    if (!drawing) return;
    const pt = getPoint(e);
    const pdfPt = screenToPdf(pt.clientX, pt.clientY);
    if (!pdfPt) return;
    setDrawing(prev => prev ? { ...prev, curX: pdfPt.x, curY: pdfPt.y } : null);
    e.preventDefault();
  }, [drawing, getPoint, screenToPdf]);

  const handlePointerUp = useCallback(() => {
    if (!drawing) return;
    const x1 = Math.min(drawing.startX, drawing.curX);
    const y1 = Math.min(drawing.startY, drawing.curY);
    const x2 = Math.max(drawing.startX, drawing.curX);
    const y2 = Math.max(drawing.startY, drawing.curY);
    const w = x2 - x1;
    const h = y2 - y1;

    if (w > 10 && h > 10) {
      setBoxes(prev => [...prev, {
        page: pageNum,
        x: Math.round(x1),
        y: Math.round(y1),
        width: Math.round(w),
        height: Math.round(h),
      }]);
    }
    setDrawing(null);
  }, [drawing, pageNum]);

  const deleteBox = useCallback((index) => {
    setBoxes(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    if (confirm('Remove all signature boxes?')) setBoxes([]);
  }, []);

  const saveToLocal = useCallback(() => {
    localStorage.setItem(`cgsi-sig-boxes-${templateId}`, JSON.stringify(boxes));
    alert(`Saved ${boxes.length} signature box(es)!`);
  }, [boxes, templateId]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  // ---- Draw overlay (red boxes + blue preview) ----
  const redrawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    let overlay = canvas.nextElementSibling;
    if (!overlay || !overlay.classList.contains('sig-overlay')) {
      overlay = document.createElement('canvas');
      overlay.classList.add('sig-overlay');
      overlay.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;';
      container.appendChild(overlay);
    }
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.width = canvas.style.width;
    overlay.style.height = canvas.style.height;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Saved boxes (red)
    boxes.forEach((box, i) => {
      if (!box || box.page !== pageNum) return;
      const { sx: x1, sy: y1 } = pdfToScreen(box.x, box.y + box.height);
      const { sx: x2, sy: y2 } = pdfToScreen(box.x + box.width, box.y);
      ctx.strokeStyle = 'rgba(248,113,113,0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(248,113,113,0.9)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`Sig ${i + 1}`, x1 + 3, y1 - 5);
    });

    // Active drawing preview (blue)
    if (drawing) {
      const dx1 = Math.min(drawing.startX, drawing.curX);
      const dy1 = Math.min(drawing.startY, drawing.curY);
      const dx2 = Math.max(drawing.startX, drawing.curX);
      const dy2 = Math.max(drawing.startY, drawing.curY);
      const { sx: sx1, sy: sy1 } = pdfToScreen(dx1, dy2);
      const { sx: sx2, sy: sy2 } = pdfToScreen(dx2, dy1);
      ctx.fillStyle = 'rgba(59,130,246,0.2)';
      ctx.fillRect(sx1, sy1, sx2 - sx1, sy2 - sy1);
      ctx.strokeStyle = 'rgba(59,130,246,0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);
    }
  }, [boxes, drawing, pageNum, pdfToScreen]);

  // Re-render overlay on state change
  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  // Re-render overlay when canvas finishes loading
  useEffect(() => {
    if (!loading && canvasRef.current) redrawOverlay();
  }, [loading, redrawOverlay]);

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
      <div className="bg-glow" />
      <div style={{display:'flex',height:'100vh'}}>
        {/* PDF Canvas Area */}
        <div style={{flex:1,overflow:'auto',background:'#525659',position:'relative',padding:16}}>
          <div style={{marginBottom:10,display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
            {pages.map(p => (
              <button key={p} onClick={() => setPageNum(p)}
                style={{padding:'4px 16px',borderRadius:6,border:'none',cursor:'pointer',
                  background:p===pageNum?'var(--accent)':'rgba(255,255,255,0.1)',
                  color:p===pageNum?'#fff':'var(--text-muted)',fontSize:12,fontFamily:'var(--font)'}}>
                Page {p+1}
              </button>
            ))}
            <span style={{color:'#ccc',fontSize:11,marginLeft:'auto'}}>
              Click &amp; drag anywhere on the PDF to draw a signature box
            </span>
          </div>

          {loading && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#999'}}>
              <div className="spinner" />&nbsp; Loading PDF...
            </div>
          )}

          <div ref={containerRef} style={{position:'relative',display:'inline-block',maxWidth:'100%'}}>
            <canvas ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              style={{cursor:'crosshair',maxWidth:'100%',display:loading?'none':'block'}} />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{width:320,background:'var(--bg-card)',borderLeft:'1px solid var(--border)',padding:16,overflowY:'auto'}}>
          <div className="flex-between" style={{marginBottom:12}}>
            <h2 className="text-h2">{template.name}</h2>
            <button onClick={goBack} style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:12,cursor:'pointer',fontFamily:'var(--font)'}}>
              ← Back
            </button>
          </div>
          <p className="text-caption" style={{marginBottom:12}}>
            Click and drag on the PDF to draw signature boxes. Add as many as needed.
          </p>

          <div style={{marginBottom:8,fontSize:10,color:'var(--text-muted)'}}>
            {boxes.length} box(es) &nbsp;|&nbsp; Page {pageNum + 1} of {pages.length}
          </div>

          {boxes.length === 0 && (
            <p style={{fontSize:11,color:'var(--text-muted)',textAlign:'center',padding:20}}>
              No boxes yet. Drag on the PDF to create one.
            </p>
          )}

          {boxes.map((box, i) => (
            <div key={i} style={{marginBottom:6,padding:8,borderRadius:8,
              background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#f1f5f9',marginBottom:2}}>
                Signature {i + 1}
              </div>
              <div style={{fontSize:10,color:'var(--success)',marginBottom:4}}>
                Page {box.page + 1} &middot; ({box.x}, {box.y}) &middot; {box.width}&times;{box.height}pt
              </div>
              <button onClick={() => deleteBox(i)}
                style={{padding:'3px 10px',borderRadius:4,border:'1px solid rgba(248,113,113,0.2)',background:'transparent',color:'var(--danger)',fontSize:10,cursor:'pointer',fontFamily:'var(--font)'}}>
                Delete
              </button>
            </div>
          ))}

          <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={saveToLocal} className="btn-primary" style={{fontSize:13}} disabled={boxes.length === 0}>
              {t(lang, 'saveBoxes')}
            </button>
            {boxes.length > 0 && (
              <button onClick={clearAll} style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)'}}>
                Clear All Boxes
              </button>
            )}
            <button onClick={goBack} className="btn-secondary" style={{fontSize:12}}>
              ← Back to Home
            </button>
          </div>
          <p style={{fontSize:9,color:'var(--text-muted)',textAlign:'center',marginTop:8}}>
            Boxes saved per template ({templateId}). After saving, go back and upload PDF to generate sign link.
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
