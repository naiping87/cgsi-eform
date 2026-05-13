# CGSI E-Form 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建移动端友好的 Web 应用，Dealer 选择表单模板填入客户信息生成签字链接，客户打开链接手写签名后自动合成 PDF 并发送邮件。

**Architecture:** Next.js 14 App Router 单一应用，所有前端页面 + API Routes 在一个项目中。数据通过 Base64 编码内嵌在 URL 中，无需数据库。PDF 使用 pdf-lib 叠加文字和签名图片。

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, pdf-lib, signature_pad, Nodemailer, Vercel

---

## 文件结构

```
src/
├── app/
│   ├── globals.css
│   ├── layout.js
│   ├── page.js                  # / Dealer 首页
│   ├── sign/
│   │   └── page.js              # /sign Client 签名页
│   ├── success/
│   │   └── page.js              # /success 成功页
│   └── api/
│       └── generate-pdf/
│           └── route.js         # POST API PDF生成+发邮件
├── components/
│   ├── LanguageSwitcher.jsx
│   ├── TemplateSelector.jsx
│   ├── DynamicForm.jsx
│   ├── SignaturePad.jsx
│   └── FormPreview.jsx
└── lib/
    ├── i18n.js                  # 三语字典
    ├── templates.js             # 四个模板的字段定义
    ├── coordinates.js           # PDF 坐标映射
    ├── pdf-generator.js         # pdf-lib PDF生成
    └── mailer.js                # Nodemailer 发邮件
```

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `jsconfig.json`, `.gitignore`, `.env.local`

- [ ] **Step 1: 创建 Next.js 项目**

```bash
cd "c:\Users\ediso\Documents\E-form project"
npx create-next-app@14 . --js --tailwind --eslint --app --src-dir --no-import-alias
```

Expected: 创建成功，package.json 中有 next@14, react@18, tailwindcss

- [ ] **Step 2: 安装额外依赖**

```bash
npm install pdf-lib signature_pad nodemailer
```

Expected: 3 个包安装成功

- [ ] **Step 3: 创建 .env.local**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TO_EMAIL=yunpeng.chin@cgsi.com
```

- [ ] **Step 4: 复制 PDF 模板到 public/forms/**

```bash
mkdir -p "public/forms"
cp "Client Info Update Form 2025_1.3.pdf" "public/forms/client-info-update.pdf"
cp "Individual FEN Declaration Form v2.0 1025 - Final 22092025.pdf" "public/forms/fen-declaration.pdf"
cp "REQUEST FOR CHANGE OF DEALER_CS_CGSI v1.1 OCT2025_1.pdf" "public/forms/change-of-dr.pdf"
cp "W-8BEN Form (Rev. October 21).pdf" "public/forms/w8ben.pdf"
```

- [ ] **Step 5: 配置 tailwind.config.js 支持移动端**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 2: 三语国际化字典

**Files:**
- Create: `src/lib/i18n.js`

- [ ] **Step 1: 创建 i18n.js 字典文件**

```js
const dict = {
  en: {
    appTitle: 'CGSI E-Form',
    selectTemplate: 'Select Template',
    step1: 'Step 1 — Choose a form template',
    step2: 'Step 2 — Fill in client information',
    fillInfo: 'Fill in client information below. Leave blank if not applicable.',
    generateLink: 'Generate Link',
    linkReady: 'Signature link is ready!',
    copyLink: 'Copy Link',
    linkExpires: 'This link expires in 7 days',
    sendToClient: 'Send this link to your client via WeChat, SMS, or Email',
    previewForm: 'Preview Form',
    signHere: 'Sign here',
    clearSignature: 'Clear',
    submitSignature: 'Submit Signature',
    confirmInfo: 'I confirm the information above is true and accurate',
    linkExpired: 'This link has expired',
    linkExpiredDesc: 'The signature link is no longer valid. Please contact your dealer for a new link.',
    signatureRequired: 'Please sign before submitting',
    successTitle: 'Submitted Successfully',
    successDesc: 'The signed PDF has been generated and sent to the dealer.',
    backToHome: 'Back to Home',
    signature: 'Signature',
    of: 'of',
    pages: 'pages',
    sig: 'signature(s)',
    // Form-specific
    clientName: 'Client Name',
    nric: 'NRIC / Passport No.',
    tradingAccount: 'Trading Account Number',
    dealerCode: 'Dealer Code',
    email: 'Email Address',
    mobile: 'Mobile No.',
    address: 'Address',
    // ... more fields as needed
  },

  zh: {
    appTitle: 'CGSI 电子表单',
    selectTemplate: '选择模板',
    step1: '第一步 — 选择表单模板',
    step2: '第二步 — 填写客户信息',
    fillInfo: '请填写以下客户信息，不适用可留空',
    generateLink: '生成链接',
    linkReady: '签字链接已生成！',
    copyLink: '复制链接',
    linkExpires: '链接 7 天后过期',
    sendToClient: '请通过微信、短信或邮件将链接发送给客户',
    previewForm: '预览表单',
    signHere: '在此签名',
    clearSignature: '清除',
    submitSignature: '提交签名',
    confirmInfo: '本人确认以上信息真实准确',
    linkExpired: '链接已过期',
    linkExpiredDesc: '此签字链接已失效，请联系您的 Dealer 获取新链接',
    signatureRequired: '请先签名再提交',
    successTitle: '提交成功',
    successDesc: '已签名的 PDF 已生成并发送给 Dealer',
    backToHome: '返回首页',
    signature: '签名',
    of: '/',
    pages: '页',
    sig: '个签名',
    clientName: '客户姓名',
    nric: '身份证/护照号',
    tradingAccount: '交易账号',
    dealerCode: 'Dealer 代码',
    email: '邮箱地址',
    mobile: '手机号',
    address: '地址',
  },

  bm: {
    appTitle: 'CGSI E-Borang',
    selectTemplate: 'Pilih Templat',
    step1: 'Langkah 1 — Pilih templat borang',
    step2: 'Langkah 2 — Isi maklumat pelanggan',
    fillInfo: 'Sila isi maklumat pelanggan di bawah. Kosongkan jika tidak berkaitan.',
    generateLink: 'Jana Pautan',
    linkReady: 'Pautan tandatangan sedia!',
    copyLink: 'Salin Pautan',
    linkExpires: 'Pautan tamat dalam 7 hari',
    sendToClient: 'Hantar pautan ini kepada pelanggan melalui WeChat, SMS, atau Emel',
    previewForm: 'Pratonton Borang',
    signHere: 'Tandatangan di sini',
    clearSignature: 'Padam',
    submitSignature: 'Hantar Tandatangan',
    confirmInfo: 'Saya mengesahkan maklumat di atas adalah benar dan tepat',
    linkExpired: 'Pautan telah tamat',
    linkExpiredDesc: 'Pautan tandatangan tidak lagi sah. Sila hubungi dealer anda untuk pautan baharu.',
    signatureRequired: 'Sila tandatangan sebelum menghantar',
    successTitle: 'Berjaya Dihantar',
    successDesc: 'PDF bertandatangan telah dijana dan dihantar kepada dealer.',
    backToHome: 'Kembali ke Utama',
    signature: 'Tandatangan',
    of: 'daripada',
    pages: 'muka surat',
    sig: 'tandatangan',
    clientName: 'Nama Pelanggan',
    nric: 'NRIC / No. Pasport',
    tradingAccount: 'Nombor Akaun Dagangan',
    dealerCode: 'Kod Dealer',
    email: 'Alamat Emel',
    mobile: 'No. Telefon Bimbit',
    address: 'Alamat',
  },
};

