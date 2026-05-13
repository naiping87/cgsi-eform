'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { t } from '@/lib/i18n';
import { getTemplate } from '@/lib/templates';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TemplateSelector from '@/components/TemplateSelector';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const encodeBase64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

export default function HomePage() {
  const [lang, setLang] = useState('en');
  const [templateId, setTemplateId] = useState(null);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null); // { filename, sigCount }
  const fileRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);
  }, []);

  const handleLangChange = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('cgsi-lang', newLang);
  }, []);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !templateId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('templateId', templateId);
      const res = await fetch('/api/store-pdf', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setUploaded({ id: data.id, filename: file.name, sigCount: data.sigCount });
      else alert(data.error);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  }, [templateId]);

  const generateLink = useCallback(() => {
    if (!uploaded) return;
    const payload = {
      pdfId: uploaded.id,
      t: templateId,
      sigCount: uploaded.sigCount,
      x: Date.now() + SEVEN_DAYS,
    };
    const base64 = encodeBase64(JSON.stringify(payload));
    setLink(`${window.location.origin}/sign?d=${encodeURIComponent(base64)}`);
  }, [templateId, uploaded]);

  const copyLink = useCallback(() => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [link]);

  const reset = () => {
    setLink('');
    setTemplateId(null);
    setUploaded(null);
    if (fileRef.current) fileRef.current.value = '';
  };

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

            {template && (
              <div style={{marginTop:28}}>
                <div className="card-highlight">
                  <p className="text-subtitle" style={{marginBottom:8}}>Step 2 — Upload Filled PDF</p>
                  <p className="text-caption" style={{marginBottom:16}}>
                    Fill the form using any PDF editor (Edge, Acrobat, etc.), then upload it here.
                    The system will add the client&apos;s signature to the correct position.
                  </p>

                  <div className="card" style={{marginBottom:12,textAlign:'center',padding:24}}>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleUpload}
                      style={{display:'none'}}
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      style={{
                        display:'inline-block',padding:'12px 24px',borderRadius:'var(--radius)',
                        background:uploaded?'var(--success-glow)':uploading?'rgba(255,255,255,0.04)':'var(--accent)',
                        border:uploaded?'1px solid rgba(52,211,153,0.2)':uploading?'1px solid var(--border)':'none',
                        color:uploaded?'var(--success)':'#fff',fontSize:14,fontWeight:600,
                        cursor:'pointer',fontFamily:'var(--font)',transition:'all 0.2s',
                      }}
                    >
                      {uploading ? (
                        <><div className="spinner" style={{display:'inline-block',marginRight:8}} /> Uploading...</>
                      ) : uploaded ? (
                        <>✓ {uploaded.filename}</>
                      ) : (
                        <>📄  Choose PDF File</>
                      )}
                    </label>
                    {uploaded && (
                      <button
                        onClick={() => { setUploaded(null); if (fileRef.current) fileRef.current.value = ''; }}
                        style={{marginLeft:12,background:'none',border:'none',color:'var(--text-muted)',fontSize:12,cursor:'pointer',fontFamily:'var(--font)'}}
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {template.sigCount > 1 && (
                    <div className="badge-warning" style={{marginBottom:12,width:'100%'}}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      This form requires {template.sigCount} signatures
                    </div>
                  )}
                </div>

                <button
                  onClick={generateLink}
                  disabled={!uploaded}
                  className="btn-primary mt-8"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  {t(lang, 'generateLink')}
                </button>
              </div>
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

              <button onClick={reset}
                style={{marginTop:18,background:'none',border:'none',color:'var(--text-muted)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)'}}>
                ← {t(lang, 'backToHome')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
