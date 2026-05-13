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
    canvas.width = parent.offsetWidth * 2;
    canvas.height = 160 * 2;
    canvas.style.width = parent.offsetWidth + 'px';
    canvas.style.height = '160px';

    padRef.current = new SignaturePadLib(canvas, {
      penColor: 'rgb(15, 23, 42)',
      backgroundColor: 'rgb(248, 250, 252)',
    });

    padRef.current.addEventListener('endStroke', () => {
      if (callbackRef.current && padRef.current) {
        callbackRef.current(padRef.current.toDataURL());
      }
    });

    const handleResize = () => {
      const data = padRef.current ? padRef.current.toData() : null;
      canvas.width = parent.offsetWidth * 2;
      canvas.height = 160 * 2;
      canvas.style.width = parent.offsetWidth + 'px';
      canvas.style.height = '160px';
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
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <button onClick={clear} className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors">
          {t('clearSignature')}
        </button>
      </div>
      <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-white/5">
        <canvas ref={canvasRef} className="w-full touch-none" />
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        ✍️ {t('signHere')}
      </p>
    </div>
  );
}
