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
      penColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
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
      if (data) {
        padRef.current.fromData(data);
      }
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
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <button onClick={clear} className="text-xs text-red-500 font-medium">
          {t('clearSignature')}
        </button>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
        <canvas ref={canvasRef} className="w-full touch-none" />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">
        ✍️ {t('signHere')}
      </p>
    </div>
  );
}
