'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Incorrect password');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main style={{
      minHeight:'100vh',background:'var(--bg)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:24
    }}>
      <div className="bg-glow" />
      <div style={{position:'relative',width:'100%',maxWidth:380}}>
        <div className="card-highlight" style={{textAlign:'center'}}>
          <div style={{marginBottom:24}}>
            <h1 className="text-h1" style={{marginBottom:4}}>CGSI E-Form</h1>
            <p style={{fontSize:12,color:'var(--text-muted)'}}>Digital Form System</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{
              display:'block',textAlign:'left',fontSize:12,fontWeight:600,
              color:'var(--text-secondary)',marginBottom:6
            }}>
              Enter Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              style={{
                width:'100%',padding:'12px 16px',borderRadius:'var(--radius)',
                border:'1px solid '+(error?'rgba(248,113,113,0.4)':'var(--border)'),
                background:'var(--bg-card)',color:'#f1f5f9',fontSize:15,
                fontFamily:'var(--font)',outline:'none',textAlign:'center',
                letterSpacing:4,
              }}
            />

            {error && (
              <p style={{color:'var(--danger)',fontSize:12,marginTop:8,textAlign:'left'}}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{marginTop:16}}
            >
              {loading ? (
                <><div className="spinner" style={{display:'inline-block'}} /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p style={{fontSize:10,color:'var(--text-muted)',marginTop:16}}>
            Authorized dealers only
          </p>
        </div>
      </div>
    </main>
  );
}