export function t(lang, key) {
  return dict[lang]?.[key] || dict.en[key] || key;
}

export const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'bm', label: 'BM' },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/i18n.js
git commit -m "feat: add trilingual i18n dictionary"
```

---

### Task 3: 表单模板字段定义

**Files:**
- Create: `src/lib/templates.js`

- [ ] **Step 1: 创建 templates.js**

```js
export const FIELD_TYPES = {
  TEXT: 'text',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
};

export const TEMPLATES = [
  {
    id: 'client-info-update',
    name: 'Client Info Update Form',
    pages: 2,
    sigCount: 1,
    fields: [
      { key: 'clientName', labelKey: 'clientName', type: 'text' },
      { key: 'accountType', labelKey: 'accountType', type: 'select', options: [
        { value: 'equities', label: 'Equities Trading & CDS Account' },
        { value: 'margin', label: 'Margin Trading & CDS Account' },
        { value: 'all', label: 'All Account(s)' },
      ]},
      { key: 'cdsAccountNo', labelKey: 'cdsAccountNo', type: 'text' },
      { key: 'newName', labelKey: 'newName', type: 'text' },
      { key: 'nric', labelKey: 'nric', type: 'text' },
      { key: 'residentStatus', labelKey: 'residentStatus', type: 'select', options: [
        { value: 'resident', label: 'Resident' },
        { value: 'non-resident', label: 'Non-Resident' },
      ]},
      { key: 'addressType', labelKey: 'addressType', type: 'select', options: [
        { value: 'registered', label: 'Registered Address' },
        { value: 'correspondence', label: 'Correspondence Address' },
      ]},
      { key: 'address', labelKey: 'address', type: 'textarea' },
      { key: 'mobileNo', labelKey: 'mobile', type: 'text' },
      { key: 'homeTel', labelKey: 'homeTel', type: 'text' },
      { key: 'officeNo', labelKey: 'officeNo', type: 'text' },
      { key: 'email', labelKey: 'email', type: 'text' },
      { key: 'standingInstruction', labelKey: 'standingInstruction', type: 'select', options: [
        { value: 'trust', label: 'Trust Account' },
        { value: 'bank', label: 'Designated Bank Account' },
      ]},
      { key: 'bankName', labelKey: 'bankName', type: 'text' },
      { key: 'bankAccountName', labelKey: 'bankAccountName', type: 'text' },
      { key: 'bankAccountNo', labelKey: 'bankAccountNo', type: 'text' },
      { key: 'employmentStatus', labelKey: 'employmentStatus', type: 'select', options: [
        { value: 'employed', label: 'Employed' },
        { value: 'self-employed', label: 'Self Employed' },
        { value: 'others', label: 'Others' },
      ]},
      { key: 'employerName', labelKey: 'employerName', type: 'text' },
      { key: 'employerAddress', labelKey: 'employerAddress', type: 'textarea' },
      { key: 'natureOfBusiness', labelKey: 'natureOfBusiness', type: 'text' },
      { key: 'occupation', labelKey: 'occupation', type: 'text' },
      { key: 'grossAnnualIncome', labelKey: 'grossAnnualIncome', type: 'select', options: [
        { value: 'below-12k', label: 'Below RM 12,000' },
        { value: '12k-24k', label: 'RM 12,000 – RM 24,000' },
        { value: '24k-36k', label: 'RM 24,001 – RM 36,000' },
        { value: '36k-48k', label: 'RM 36,001 – RM 48,000' },
        { value: '48k-60k', label: 'RM 48,001 – RM 60,000' },
        { value: '60k-100k', label: 'RM 60,001 – RM 100,000' },
        { value: '100k-300k', label: 'RM 100,001 – RM 300,000' },
        { value: '300k-600k', label: 'RM 300,001 – RM 600,000' },
        { value: '600k-800k', label: 'RM 600,001 – RM 800,000' },
        { value: '800k-1m', label: 'RM 800,001 – RM 1,000,000' },
        { value: '1m-3m', label: 'RM 1,000,001 – RM 3,000,000' },
        { value: 'above-3m', label: 'Above RM 3,000,001' },
      ]},
      { key: 'netWorth', labelKey: 'netWorth', type: 'select', options: [
        { value: 'below-50k', label: 'Below RM 50,000' },
        { value: '50k-100k', label: 'RM 50,000 – RM 100,000' },
        { value: '100k-200k', label: 'RM 100,001 – RM 200,000' },
        { value: '200k-500k', label: 'RM 200,001 – RM 500,000' },
        { value: '500k-1m', label: 'RM 500,001 – RM 1,000,000' },
        { value: '1m-2m', label: 'RM 1,000,001 – RM 2,000,000' },
        { value: '2m-3m', label: 'RM 2,000,001 – RM 3,000,000' },
        { value: 'above-3m', label: 'Above RM 3,000,001' },
      ]},
      { key: 'sourceOfFunds', labelKey: 'sourceOfFunds', type: 'select', options: [
        { value: 'salary', label: 'Salary' },
        { value: 'commission', label: 'Commission' },
        { value: 'business', label: 'Business Income' },
        { value: 'interest', label: 'Interest Income' },
        { value: 'rental', label: 'Rental' },
        { value: 'investment', label: 'Investment Income' },
      ]},
      { key: 'sourceOfWealth', labelKey: 'sourceOfWealth', type: 'select', options: [
        { value: 'savings', label: 'Savings' },
        { value: 'epf', label: 'Pension Fund / EPF' },
        { value: 'inheritance', label: 'Inheritance' },
        { value: 'gift', label: 'Gift' },
        { value: 'sale-property', label: 'Sale of Real Estate' },
      ]},
      { key: 'kinName', labelKey: 'kinName', type: 'text' },
      { key: 'kinRelationship', labelKey: 'kinRelationship', type: 'text' },
      { key: 'kinMobile', labelKey: 'kinMobile', type: 'text' },
      { key: 'kinEmployment', labelKey: 'kinEmployment', type: 'select', options: [
        { value: 'employed', label: 'Employed' },
        { value: 'self-employed', label: 'Self Employed' },
        { value: 'others', label: 'Others' },
      ]},
    ],
  },

  {
    id: 'fen-declaration',
    name: 'Individual FEN Declaration Form',
    pages: 4,
    sigCount: 2,
    fields: [
      { key: 'applicantName', labelKey: 'applicantName', type: 'text' },
      { key: 'tradingAccountNo', labelKey: 'tradingAccount', type: 'text' },
      { key: 'dealerCode', labelKey: 'dealerCode', type: 'text' },
      { key: 'fenOption', labelKey: 'fenOption', type: 'select', options: [
        { value: 'no-borrowing', label: 'No domestic Ringgit borrowing/financing' },
        { value: 'has-borrowing-within', label: 'Has borrowing, within threshold' },
        { value: 'has-borrowing-exceed', label: 'Has borrowing, exceeds threshold' },
      ]},
    ],
  },

  {
    id: 'change-of-dr',
    name: 'Request for Change of DR',
    pages: 1,
    sigCount: 1,
    fields: [
      { key: 'clientName', labelKey: 'clientName', type: 'text' },
      { key: 'tradingAccountNo', labelKey: 'tradingAccount', type: 'text' },
      { key: 'existingDrName', labelKey: 'existingDrName', type: 'text' },
      { key: 'existingDrCode', labelKey: 'existingDrCode', type: 'text' },
      { key: 'newDrName', labelKey: 'newDrName', type: 'text' },
      { key: 'newDrCode', labelKey: 'newDrCode', type: 'text' },
      { key: 'clientNric', labelKey: 'clientNric', type: 'text' },
    ],
  },

  {
    id: 'w8ben',
    name: 'W-8BEN Form',
    pages: 1,
    sigCount: 1,
    fields: [
      { key: 'beneficialOwnerName', labelKey: 'beneficialOwnerName', type: 'text' },
      { key: 'countryOfCitizenship', labelKey: 'countryOfCitizenship', type: 'text' },
      { key: 'permanentAddress', labelKey: 'permanentAddress', type: 'textarea' },
      { key: 'mailingAddress', labelKey: 'mailingAddress', type: 'textarea' },
      { key: 'usTin', labelKey: 'usTin', type: 'text' },
      { key: 'foreignTaxId', labelKey: 'foreignTaxId', type: 'text' },
      { key: 'referenceNumber', labelKey: 'referenceNumber', type: 'text' },
      { key: 'dateOfBirth', labelKey: 'dateOfBirth', type: 'text' },
      { key: 'treatyCountry', labelKey: 'treatyCountry', type: 'text' },
      { key: 'specialRates', labelKey: 'specialRates', type: 'text' },
    ],
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || null;
}

// 模板简称用于 PDF 文件命名
export const TEMPLATE_SHORT_NAMES = {
  'client-info-update': 'ClientInfoUpdate',
  'fen-declaration': 'FENDeclaration',
  'change-of-dr': 'ChangeOfDR',
  'w8ben': 'W8BEN',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/templates.js
git commit -m "feat: add form template field definitions"
```

---

### Task 4: PDF 坐标映射

**Files:**
- Create: `src/lib/coordinates.js`

- [ ] **Step 1: 创建坐标配置文件（坐标需在实现时精确测量）**

```js
// PDF 坐标映射 - 原点为左下角
// 坐标单位: PDF points (1pt = 1/72 inch)

export const COORDINATES = {
  'client-info-update': {
    fields: {
      clientName:        { x: 120, y: 710, size: 10, page: 0 },
      accountType:       { x: 120, y: 680, size: 10, page: 0 }, // 需要根据勾选绘制 checkbox
      cdsAccountNo:      { x: 120, y: 660, size: 10, page: 0 },
      newName:           { x: 120, y: 560, size: 10, page: 0 },
      nric:              { x: 120, y: 530, size: 10, page: 0 },
      residentStatus:    { x: 120, y: 510, size: 10, page: 0 },
      addressType:       { x: 120, y: 490, size: 10, page: 0 },
      address:           { x: 120, y: 450, size: 10, page: 0 },
      mobileNo:          { x: 120, y: 380, size: 10, page: 0 },
      homeTel:           { x: 300, y: 380, size: 10, page: 0 },
      officeNo:          { x: 480, y: 380, size: 10, page: 0 },
      email:             { x: 120, y: 350, size: 10, page: 0 },
      standingInstruction: { x: 120, y: 300, size: 10, page: 0 },
      bankName:          { x: 120, y: 260, size: 10, page: 0 },
      bankAccountName:   { x: 120, y: 245, size: 10, page: 0 },
      bankAccountNo:     { x: 120, y: 230, size: 10, page: 0 },
      // Page 1 fields (employment, financial, etc.)
      employmentStatus:  { x: 120, y: 680, size: 10, page: 1 },
      employerName:      { x: 120, y: 640, size: 10, page: 1 },
      employerAddress:   { x: 120, y: 610, size: 10, page: 1 },
      natureOfBusiness:  { x: 120, y: 570, size: 10, page: 1 },
      occupation:        { x: 120, y: 540, size: 10, page: 1 },
      grossAnnualIncome: { x: 120, y: 460, size: 10, page: 1 },
      netWorth:          { x: 120, y: 420, size: 10, page: 1 },
      sourceOfFunds:     { x: 120, y: 380, size: 10, page: 1 },
      sourceOfWealth:    { x: 120, y: 340, size: 10, page: 1 },
      kinName:           { x: 120, y: 240, size: 10, page: 1 },
      kinRelationship:   { x: 350, y: 240, size: 10, page: 1 },
      kinMobile:         { x: 120, y: 210, size: 10, page: 1 },
      kinEmployment:     { x: 120, y: 190, size: 10, page: 1 },
    },
    signatures: [
      { x: 80, y: 60, w: 150, h: 50, page: 1 }, // Declaration signature
    ],
  },

  'fen-declaration': {
    fields: {
      applicantName:     { x: 150, y: 620, size: 11, page: 0 },
      tradingAccountNo:  { x: 150, y: 600, size: 11, page: 0 },
      dealerCode:        { x: 150, y: 580, size: 11, page: 0 },
      fenOption:         { x: 80,  y: 480, size: 10, page: 0 }, // checkbox area
    },
    signatures: [
      { x: 450, y: 480, w: 120, h: 40, page: 0 }, // 3选1 签名
      { x: 80,  y: 100, w: 150, h: 50, page: 3 }, // 最终声明签名
    ],
  },

  'change-of-dr': {
    fields: {
      clientName:        { x: 150, y: 650, size: 11, page: 0 },
      tradingAccountNo:  { x: 400, y: 650, size: 11, page: 0 },
      existingDrName:    { x: 150, y: 610, size: 11, page: 0 },
      existingDrCode:    { x: 450, y: 610, size: 11, page: 0 },
      newDrName:         { x: 150, y: 540, size: 11, page: 0 },
      newDrCode:         { x: 450, y: 540, size: 11, page: 0 },
      clientNric:        { x: 120, y: 270, size: 11, page: 0 },
    },
    signatures: [
      { x: 200, y: 320, w: 150, h: 50, page: 0 }, // Confirmed by client
    ],
  },

  'w8ben': {
    fields: {
      beneficialOwnerName: { x: 120, y: 620, size: 10, page: 0 },
      countryOfCitizenship:{ x: 120, y: 600, size: 10, page: 0 },
      permanentAddress:    { x: 120, y: 570, size: 10, page: 0 },
      mailingAddress:      { x: 120, y: 520, size: 10, page: 0 },
      usTin:               { x: 120, y: 480, size: 10, page: 0 },
      foreignTaxId:        { x: 120, y: 460, size: 10, page: 0 },
      referenceNumber:     { x: 120, y: 440, size: 10, page: 0 },
      dateOfBirth:         { x: 120, y: 420, size: 10, page: 0 },
      treatyCountry:       { x: 120, y: 350, size: 10, page: 0 },
      specialRates:        { x: 120, y: 310, size: 10, page: 0 },
    },
    signatures: [
      { x: 80, y: 140, w: 150, h: 50, page: 0 }, // Sign Here
    ],
  },
};
```

- [ ] **注:** 坐标值为近似值，实现时需打开 PDF 用 pdf-lib 的 `getPage(0).getSize()` 获取页面尺寸，然后根据字段在页面的相对位置精确计算坐标。每个 PDF 页面宽约 612pt，高约 792pt（Letter）或 1008pt（某些表单）。

- [ ] **Step 2: Commit**

```bash
git add src/lib/coordinates.js
git commit -m "feat: add PDF coordinate mappings"
```

---

### Task 5: PDF 生成逻辑

**Files:**
- Create: `src/lib/pdf-generator.js`

- [ ] **Step 1: 创建 pdf-generator.js**

```js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { COORDINATES } from './coordinates';
import { TEMPLATES, TEMPLATE_SHORT_NAMES } from './templates';

const FORMS_DIR = path.join(process.cwd(), 'public', 'forms');

const PDF_FILES = {
  'client-info-update': 'client-info-update.pdf',
  'fen-declaration': 'fen-declaration.pdf',
  'change-of-dr': 'change-of-dr.pdf',
  'w8ben': 'w8ben.pdf',
};

// 用选项 label 替换 value（如 resident -> Resident）
function getDisplayValue(templateId, key, value) {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) return value;

  const field = template.fields.find(f => f.key === key);
  if (field && field.type === 'select' && field.options) {
    const option = field.options.find(o => o.value === value);
    return option ? option.label : value;
  }

  return value;
}

// signatureBuffers: Buffer[] 从 base64 data URL 转换而来的 PNG 二进制数据
export async function generatePDF(templateId, formData, signatureBuffers) {
  const pdfPath = path.join(FORMS_DIR, PDF_FILES[templateId]);
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const coord = COORDINATES[templateId];

  const pages = pdfDoc.getPages();

  // 填写文字字段
  if (coord.fields) {
    for (const [key, pos] of Object.entries(coord.fields)) {
      const value = formData[key];
      if (!value) continue;

      const page = pages[pos.page];
      const displayValue = getDisplayValue(templateId, key, value);

      page.drawText(displayValue, {
        x: pos.x,
        y: pos.y,
        size: pos.size || 10,
        font,
        color: rgb(0, 0, 0),
        maxWidth: pos.maxWidth || 400,
      });
    }
  }

  // 叠加签名图片
  if (coord.signatures && signatureBuffers) {
    for (let i = 0; i < coord.signatures.length; i++) {
      const sigPos = coord.signatures[i];
      const sigBuf = signatureBuffers[i];
      if (!sigBuf) continue;

      const page = pages[sigPos.page];
      const sigImage = await pdfDoc.embedPng(sigBuf);

      page.drawImage(sigImage, {
        x: sigPos.x,
        y: sigPos.y,
        width: sigPos.w,
        height: sigPos.h,
      });
    }
  }

  const outputBytes = await pdfDoc.save();
  return Buffer.from(outputBytes);
}

export function getPDFFilename(templateId, formData) {
  const shortName = TEMPLATE_SHORT_NAMES[templateId] || templateId;
  const clientName = (formData.clientName || formData.applicantName || formData.beneficialOwnerName || 'unknown')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return `${shortName}_${clientName}.pdf`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pdf-generator.js
git commit -m "feat: add PDF generation with pdf-lib"
```

---

### Task 6: 邮件发送模块

**Files:**
- Create: `src/lib/mailer.js`

- [ ] **Step 1: 创建 mailer.js**

```js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPDFByEmail(pdfBuffer, filename) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.TO_EMAIL,
    subject: `Signed Form: ${filename}`,
    text: `A client has signed the form.\n\nForm: ${filename}\n\nPlease find the signed PDF attached.`,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mailer.js
git commit -m "feat: add email sending with Nodemailer"
```

---

### Task 7: LanguageSwitcher 组件

**Files:**
- Create: `src/components/LanguageSwitcher.jsx`

- [ ] **Step 1: 创建 LanguageSwitcher.jsx**

```jsx
'use client';
import { LANGUAGES } from '@/lib/i18n';

export default function LanguageSwitcher({ lang, onLangChange }) {
  return (
    <div className="flex gap-1 mb-4">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => onLangChange(l.code)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            lang === l.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LanguageSwitcher.jsx
git commit -m "feat: add LanguageSwitcher component"
```

---

### Task 8: TemplateSelector 组件

**Files:**
- Create: `src/components/TemplateSelector.jsx`

- [ ] **Step 1: 创建 TemplateSelector.jsx**

```jsx
'use client';
import { TEMPLATES } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function TemplateSelector({ lang, selected, onSelect }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
        {t(lang, 'step1')}
      </p>
      <div className="space-y-2">
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => onSelect(tmpl.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              selected === tmpl.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {tmpl.name}
              </div>
              <div className="text-xs text-gray-400">
                {tmpl.pages} {t(lang, 'pages')} · {tmpl.sigCount} {t(lang, 'sig')}
              </div>
            </div>
            {selected === tmpl.id && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TemplateSelector.jsx
git commit -m "feat: add TemplateSelector component"
```

---

### Task 9: DynamicForm 组件

**Files:**
- Create: `src/components/DynamicForm.jsx`

- [ ] **Step 1: 创建 DynamicForm.jsx**

```jsx
'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function DynamicForm({ lang, templateId, formData, onChange }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
        {t(lang, 'step2')}
      </p>
      <p className="text-xs text-gray-400 mb-3">{t(lang, 'fillInfo')}</p>
      <div className="space-y-3">
        {template.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t(lang, field.key)}
            </label>
            {field.type === 'select' ? (
              <select
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">--</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            ) : (
              <input
                type="text"
                value={formData[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DynamicForm.jsx
git commit -m "feat: add DynamicForm component"
```

---

### Task 10: SignaturePad 组件

**Files:**
- Create: `src/components/SignaturePad.jsx`

- [ ] **Step 1: 创建 SignaturePad.jsx**

```jsx
'use client';
import { useRef, useEffect, useCallback } from 'react';
import SignaturePadLib from 'signature_pad';

export default function SignaturePad({ onSignatureChange, label, lang, t }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);

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
      if (onSignatureChange && padRef.current) {
        onSignatureChange(padRef.current.toDataURL());
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
      if (onSignatureChange) onSignatureChange(null);
    }
  }, [onSignatureChange]);

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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SignaturePad.jsx
git commit -m "feat: add SignaturePad component"
```

---

### Task 11: FormPreview 组件

**Files:**
- Create: `src/components/FormPreview.jsx`

- [ ] **Step 1: 创建 FormPreview.jsx**

```jsx
'use client';
import { getTemplate } from '@/lib/templates';
import { t } from '@/lib/i18n';

export default function FormPreview({ lang, templateId, formData }) {
  const template = getTemplate(templateId);
  if (!template) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h3 className="font-semibold text-sm text-gray-800 mb-2">{template.name}</h3>
      <div className="space-y-1.5">
        {template.fields.map((field) => {
          const value = formData[field.key];
          if (!value) return null;
          let displayValue = value;
          if (field.type === 'select' && field.options) {
            const opt = field.options.find(o => o.value === value);
            displayValue = opt ? opt.label : value;
          }
          return (
            <div key={field.key} className="flex text-xs">
              <span className="text-gray-400 w-1/3 flex-shrink-0">{t(lang, field.key)}:</span>
              <span className="text-gray-800 font-medium truncate">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FormPreview.jsx
git commit -m "feat: add FormPreview component"
```

---

### Task 12: Dealer 首页 (/)

**Files:**
- Create: `src/app/page.js`

- [ ] **Step 1: 创建 Dealer 首页**

```jsx
'use client';
import { useState, useCallback } from 'react';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TemplateSelector from '@/components/TemplateSelector';
import DynamicForm from '@/components/DynamicForm';

// 7 days in milliseconds
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function HomePage() {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('cgsi-lang') || 'en';
    return 'en';
  });
  const [templateId, setTemplateId] = useState(null);
  const [formData, setFormData] = useState({});
  const [link, setLink] = useState('');

  const handleLangChange = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('cgsi-lang', newLang);
  }, []);

  const handleFieldChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const generateLink = useCallback(() => {
    const payload = {
      t: templateId,
      f: formData,
      x: Date.now() + SEVEN_DAYS,
    };
    const json = JSON.stringify(payload);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}/sign?d=${encodeURIComponent(base64)}`;
    setLink(url);
  }, [templateId, formData]);

  const copyLink = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
  }, [link]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">{t(lang, 'appTitle')}</h1>
          <LanguageSwitcher lang={lang} onLangChange={handleLangChange} />
        </div>

        {!link ? (
          <>
            <TemplateSelector lang={lang} selected={templateId} onSelect={setTemplateId} />

            {templateId && (
              <div className="mt-6">
                <DynamicForm
                  lang={lang}
                  templateId={templateId}
                  formData={formData}
                  onChange={handleFieldChange}
                />
                <button
                  onClick={generateLink}
                  className="w-full mt-6 py-3.5 bg-green-600 text-white font-semibold rounded-xl text-base hover:bg-green-700 active:scale-[0.98] transition-all"
                >
                  {t(lang, 'generateLink')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t(lang, 'linkReady')}</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-600 break-all select-all">{link}</p>
            </div>
            <button
              onClick={copyLink}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 active:scale-[0.98] transition-all mb-2"
            >
              {t(lang, 'copyLink')}
            </button>
            <p className="text-xs text-amber-600">{t(lang, 'linkExpires')}</p>
            <p className="text-xs text-gray-400 mt-3">{t(lang, 'sendToClient')}</p>
            <button
              onClick={() => { setLink(''); setTemplateId(null); setFormData({}); }}
              className="mt-4 text-sm text-blue-600 font-medium"
            >
              {t(lang, 'backToHome')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.js
git commit -m "feat: add Dealer home page with template selection and form"
```

---

### Task 13: Client 签名页 (/sign)

**Files:**
- Create: `src/app/sign/page.js`

- [ ] **Step 1: 创建 Client 签名页**

```jsx
'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { getTemplate } from '@/lib/templates';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FormPreview from '@/components/FormPreview';
import SignaturePad from '@/components/SignaturePad';

function SignPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encoded = searchParams.get('d');

  const [lang, setLang] = useState('en');
  const [data, setData] = useState(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!encoded) { setError(true); return; }
    try {
      const json = decodeURIComponent(atob(decodeURIComponent(encoded)));
      const parsed = JSON.parse(json);
      if (Date.now() > parsed.x) {
        setExpired(true);
        return;
      }
      setData(parsed);
    } catch {
      setError(true);
    }
  }, [encoded]);

  const handleSignatureChange = useCallback((index) => (sigDataUrl) => {
    setSignatures(prev => {
      const next = [...prev];
      next[index] = sigDataUrl;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const template = getTemplate(data.t);
    const allSigned = Array.from({ length: template.sigCount }, (_, i) => signatures[i]);
    if (allSigned.some(s => !s)) {
      alert(t(lang, 'signatureRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: data.t,
          formData: data.f,
          signatures: allSigned,
        }),
      });

      if (res.ok) {
        router.push('/success');
      } else {
        alert('Error generating PDF. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [data, signatures, lang, router]);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500">Invalid link.</p>
        </div>
      </main>
    );
  }

  if (expired) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏰</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t(lang, 'linkExpired')}</h2>
          <p className="text-sm text-gray-500">{t(lang, 'linkExpiredDesc')}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  const template = getTemplate(data.t);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">{t(lang, 'appTitle')}</h1>
          <LanguageSwitcher lang={lang} onLangChange={setLang} />
        </div>

        <p className="text-xs text-gray-400 font-semibold uppercase mb-2">{t(lang, 'previewForm')}</p>
        <FormPreview lang={lang} templateId={data.t} formData={data.f} />

        <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠ {t(lang, 'linkExpires')}: {new Date(data.x).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {Array.from({ length: template.sigCount }, (_, i) => (
            <SignaturePad
              key={i}
              onSignatureChange={handleSignatureChange(i)}
              label={`${t(lang, 'signature')} ${i + 1} ${t(lang, 'of')} ${template.sigCount}`}
              lang={lang}
              t={(key) => t(lang, key)}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-0.5" required />
            <span className="text-xs text-gray-600">{t(lang, 'confirmInfo')}</span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-4 py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-base hover:bg-blue-700 disabled:bg-gray-300 active:scale-[0.98] transition-all"
        >
          {submitting ? 'Processing...' : t(lang, 'submitSignature')}
        </button>
      </div>
    </main>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <SignPageContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/sign/page.js
git commit -m "feat: add Client signature page"
```

---

### Task 14: PDF 生成 API (/api/generate-pdf)

**Files:**
- Create: `src/app/api/generate-pdf/route.js`

- [ ] **Step 1: 创建 API route**

```js
import { NextResponse } from 'next/server';
import { generatePDF, getPDFFilename } from '@/lib/pdf-generator';
import { sendPDFByEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, formData, signatures } = body;

    if (!templateId || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // signatures 是 base64 data URL 数组，提取纯 base64 部分
    const sigBuffers = signatures.map(sig => {
      if (!sig) return null;
      const base64 = sig.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    }).filter(Boolean);

    const pdfBuffer = await generatePDF(templateId, formData, sigBuffers);
    const filename = getPDFFilename(templateId, formData);

    // 发送邮件
    try {
      await sendPDFByEmail(pdfBuffer, filename);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      // 邮件失败仍然返回成功（PDF已生成）
    }

    return NextResponse.json({ success: true, filename });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/generate-pdf/route.js
git commit -m "feat: add PDF generation and email API"
```

---

### Task 15: 成功页面 (/success)

**Files:**
- Create: `src/app/success/page.js`

- [ ] **Step 1: 创建成功页**

```jsx
'use client';
import { useState } from 'react';
import { t } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default function SuccessPage() {
  const [lang, setLang] = useState('en');

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <LanguageSwitcher lang={lang} onLangChange={setLang} />
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t(lang, 'successTitle')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t(lang, 'successDesc')}</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors"
        >
          {t(lang, 'backToHome')}
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/success/page.js
git commit -m "feat: add success confirmation page"
```

---

### Task 16: 全局 layout 和样式

**Files:**
- Modify: `src/app/layout.js`
- Modify: `src/app/globals.css`

- [ ] **Step 1: 更新 layout.js**

```jsx
export const metadata = {
  title: 'CGSI E-Form',
  description: 'CGSI Electronic Form System',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#f8fafc" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 更新 globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 移动端优化 */
* {
  -webkit-tap-highlight-color: transparent;
}

input, select, textarea {
  font-size: 16px; /* 防止 iOS 缩放 */
}

/* 签名板样式 */
canvas {
  touch-action: none;
}
```

- [ ] **Step 3: 清理 create-next-app 生成的默认页面**

删除不必要的默认文件和样式

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.js src/app/globals.css
git commit -m "feat: update global layout and styles for mobile"
```

---

### Task 17: 整体测试和部署

- [ ] **Step 1: 运行开发服务器**

```bash
npm run dev
```

测试:
1. 打开 http://localhost:3000 → Dealer 首页，选择模板、填写信息、生成链接
2. 复制链接在新标签页打开 → Client 签名页，预览信息、签名、提交
3. 验证成功页面显示
4. 验证邮件已收到 PDF 附件（需配置 SMTP）

- [ ] **Step 2: 修复任何错误后，构建生产版本**

```bash
npm run build
```

Expected: 无错误，成功构建

- [ ] **Step 3: 部署到 Vercel**

```bash
npx vercel --prod
```

按提示配置环境变量（SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TO_EMAIL）

- [ ] **Step 4: Commit 最终版本**

```bash
git add -A
git commit -m "feat: complete CGSI E-Form application"
```

---

## 注意事项

1. **PDF 坐标测量:** Task 4 中的坐标为估算值。实现时需用 pdf-lib 逐页测量，确保文字对齐 PDF 中的格子框。
2. **Gmail SMTP 密码:** 需要在 Gmail 账户中开启 2FA 并生成 App Password，不能用普通密码。
3. **signature_pad 在 Next.js 中:** 需要使用 `'use client'` 指令，且初始化放在 useEffect 中（DOM 访问）。
4. **URL 长度限制:** 如果表单数据很大，Base64 编码的 URL 可能会很长。注意浏览器 URL 长度限制（约 2000 字符）。如果遇到超出，可考虑压缩数据或切换为短链接方案。
