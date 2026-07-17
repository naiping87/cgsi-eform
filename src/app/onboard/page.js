'use client';
import { useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { compressImage } from '@/lib/image-utils';

const STEPS = ['Personal', 'Employment', 'Documents', 'Confirm'];

function StepperIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '20px 0 12px' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            background: i === current ? 'var(--accent)' : i < current ? 'var(--success)' : 'var(--bg-card)',
            border: i > current ? '1.5px solid var(--border)' : 'none',
            color: i <= current ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.3s',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          <span style={{ fontSize: 10, color: i === current ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === current ? 600 : 400, display: i < 3 ? 'block' : 'none' }}>{s}</span>
          {i < steps.length - 1 && <div style={{ width: 20, height: 1, background: i < current ? 'var(--success)' : 'var(--border)' }} />}
        </div>
      ))}
    </div>
  );
}

export default function OnboardPageWrapper() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--text-muted)'}}>Loading...</p></div>}>
      <OnboardContent />
    </Suspense>
  );
}

function OnboardContent() {
  const searchParams = useSearchParams();
  const encodedPayload = searchParams.get('d') || '';
  let payload = {};
  try { if (encodedPayload) payload = JSON.parse(atob(decodeURIComponent(encodedPayload))); } catch {}

  const [lang, setLang] = useState('en');
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({ icFront: null, icBack: null, incomeDoc: null, bankStatement: null });
  const inputRefs = useRef({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (key, value) => setFormData((p) => ({ ...p, [key]: value }));
  const updateFile = (key, file) => setFiles((p) => ({ ...p, [key]: file }));

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    try {
      const fileUrls = {};
      for (const [key, file] of Object.entries(files)) {
        if (!file) continue;
        let f = file;
        if (file.type.startsWith('image/') && file.size > 1024 * 1024) f = await compressImage(file, 1920, 0.8);
        const fd = new FormData();
        fd.append('file', f, f.name || key);
        const ur = await fetch('/api/upload-blob', { method: 'POST', body: fd });
        const ud = await ur.json();
        if (!ur.ok) throw new Error(ud.error || `Upload ${key} failed`);
        fileUrls[key] = ud.url;
      }
      const res = await fetch('/api/submit-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, fileUrls, dealerEmail: payload.e }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Server error: ' + text.slice(0, 100)); }
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const s = (k) => {
    const map = {
      en: { step1: 'Personal Details', step2: 'Employment', step3: 'Documents', step4: 'Confirm',
        continue: 'Continue', back: 'Back', submit: 'Submit', close: 'Close Page',
        success: 'Submitted!', successMsg: 'Your application has been submitted. The dealer will process it shortly. You may close this page.',
        personal: 'Personal Details', personalDesc: 'Please fill in your personal information.',
        emergency: 'Emergency Contact', emergencyDesc: 'Must be spouse, parent, or sibling.',
        employment: 'Employment Details', employmentDesc: 'Your occupation and employment information.',
        docs: 'Upload Documents', docsDesc: 'Clear photos of your IC and income documents.',
        fullName: 'Full Name (as per NRIC)', maritalStatus: 'Marital Status',
        single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed',
        email: 'Email', mobile: 'Mobile Number', mailingAddress: 'Mailing Address',
        emergencyName: 'Emergency Contact Full Name', emergencyMobile: 'Emergency Contact Mobile No.',
        emergencyRelation: 'Relationship', spouse: 'Spouse', parent: 'Parent', sibling: 'Sibling',
        company: 'Company Name', occupation: 'Occupation', natureOfBiz: 'Nature of Business',
        yearsEmployed: 'Years in Employment', officeAddress: 'Office Address', officePhone: 'Office Phone',
        incomeTax: 'Income Tax Number',
        icFront: 'IC (Front)', icBack: 'IC (Back)',
        bankStatement: 'Bank Statement',
        bankExample: 'e.g., M2U Statement, CIMB Clicks, RHB Now (1 month for normal a/c, 3 months for margin a/c)',
        incomeDoc: 'Income Document',
        incomeExample: 'e.g., Payslip, EPF Statement, Notice of Assessment (NOA), Income Tax Form B / BE',
        review: 'Review & Submit', reviewDesc: 'Please review before submitting.',
        pdfHint: '📄 You can also upload PDF files (e.g., bank statements or EPF downloaded as PDF)',
      },
      zh: { step1: '个人信息', step2: '工作资料', step3: '上传文件', step4: '确认',
        continue: '继续', back: '返回', submit: '提交', close: '关闭页面',
        success: '已提交！', successMsg: '您的申请已提交，经纪将尽快处理。您可以关闭此页面。',
        personal: '个人信息', personalDesc: '请填写您的个人信息。',
        emergency: '紧急联络人', emergencyDesc: '必须是配偶、父母或兄弟姐妹。',
        employment: '工作详情', employmentDesc: '您的职业和雇佣信息。',
        docs: '上传文件', docsDesc: '请上传您的IC和收入文件的清晰照片。',
        fullName: '全名（与IC一致）', maritalStatus: '婚姻状况',
        single: '单身', married: '已婚', divorced: '离异', widowed: '丧偶',
        email: '电邮', mobile: '手机号码', mailingAddress: '邮寄地址',
        emergencyName: '紧急联络人姓名', emergencyMobile: '紧急联络人手机', emergencyRelation: '关系',
        spouse: '配偶', parent: '父母', sibling: '兄弟姐妹',
        company: '公司名称', occupation: '职业', natureOfBiz: '业务性质',
        yearsEmployed: '工作年数', officeAddress: '公司地址', officePhone: '公司电话', incomeTax: '所得税号码',
        icFront: 'IC（正面）', icBack: 'IC（背面）',
        bankStatement: '银行月结单',
        bankExample: '例：M2U Statement, CIMB Clicks, RHB Now（普通户口 1 个月，Margin 户口 3 个月）',
        incomeDoc: '收入证明',
        incomeExample: '例：工资单, 公积金结单 (EPF), 估税通知 (NOA), 报税表 B / BE',
        review: '确认提交', reviewDesc: '提交前请仔细检查。',
        pdfHint: '📄 也支持上传 PDF 文件（如银行下载的月结单、EPF 公积金结单）',
      },
      bm: { step1: 'Peribadi', step2: 'Pekerjaan', step3: 'Dokumen', step4: 'Sahkan',
        continue: 'Teruskan', back: 'Kembali', submit: 'Hantar', close: 'Tutup Halaman',
        success: 'Dihantar!', successMsg: 'Permohonan anda telah dihantar. Dealer akan memprosesnya. Anda boleh tutup halaman ini.',
        personal: 'Butiran Peribadi', personalDesc: 'Sila isi maklumat peribadi anda.',
        emergency: 'Kenalan Kecemasan', emergencyDesc: 'Mesti pasangan, ibu bapa, atau adik-beradik.',
        employment: 'Butiran Pekerjaan', employmentDesc: 'Maklumat pekerjaan anda.',
        docs: 'Muat Naik Dokumen', docsDesc: 'Gambar jelas IC dan dokumen pendapatan anda.',
        fullName: 'Nama Penuh (seperti IC)', maritalStatus: 'Status Perkahwinan',
        single: 'Bujang', married: 'Berkahwin', divorced: 'Bercerai', widowed: 'Duda/Janda',
        email: 'E-mel', mobile: 'No. Telefon', mailingAddress: 'Alamat Surat-Menyurat',
        emergencyName: 'Nama Kenalan Kecemasan', emergencyMobile: 'No. Telefon Kecemasan', emergencyRelation: 'Hubungan',
        spouse: 'Pasangan', parent: 'Ibu Bapa', sibling: 'Adik-Beradik',
        company: 'Nama Syarikat', occupation: 'Pekerjaan', natureOfBiz: 'Jenis Perniagaan',
        yearsEmployed: 'Tahun Bekerja', officeAddress: 'Alamat Pejabat', officePhone: 'Telefon Pejabat', incomeTax: 'No. Cukai Pendapatan',
        icFront: 'IC (Hadapan)', icBack: 'IC (Belakang)',
        bankStatement: 'Penyata Bank',
        bankExample: 'cth: M2U Statement, CIMB Clicks, RHB Now (1 bulan utk akaun biasa, 3 bulan utk margin)',
        incomeDoc: 'Dokumen Pendapatan',
        incomeExample: 'cth: Slip Gaji, Penyata EPF, Notis Taksiran (NOA), Borang Cukai B / BE',
        review: 'Semak & Hantar', reviewDesc: 'Sila semak sebelum menghantar.',
        pdfHint: '📄 Fail PDF juga diterima (cth: penyata bank atau EPF yang dimuat turun)',
      },
    };
    return (map[lang] || map.en)[k] || k;
  };

  const radioGroup = (name, options) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <label key={opt} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 13,
          borderColor: formData[name] === opt ? 'var(--accent)' : 'var(--border)',
          background: formData[name] === opt ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)',
          color: formData[name] === opt ? 'var(--accent)' : 'var(--text-secondary)',
          transition: 'all 0.2s',
        }}>
          <input type="radio" name={name} value={opt} checked={formData[name] === opt}
            onChange={(e) => updateField(name, e.target.value)} onBlur={(e) => { if (e.target.value) updateField(name, e.target.value); }}
            style={{ accentColor: 'var(--accent)', margin: 0 }} />
          {opt}
        </label>
      ))}
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg-card)', color: '#f1f5f9', fontSize: 13, fontFamily: 'var(--font)',
    outline: 'none', boxSizing: 'border-box',
  };

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 12 };

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{s('success')}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>{s('successMsg')}</p>
          <button onClick={() => window.close()} style={{
            padding: '12px 28px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: '#f1f5f9', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)',
          }}>{s('close')}</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>CGSI Account Opening</h1>
          <LanguageSwitcher lang={lang} onLangChange={setLang} />
        </div>
        <StepperIndicator steps={[s('step1'), s('step2'), s('step3'), s('step4')]} current={step} />

        <div style={{ marginTop: 16 }}>
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{s('personal')}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{s('personalDesc')}</p>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{s('fullName')}</label>
                <input style={inputStyle} value={formData.fullName || ''} onChange={(e) => updateField('fullName', e.target.value)} onBlur={(e) => { if (e.target.value) updateField('fullName', e.target.value); }} />
              </div>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{s('maritalStatus')}</label>
                {radioGroup('maritalStatus', [s('single'), s('married'), s('divorced'), s('widowed')])}
              </div>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{s('email')}</label>
                <input type="email" style={inputStyle} value={formData.email || ''} onChange={(e) => updateField('email', e.target.value)} onBlur={(e) => { if (e.target.value) updateField('email', e.target.value); }} />
              </div>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{s('mobile')}</label>
                <input type="tel" style={inputStyle} value={formData.mobileNo || ''} onChange={(e) => updateField('mobileNo', e.target.value)} onBlur={(e) => { if (e.target.value) updateField('mobileNo', e.target.value); }} />
              </div>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{s('mailingAddress')}</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={formData.mailingAddress || ''} onChange={(e) => updateField('mailingAddress', e.target.value)} onBlur={(e) => { if (e.target.value) updateField('mailingAddress', e.target.value); }} rows={2} />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{s('emergency')}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{s('emergencyDesc')}</p>
              </div>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{s('emergencyName')}</label>
                <input style={inputStyle} value={formData.emergencyName || ''} onChange={(e) => updateField('emergencyName', e.target.value)} onBlur={(e) => { if (e.target.value) updateField('emergencyName', e.target.value); }} />
              </div>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{s('emergencyMobile')}</label>
                <input type="tel" style={inputStyle} value={formData.emergencyMobile || ''} onChange={(e) => updateField('emergencyMobile', e.target.value)} onBlur={(e) => { if (e.target.value) updateField('emergencyMobile', e.target.value); }} />
              </div>
              <div style={cardStyle}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{s('emergencyRelation')}</label>
                {radioGroup('emergencyRelation', [s('spouse'), s('parent'), s('sibling')])}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{s('employment')}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{s('employmentDesc')}</p>
              {['company', 'occupation', 'natureOfBiz', 'yearsEmployed', 'officeAddress', 'officePhone', 'incomeTax'].map((k) => (
                <div style={cardStyle} key={k}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{s(k)}</label>
                  {k === 'officeAddress' ? (
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }} ref={(el) => { inputRefs.current[k] = el; }} value={formData[k] || ''} onChange={(e) => updateField(k, e.target.value)} onBlur={(e) => { if (e.target.value) updateField(k, e.target.value); }} rows={2} />
                  ) : (
                    <input type={k === 'yearsEmployed' ? 'number' : 'text'} style={inputStyle} ref={(el) => { inputRefs.current[k] = el; }} value={formData[k] || ''} onChange={(e) => updateField(k, e.target.value)} onBlur={(e) => { if (e.target.value) updateField(k, e.target.value); }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{s('docs')}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{s('docsDesc')}</p>
              {['icFront', 'icBack'].map((k) => (
                <div key={k} style={{ ...cardStyle, padding: 12 }}>
                  <FileUploader label={s(k)} onFile={(f) => updateFile(k, f)} lang={lang} />
                </div>
              ))}
              <div style={{ ...cardStyle, padding: 12 }}>
                <FileUploader label={s('bankStatement')} accept="image/*,.pdf" onFile={(f) => updateFile('bankStatement', f)} hint={s('pdfHint')} lang={lang} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{s('bankExample')}</p>
              </div>
              <div style={{ ...cardStyle, padding: 12 }}>
                <FileUploader label={s('incomeDoc')} accept="image/*,.pdf" onFile={(f) => updateFile('incomeDoc', f)} hint={s('pdfHint')} lang={lang} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{s('incomeExample')}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{s('review')}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{s('reviewDesc')}</p>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{s('personal')}</h3>
                {['fullName', 'maritalStatus', 'email', 'mobileNo', 'mailingAddress'].map((k) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s(k)}</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{formData[k] || '—'}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
                  <h3 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{s('emergency')}</h3>
                  {['emergencyName', 'emergencyMobile', 'emergencyRelation'].map((k) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{s(k)}</span>
                      <span style={{ color: '#f1f5f9' }}>{formData[k] || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{s('employment')}</h3>
                {['company', 'occupation', 'natureOfBiz', 'yearsEmployed', 'officeAddress', 'officePhone', 'incomeTax'].map((k) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s(k)}</span>
                    <span style={{ color: '#f1f5f9' }}>{formData[k] || '—'}</span>
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{s('docs')}</h3>
                <p style={{ fontSize: 12, color: '#f1f5f9' }}>{files.icFront ? '✅ IC Front' : '—'}</p>
                <p style={{ fontSize: 12, color: '#f1f5f9' }}>{files.icBack ? '✅ IC Back' : '—'}</p>
                <p style={{ fontSize: 12, color: '#f1f5f9' }}>{files.bankStatement ? '✅ Bank Statement' : '—'}</p>
                <p style={{ fontSize: 12, color: '#f1f5f9' }}>{files.incomeDoc ? '✅ Income Doc' : '—'}</p>
              </div>
              {error && <div style={{ ...cardStyle, borderColor: 'var(--danger)', background: 'rgba(239,68,68,0.06)' }}><p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p></div>}

            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          {step < 3 ? (
            <button onClick={() => {
            if (step === 1) {
              ['company','occupation','natureOfBiz','yearsEmployed','officeAddress','officePhone','incomeTax'].forEach(k => {
                const el = inputRefs.current[k];
                if (el && el.value && el.value !== (formData[k] || '')) updateField(k, el.value);
              });
            }
            setStep(step + 1);
          }} style={{
              width: '100%', padding: '14px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>{s('continue')}</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} style={{
              width: '100%', padding: '14px', borderRadius: 8, border: 'none',
              background: submitting ? 'var(--bg-card)' : 'var(--accent)',
              color: submitting ? 'var(--text-muted)' : '#fff', fontSize: 15, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)',
            }}>{submitting ? 'Submitting...' : s('submit')}</button>
          )}
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              width: '100%', padding: '10px', marginTop: 8, borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
            }}>← {s('back')}</button>
          )}
        </div>
      </div>
    </main>
  );
}
