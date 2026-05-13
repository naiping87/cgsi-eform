# CGSI E-Form 系统设计文档

**日期：** 2026-05-13
**版本：** 1.0

---

## 1. 项目目标

为 CGSI 制作移动端友好的 Web 应用，Dealer 选择表单模板 → 输入客户信息 → 生成签字链接 → 客户打开链接签名 → 自动生成带签名的 PDF → 发送到 Dealer 邮箱。

---

## 2. 技术栈

| 层次 | 选型 |
|------|------|
| 前端 | Next.js 14 + React 18 + Tailwind CSS |
| 后端 | Next.js API Routes |
| PDF 处理 | pdf-lib（叠加文字和签名图片到平面 PDF） |
| 手写签名 | signature_pad（Canvas 签名板） |
| 邮件发送 | Nodemailer + Gmail SMTP |
| 部署 | Vercel（免费） |
| 国际化 | 自定义字典文件（EN / 中文 / BM） |

---

## 3. 页面结构

| 路由 | 类型 | 说明 |
|------|------|------|
| `/` | 页面 | Dealer 首页：选模板 → 填客户信息 → 生成链接 |
| `/sign` | 页面 | Client 签字页：查看表单 → 手写签名 → 提交 |
| `/success` | 页面 | 确认页：签名提交成功 |
| `/api/generate-pdf` | API | 接收签名 + 数据 → 合成 PDF → 发邮件 |

---

## 4. 数据流

1. Dealer 选择模板类型，填写客户信息字段
2. 前端将数据 + 模板ID + 过期时间戳 打包为 JSON
3. JSON → Base64 编码 → 拼接到 `/sign?d=xxx`
4. Dealer 复制链接发给客户（微信/SMS/邮件）
5. Client 打开链接，前端解码 Base64 → 展示预览 → 签名板
6. Client 签名后提交 → API 用 pdf-lib 叠加文字和签名到 PDF
7. PDF 命名：`{模板简称}_{客户名}.pdf` → 发送到 `yunpeng.chin@cgsi.com`
8. 跳转成功页

---

## 5. 表单模板

### 5.1 Client Info Update Form (2 页, 1 签名)

- Client Name, Account Type (选择), CDS Account No
- New Name, NRIC/Passport No, Resident Status (选择)
- Address Type (选择), Address（多行）
- Mobile No, Home Tel, Office No, Email
- Standing Credit Instruction (选择), Bank Info
- Employment Status (选择), Employer/Business Info
- Gross Annual Income (12 区间选择)
- Net Worth, Source of Funds, Source of Wealth
- Next of Kin（姓名、关系、手机号、就业）
- **签名：** 1 处（Declaration 区域）

### 5.2 Individual FEN Declaration (4 页, 2 签名)

- Name of Applicant
- Trading Account Number
- Dealer Code
- 外汇资产声明（3 选 1）
- **签名：** 2 处（3选1 区 + 最终声明区）

### 5.3 Request for Change of DR (1 页, 1 签名)

- Client's Name, Trading A/C No
- Existing DR Name & Code
- New DR Name & Code
- Client NRIC/Company No
- **签名：** 客户 1 处（Confirmed by），Dealer 线下签

### 5.4 W-8BEN (1 页, 1 签名)

- Name of Beneficial Owner, Country of Citizenship
- Permanent Residence Address, Mailing Address
- US TIN, Foreign Tax ID, Reference Number
- Date of Birth, Treaty Country, Special Rates
- **签名：** 1 处

### 通用规则
- 所有字段可选，Dealer 不填则留空
- 部分 PDF 有格子框，文字需要对齐格子

---

## 6. PDF 填充方案

- 为每个模板创建坐标配置文件，定义每个字段的 `(x, y, fontSize, page)`
- 签名图片定义 `(x, y, width, height, page)`
- pdf-lib 读取原始 PDF → 叠加文字/签名 → 输出新 PDF

---

## 7. 国际化

- 三语字典文件：EN、中文、BM
- 语言选择器在页面顶部
- 偏好存 localStorage，下次自动恢复
- PDF 表单原文内容不改，只翻译界面提示词

---

## 8. 邮件配置

- 收件人：`yunpeng.chin@cgsi.com`（固定）
- 发件：Nodemailer + Gmail SMTP
- 附件命名：`{模板简称}_{客户名}.pdf`

---

## 9. 安全与限制

- 无需登录
- 数据内嵌 URL（Base64 编码）
- 链接 7 天过期（expiration timestamp）
- 过期后显示过期提示，不再展示表单数据
- 不存储任何客户数据到服务器或数据库

---

## 10. 设计师注

- 移动端优先设计
- 简洁、专业、与 CGSI 品牌一致
- 大按钮、大签名区域，触屏友好
