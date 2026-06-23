'use client';
import { useState, useRef } from 'react';

export default function FileUploader({ label, accept = 'image/*,.pdf', maxSizeMB = 10, onFile, lang = 'en' }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const labels = {
    en: { tap: 'Tap to take photo', or: 'or choose from gallery', tooLarge: 'File too large (max 10MB)', invalid: 'Invalid file type', pdf: 'PDF' },
    zh: { tap: '点击拍照', or: '或从相册选择', tooLarge: '文件过大（上限10MB）', invalid: '无效文件格式', pdf: 'PDF' },
    bm: { tap: 'Ketik untuk ambil gambar', or: 'atau pilih dari galeri', tooLarge: 'Fail terlalu besar (maks 10MB)', invalid: 'Jenis fail tidak sah', pdf: 'PDF' },
  };
  const t = labels[lang] || labels.en;

  const handleFile = (file) => {
    setError(null);
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) { setError(t.tooLarge); return; }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreview('pdf');
    } else { setError(t.invalid); return; }
    onFile?.(file);
  };

  const styles = {
    box: {
      position: 'relative', width: '100%', aspectRatio: '3/2', maxHeight: 180,
      border: '2px dashed', borderRadius: 12, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
      transition: 'all 0.2s', overflow: 'hidden',
      borderColor: dragOver ? 'var(--accent)' : preview ? 'var(--success)' : 'var(--border)',
      background: dragOver ? 'rgba(59,130,246,0.06)' : 'var(--bg-card)',
    },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 },
    error: { fontSize: 12, color: 'var(--danger)', marginTop: 4 },
  };

  return (
    <div>
      {label && <label style={styles.label}>{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        style={styles.box}
      >
        {preview ? (
          preview === 'pdf' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.pdf}</span>
            </div>
          ) : (
            <img src={preview} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{t.tap}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t.or}</p>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={(e) => handleFile(e.target.files[0])} style={{ display: 'none' }} />
      </div>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}
