# AGENTS.md — cgsi-eform 的 Codex 项目手册

> 本文件模仿 `naiping87/dsh-worklog` 根目录 `AGENTS.md` 的编排，作为
> cgsi-eform（CGSI 电子表单签署系统）的 Codex 入口。任何 Codex 会话
> 处理本项目时，开工先读本文件。

## 强制规则

- 用户要求：处理本项目任务时，遵守 `$karpathy-guidelines`。
  动手前先读取该技能 `SKILL.md`，按“先想清楚、最小改动、只改必要的部分、
  目标可验证”执行。
- 始终使用中文回复。
- 只做用户明确要求的事情；先说明假设；交付前验证；不夸大完成度。
- 不记录或提交密码、API Key、Token、恢复码等敏感信息。
  本项目依赖 `.env`（SMTP 口令 / HMAC 密钥 / Blob token），**不要**把
  `.env`、`.env.local`、`.env.*` 提交进 git。

## 项目速览

- 产品：CGSI 电子表单签署系统。Dealer 上传已填写的 PDF → 生成签署链接 →
  客户在线签名 → 系统把签名叠加到 PDF → 下载并自动邮件发送结果。
- 技术栈：Next.js 14 (App Router) + React 18 + Tailwind CSS；
  PDF：pdf-lib（叠加签名/文本）、pdfjs-dist（文本锚点定位）、canvas（服务端渲染）；
  存储：Vercel Blob；邮件：nodemailer (SMTP)；签名：signature_pad；
  认证：HMAC-SHA256 HttpOnly cookie；i18n：自建 en/zh/bm 词典。
- 核心文档：`project-charter.md`（项目章程）、
  `docs/superpowers/specs/`（规格）、`docs/superpowers/plans/`（计划）、
  `docs/cross-machine-sync.md`（跨机同步/路径约定）。

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm start        # 启动生产服务器
npm run lint     # ESLint
```

（Windows 上优先 `npm`；需要渲染 PDF 用 `src/lib/render-pdf.mjs`，
提取文本/坐标用 `src/lib/calibrate.mjs`。）

## 架构要点（改动前先读）

- **核心流程**：`src/app/page.js`（选择模板+上传）→ `src/app/api/store-pdf/route.js`
  （存 Blob + 返回签名位置）→ `src/app/sign/page.js`（签名）→
  `src/app/api/generate-pdf/route.js`（拉 PDF、叠加签名、发邮件）→
  `src/app/success/page.js`（下载）。
- **签名定位**：`src/lib/coordinates.js`（每个模板的字段/签名锚点 + 偏移）、
  `src/lib/pdf-search.js`（用 pdfjs-dist 在 PDF 内搜锚点文本）、
  `src/lib/pdf-generator.js`（`addSignaturesToPdf()` 叠加签名图片）。
- **模板**：`src/lib/templates.js`（表单定义：字段、页、签名数）；
  `public/forms/*.pdf`（空白模板，仅作 fallback）；`src/lib/i18n.js`（三语）。
- **认证**：`src/middleware.js` + `src/lib/auth.js`（HMAC cookie 守卫）；
  `src/app/api/auth/login|logout/route.js`。
- 建议用 UI/UX 技能 `$ui-ux-pro-max` 处理页面/组件/设计系统/字体配色/响应式。

## 文档位置

- 项目章程：`project-charter.md`
- 规格 / 计划：`docs/superpowers/specs/`、`docs/superpowers/plans/`
- 跨机同步：`docs/cross-machine-sync.md`

## 跨机与安全

- 多机并行时先 `git pull --rebase --autostash origin main`，禁止覆盖或 `--force`。
- push 被拒时先 fetch、对比远端，rebase 后再 push；认证失败或非 fast-forward
  时停下报告。
- 项目根 `AGENTS.md` 是权威手册；跨机记忆中心（供多机共享上下文）见
  `naiping87/dsh-worklog` 的 `AGENTS.md` / `CODEX_MEMORY.md`。
- 只用 `git add` 本次明确改动的文件；有实质进度再提交，并写明改动意义。

## 收尾检查

- 改动与用户请求逐行可追溯（Karpathy：每处改动都直接对应请求）。
- 未引入与请求无关的重构、删除或“改进”。
- 交付前验证（跑一次 dev/build 或针对改动做最小验证），并如实说明验证结果。
