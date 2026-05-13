'use client';
import { useRef, useEffect, useCallback } from 'react';
import SignaturePadLib from 'signature_pad';

export default function SignaturePad({ onSignatureChange, label, t }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const callbackRef = useRef(onSignatureChange);

  useEffect(() => {
    callbackRef.current = onSignatureChange;
  }, [onSignatureChange]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Set canvas internal resolution to match CSS size (1:1), then scale context
    // This ensures signature_pad touch coordinates (in CSS space) map correctly
    const w = parent.offsetWidth;
    const h = 160;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // Scale context so drawing uses CSS coordinates
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    padRef.current = new SignaturePadLib(canvas, {
      penColor: 'rgb(15, 23, 42)',
      backgroundColor: 'rgba(0,0,0,0)',
    });

    padRef.current.addEventListener('endStroke', () => {
      if (callbackRef.current && padRef.current) {
        callbackRef.current(padRef.current.toDataURL());
      }
    });

    const handleResize = () => {
      const data = padRef.current ? padRef.current.toData() : null;
      const newW = parent.offsetWidth;
      canvas.width = newW * ratio;
      canvas.height = h * ratio;
      canvas.style.width = newW + 'px';
      canvas.style.height = h + 'px';
      const newCtx = canvas.getContext('2d');
      newCtx.scale(ratio, ratio);
      if (data) padRef.current.fromData(data);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (padRef.current) padRef.current.off();
    };
  }, []);

  const clear = useCallback(() => {
    if (padRef.current) {
      padRef.current.clear();
      if (callbackRef.current) callbackRef.current(null);
    }
  }, []);

  return (
    <div>
      <div className="sig-header">
        <span className="sig-label">{label}</span>
        <button onClick={clear} className="sig-clear">{t('clearSignature')}</button>
      </div>
      <div className="sig-container">
        <canvas ref={canvasRef} className="w-full" style={{touchAction:'none',width:'100%'}} />
      </div>
      <p className="sig-hint">{t('signHere')}</p>
    </div>
  );
}
