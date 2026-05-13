'use client';
import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default function SuccessPage() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('cgsi-lang');
    if (saved) setLang(saved);
  }, []);

  return (
    <main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="bg-glow" />
      <div style={{position:'relative',maxWidth:360,width:'100%'}}>
        <LanguageSwitcher lang={lang} onLangChange={setLang} />

        <div className="card-highlight" style={{textAlign:'center',marginTop:20}}>
          <div className="success-circle" style={{margin:'0 auto 20px'}}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-h2" style={{marginBottom:6}}>{t(lang, 'successTitle')}</h2>
          <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:24}}>
            {t(lang, 'successDesc')}
          </p>
          <Link href="/" className="btn-primary" style={{textDecoration:'none',display:'flex'}}>
            {t(lang, 'backToHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
