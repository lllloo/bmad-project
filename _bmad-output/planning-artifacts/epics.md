---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
project_name: bmad-project
user_name: Jie
date: '2026-05-15'
---

# bmad-project - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-project, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication & Identity**

- FR1: Visitor 可使用 email 與密碼註冊新帳號
- FR2: System 在註冊成功時可發出單次使用、有期限的 email 驗證 token（MVP 階段寫入 log；TTL 與單次使用規則見 NFR11）
- FR3: 未驗證使用者可以使用有效 token 完成 email 驗證
- FR4: 已驗證使用者可使用 email 與密碼登入
- FR5: 已認證使用者可登出，撤銷當前 session 的 refresh token
- FR6: 使用者可請求密碼重設連結（MVP 階段寫入 log）
- FR7: 使用者可使用有效的單次重設 token 完成密碼重設
- FR8: 已認證使用者可變更自己的密碼（需以舊密碼確認）

**Session & Token Management**

- FR9: System 可發行短時效 access token，前端只能存於記憶體（不可持久化儲存）
- FR10: System 可發行 refresh token 並以 httpOnly cookie 遞送
- FR11: Client 可在 access token 過期時靜默 refresh 並重發原請求
- FR12: System 可在每次 refresh 時 rotation（核發新 jti 與新 token，舊 jti 立即撤銷）
- FR13: System 可維護 token 撤銷清單（jti blacklist），讓 refresh token 在自然過期前可被撤銷
- FR14: Client 可在 refresh 失敗時優雅降級（達重試門檻或連續失敗 3 次後強制登出並保留 return URL）

**User Profile**

- FR15: 已認證使用者可檢視自己的 profile
- FR16: 已認證使用者可更新自己 profile 中的可編輯欄位（如姓名）

**Member Administration**

- FR17: Admin 可列出會員，支援搜尋、分頁、排序
- FR18: Admin 可停權會員帳號（soft，可回復）
- FR19: Admin 可恢復先前被停權的會員
- FR20: Admin 可代會員重設密碼

**Role & Permission Management**

- FR21: System 支援三個預設角色：admin、editor、member
- FR22: Admin 可為會員指派一個或多個角色
- FR23: System 在每個受保護 API endpoint 與 UI 路由上強制角色 / 權限檢查
- FR24: System 在角色或權限變更後自動失效化權限快取（spatie cache reset）
- FR25: 已認證使用者只看得到自己角色允許的選單項目與頁面

**Audit Logging**

- FR26: System 對每筆會員停權 / 恢復、角色變更、admin 代改密碼操作寫入 audit log
- FR27: 每筆 audit 紀錄記載 actor、action、target、timestamp 與上下文 metadata
- FR28: Admin 可瀏覽 audit log，支援篩選與分頁

**Developer Experience (Fork & Onboarding)**

- FR29: Developer 可用單一 `docker compose up` 指令啟動 nginx、php-fpm、postgres、node 四個容器並接通網路
- FR30: System 在首次啟動時自動執行 seeders，產出三個預設角色與一個初始 admin 帳號
- FR31: Developer 可執行 `bin/new-project.sh` 將本 starter fork 為新專案，互動式重新命名 namespace、port、DB、git remote
- FR32: `bin/new-project.sh` 是冪等的（重複執行不會錯誤）
- FR33: Repository 包含 ≥ 5 篇 ADR 於 `docs/decisions/`，記錄核心技術選擇的脈絡
- FR34: Repository README 提供 30 秒 quickstart 與「踩坑」清單

**API Documentation**

- FR35: System 在執行 stack 內提供自動生成的 API 文件（路徑 `/api/docs`）
- FR36: API 文件支援以 JWT bearer 完成互動式 try-it-out
- FR37: System 可在 release 時匯出 OpenAPI JSON 至 `docs/api/openapi.json`

**Module Boundary Constraint**

- FR38: Codebase 將 auth 框架（`app/Domain/Auth/`、`src/features/auth/`）與範例業務（`app/Domain/Member/`、`src/features/members/`）分離至獨立 namespace；範例業務可被整段刪除而不破壞 auth 框架

### NonFunctional Requirements

**Performance**

- NFR1: 前端首次有意義繪製（FCP）≤ 1.5s（本機 docker，Chrome 最新版，M1 等級或同等硬體）
- NFR2: 前端初始 JS bundle（gzipped）≤ 250 KB
- NFR3: API 非 AI endpoints p95 回應時間 ≤ 300 ms（本機 docker）
- NFR4: TanStack Query 預設 `staleTime` ≥ 30s 以降低重複請求

**Security**

- NFR5: Access token TTL ≤ 15 分鐘
- NFR6: Refresh token TTL ≤ 7 天，每次使用必 rotation
- NFR7: 密碼使用 bcrypt hashing，cost ≥ 12
- NFR8: 所有 API 回應夾帶安全標頭：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`
- NFR9: Rate limits — 認證 endpoints 每 IP 每分鐘 10 次；一般受保護 endpoints 每使用者每分鐘 60 次
- NFR10: Audit log 記錄為 append-only；寫入後不可 UPDATE / DELETE
- NFR11: Email 驗證 token 與密碼重設 token 均為單次使用 + ≤ 24 小時過期

**Accessibility**

- NFR12: 所有會員與 admin 端頁面遵循 WCAG 2.1 Level AA
- NFR13: 所有互動元件支援完整鍵盤導航（Tab / Shift+Tab / Enter / Space / Esc）
- NFR14: 本文與背景對比度 ≥ 4.5:1（shadcn/ui + Radix 預設已符合，須驗證自訂主題不破壞）

**Testability**

- NFR15: Pest line coverage ≥ 60%，排除 `database/migrations`、`app/Console`、cached route 檔
- NFR16: Vitest line coverage ≥ 60%，排除生成的 route 檔
- NFR17: 關鍵路徑必測清單（`auth/register → verify → login`、`refresh rotation + blacklist`、`RBAC middleware + Policy`、`audit log` 寫入）每次測試執行必須 100% 通過

**Maintainability & Documentation**

- NFR18: Repository 包含至少 5 篇 ADR，涵蓋：JWT vs Sanctum、自寫 docker-compose vs Sail、PostgreSQL vs MySQL、RBAC 套件選擇（spatie/laravel-permission）、token 儲存策略
- NFR19: README 的 quickstart 段落字數 ≤ 200 字（不含 Docker pull 與 build 時間）

**Reusability**

- NFR20: 首次使用 `bin/new-project.sh` fork 起新專案，從 `git clone` 到「可寫第一行業務 controller」的 wall-clock 時間 ≤ 2 小時

### Additional Requirements

來自 architecture.md 的技術需求（影響 epic / story 拆解）：

- **AR1: Starter Strategy（雙軌起點）** — 後端「裸 Laravel 12」（`composer create-project laravel/laravel backend` + 移除 Sanctum + 加 jwt-auth/spatie/Scribe/Pest）+ 前端「裸 Vite + React 19 抄 `satnaing/shadcn-admin` layout」；**禁用** Laravel React Starter Kit (Inertia + Sanctum) 與 Breeze API；需在 Epic 1 Story 1 含完整 init 指令序列
- **AR2: Monorepo 結構** — `backend/` + `frontend/` + `docker/` + `bin/` + `docs/` + `_bmad-output/` 共存；`docker-compose.yml` 統一 dev/prod base + `docker-compose.override.yml.example` override 機制
- **AR3: Domain-first Backend 組織** — `app/Domain/Auth/` 與 `app/Domain/Member/` 嚴格分離；`DomainServiceProvider` 自動發現 sub-provider；FR38 結構性實作
- **AR4: ID 策略** — `users` 表用 ULID（26 字串 PK，`Str::ulid()`）；內部表（roles、permissions、token_blacklist、audit_logs、verification_tokens）用 auto-increment bigint
- **AR5: 核心 DB Schema** — `users`（含 `suspended_at` / `suspended_reason` soft 停權欄位、`email_verified_at`、bcrypt cost ≥ 12 password）、spatie tables（roles/permissions/model_has_roles/role_has_permissions）、`token_blacklist`（jti UNIQUE + expires_at + reason）、`audit_logs`（actor_id ULID/actor_role/action/target_type/id/metadata JSONB/ip_address/user_agent + 3 個 composite indexes）、`verification_tokens` + `password_reset_tokens`（hash 過 token + expires_at + used_at）
- **AR6: Token Rotation Atomicity** — refresh endpoint 必須以 `DB::transaction()` 包裹「核發新 token + 舊 jti 寫 blacklist」防 partial failure
- **AR7: Spatie Cache 與 JWT Stateless 對策** — access token 不 embed permissions（每次請求查 DB + spatie cache 加速）；access TTL ≤ 15 min 緩解 stale；role 變更 API 顯式呼叫 `permission:cache-reset`
- **AR8: Audit Log 強制機制** — sensitive operations 的 model 註冊 `AuditableObserver`；禁用 controller 內手動 `AuditLog::create()`；append-only 靠 Model::saving event 阻擋 update/delete（DB trigger 為第二階段選項）
- **AR9: 同網域反代設定** — nginx 在 dev/prod 一致到 8080；CSRF 在 `/api/*` 關閉（JWT bearer + httpOnly cookie + SameSite=Lax 已防 CSRF）；refresh cookie 設 `SameSite=Lax`、`Secure` (prod only)、`Path=/api/auth/refresh`；禁止 Vite dev server 直連
- **AR10: Frontend axios 401 並發處理** — 多 request 同時 401 時 queue 等同一次 refresh，避免 race；retry 上限 1 次；連續 3 次失敗強制登出（W0 spike 必驗）
- **AR11: 錯誤格式統一** — RFC 7807 Problem Details（`type/title/status/detail/instance/errors`）；在 `bootstrap/app.php` 註冊 ExceptionHandler 統一轉換；禁用自製 `{ error: "..." }` 格式
- **AR12: Security Headers 全域 middleware** — `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **AR13: Rate Limiting** — `AppServiceProvider` 設 `auth` (10/min by IP) 與 `api` (60/min by user) 兩個 RateLimiter；`/api/auth/*` 套 auth、其餘套 api
- **AR14: Windows Docker 兼容性** — named volumes（非 bind mount）+ `.gitattributes` 設 `eol=lf` + Major Risk #2 在 W0 spike 必驗；README「踩坑」段須記實
- **AR15: Docker entrypoint auto-seed** — `docker/php-fpm/docker-entrypoint.sh` 偵測首次啟動（migration table 是否存在），首次 migrate + seed；非首次跳過；產生 `RoleSeeder` + `AdminUserSeeder` + `DemoMembersSeeder`
- **AR16: OpenAPI Export Pipeline** — `bin/export-openapi.sh` 跑 Scribe 匯出到 `docs/api/openapi.json`；MVP 為手動執行，第二階段整合 CI
- **AR17: ADR 留檔（≥ 8 篇 vs NFR18 的 5 篇下限）** — `docs/decisions/` 撰寫：0001-record-architecture-decisions、0002-jwt-over-sanctum、0003-self-written-docker-compose-vs-sail、0004-postgresql-over-mysql、0005-spatie-permission-package、0006-token-storage-strategy、0007-domain-boundary-pattern、0008-rfc-7807-error-format
- **AR18: W0 Spike 必驗項目** — `bin/new-project.sh` 的 sed/regex 規則、frontend axios 401 並發處理、Windows Docker volume 行為、shadcn-admin layout 與 TanStack Router 整合、JWT 攔截器流暢度（架構文件列為 5 個 Important Gaps，需在 W0 spike 或 W1 開頭解決）
- **AR19: 套件版本鎖** — Laravel 12 + PHP 8.3+、PostgreSQL 17、`php-open-source-saver/jwt-auth` v2.8.2、`spatie/laravel-permission` v7.x、Scribe latest、Pest v3+、React 19、Vite 6/7、TanStack Router latest、shadcn/ui latest、Tailwind 4、React Testing Library v16、Node ≥ 20 LTS、Docker ≥ 24 + Compose v2
- **AR20: Enforcement Tooling** — Backend: `pint` + `larastan` lvl 5+；Frontend: `eslint` + `prettier` + `eslint-plugin-jsx-a11y` recommended；MVP 手動執行，pre-commit hook 與 CI blocking check 留第二階段

### UX Design Requirements

來自 ux-design-specification.md 的可執行 UX 工作項（每項皆需具備可測 acceptance criteria）：

**Design Token Work**

- **UX-DR1: Anthropic 色彩 token 系統** — cream `#faf9f5` / coral `#cc785c` / dark navy `#181715` / hairline `#e6dfd8` / muted `#6c6a64` / accent-teal `#5db8a6` / success `#5db872` / warning `#d4a017` / destructive `#c64545`；透過 shadcn CSS variable 機制（HSL 格式）注入；`tailwind.config.ts` 與 `src/styles/globals.css` 同步設定；含 `[data-mode="dark-surface"]` 區域性 dark variant（不做全站 dark mode toggle）
- **UX-DR2: Typography token 系統** — Cormorant Garamond 500 + Inter 400/500 + JetBrains Mono 400，自架 `@fontsource/*`（避免 CDN/GDPR）；定義 9 個字級 token：display-md 36px、display-sm 28px、title-md 18px、title-sm 16px、body-md 16px、body-sm 14px、caption 13px、caption-uppercase 12px (+1.5px tracking)、code 14px；含 system fallback chain 與 `font-display: swap`
- **UX-DR3: Spacing + Radius token 系統** — 4-base spacing scale（xxs 4 / xs 8 / sm 12 / md 16 / lg 24 / xl 32 / xxl 48 / section 96px）；rounded scale（md 8px / lg 12px / xl 16px / pill）；shadow 稀缺哲學（僅 Dropdown/Popover/Tooltip 用 shadcn 預設 `shadow-md`）

**Custom Components（8 個自製元件）**

- **UX-DR4: `RoleBadge`** — 3 variants × 2 sizes（admin coral / editor cream-strong / member muted；sm 用 sidebar 2×8px padding / md 用 audit log）；CVA-based variant；`role="status"` + `aria-label="當前角色: {role}"`；包在 shadcn `Badge`
- **UX-DR5: `PageHeading`** — display-md / display-sm / title-md 三層級；自動配對 `<h1>` / `<h2>` / `<h3>` semantic tag；含 description + actions（右側 button 群）slot；admin 內唯一使用 Cormorant serif 處
- **UX-DR6: `EmptyState`** — 4 variants 含對應 SVG line-art illustration（`members-empty` 書架 / 信箱、`audit-empty` 翻開的本子 / 鬧鐘、`search-no-results` 放大鏡 / 紙團、`error-404` 失蹤的書頁）；coral + navy stroke on cream；64–96px 高；inline import 自 `src/assets/empty-states/*.svg`；含 title (Cormorant display-sm) + description (Inter body-md muted) + CTA slot；illustration `aria-hidden="true"`
- **UX-DR7: `CodeWindow`** — dark navy + JetBrains Mono；3 variants（default 含 row number + top bar / compact 無 top bar / terminal 加 `$` prefix 給 README CLI 示範）；syntax highlight via `shiki` 或 `prism-react-renderer` 自訂 Anthropic palette；optional `fileName` + `copyable` button
- **UX-DR8: `AuditDetailSheet`** — shadcn `Sheet` 從右滑入（max-w-xl）；上半 Inter admin info（actor / action / target / timestamp / ip）；下半 dark navy `CodeWindow` 顯示 metadata JSON；props: `auditEntry: AuditLogEntry`
- **UX-DR9: `CommandPalette`** — shadcn `Command` + `Dialog` 組合；Cmd+K（macOS）/ Ctrl+K（Windows/Linux）開啟；4 sections 依角色動態顯示：Quick navigate / Recent actions (localStorage 暫存最近 5 個) / Quick search（即時搜會員 email/name）/ Quick actions（admin 才顯示）；↑↓ navigate、Enter 執行、Esc 關閉
- **UX-DR10: `ConfirmDestructive`** — shadcn `AlertDialog` wrapper；props: title / description / confirmLabel / confirmVariant `destructive` 或 `default` / onConfirm / onCancel / `requiresTypedConfirmation`（高風險時要求輸入確認字串）；destructive button 用 `--destructive` red、一般用 `--primary` coral
- **UX-DR11: `TokenStatusIndicator`（dev-only）** — 顯示 access TTL 倒數 + refresh 狀態 + jti 縮寫；`import.meta.env.DEV === true` 才 include（生產 build 不 ship）；fixed 右下角 dev panel；React Context 從 axios interceptor 取得 token state；polling 1s 更新

**Visual Standardization**

- **UX-DR12: 「敘事性 vs 工作性介面分離」規範** — 敘事頁面（Login / 404 / Empty / Onboarding / CLI 結束畫面）用 96px section padding + Cormorant hero + 6-6 split layout；工作頁面（admin list / form / table / audit）用 12–24px spacing + Inter UI + shadcn 預設密度；admin 內 Cormorant 僅用於 `PageHeading`
- **UX-DR13: Login 頁敘事性視覺** — cream canvas 整頁；左 6/12 form（Cormorant 36px「Welcome back」hero + Inter body sub-line + shadcn Form/Input + coral primary CTA + `Forgot? · Register` link）+ 右 6/12 dark navy illustration container（`rounded-xl` 16px + 內部 cream 子表面 + simple coral/navy line-art）；return URL micro-copy 顯示於 form 右上角「將返回：{return URL}」
- **UX-DR14: Admin Sidebar + Topbar 結構** — Sidebar `--card #efe9de` 背景 256px @ xl 展開 / 64px @ md icon-only / hamburger `Sheet` @ <md；頂端含 spike-mark `⊛` + project name + `RoleBadge`；中段 nav items（依角色動態顯示）；底部 avatar dropdown（profile / sign out）；active item 為 coral 3px left-border + bold text；Topbar 含 breadcrumb（自當前路由生成）+ search input + `Cmd+K` shortcut hint + avatar dropdown
- **UX-DR15: Admin DataTable 樣式 wrapper** — cell padding 12–16px、hairline border `--border`、row hover `--surface-soft #f5f0e8`、無 shadow；右側 `DropdownMenu` 三點按鈕為 row action 入口（停權 / 改密碼 / 指派角色）；底部 shadcn `Pagination` 置中 + 左側顯示「1–20 of N」字樣

**Interaction Patterns**

- **UX-DR16: Toast variant 系統** — 4 種（success green ✓ 3s / warning amber ! 5s / error red ✗ 7s + close button / info teal ℹ 4s）；cream bg + border-left；shadcn Sonner integration；`aria-live="polite"`；文案 reassuring tone 規範（禁用「ERROR / FAILED / INVALID」嚴厲詞，改用「Session 已過期」「無法儲存：網路連線異常，請重試」等）
- **UX-DR17: Loading state 系統** — 5 場景：initial page load 用 shadcn `Skeleton` 配對佈局結構（非 spinner）/ Form submit 用 button 內 spinner + label「Saving…」+ button disabled / Table data fetch 用 `Skeleton` rows / Async action 用 toast 配 spinner「處理中…」/ API timeout > 10s 顯示 inline alert「處理時間較長，請稍候」+ cancel button
- **UX-DR18: Form patterns 規範** — Label 在 input 上方（不用 placeholder 取代 label）/ Helper text 在 input 下方 `--muted-foreground` / Required indicator 為 label 後加 coral `*` / Validation 三時機（onChange password meter & 一致性 + onBlur email format & required + onSubmit server-side）/ 錯誤顯示為欄位下方紅 body-sm `FormMessage` + 欄位 border 變 `--destructive` / Submit 失敗禁清空使用者輸入；onBlur 已驗證的欄位 disabled submit button；最後一個 field 後留 24px 空白再放 button row
- **UX-DR19: Modal & Overlay 規範** — Dialog 中央 modal（編輯 form 用）/ AlertDialog（破壞性操作 confirm 用）/ Sheet 右滑入（Detail panel 與長 form 用）/ Popover（補充說明用）/ Tooltip（icon button 說明用）；同時最多開 1 個 overlay；Esc 永遠關閉；Click outside 關閉但 destructive confirm 例外；動畫 200ms ease-out 滑入；尊重 `prefers-reduced-motion: reduce`

**Responsive Design**

- **UX-DR20: Responsive breakpoint 策略** — admin (hamburger `Sheet` @ <md / icon-only sidebar @ md / 完整展開 256px @ xl)；member 端 (mobile-first single-column @ xs / max-w-md @ lg / max-w-2xl @ xl)；Table → Card list view @ < md（不滾動水平 table）；section padding 64px @ <md / 96px @ ≥xl；mobile-first CSS（base mobile，逐層加 breakpoint prefix override）；含 `xs:` (375px+) custom breakpoint

**Accessibility（含工具鏈）**

- **UX-DR21: WCAG 2.1 AA accessibility baseline** — `focus-visible:ring-2 ring-ring` 3px coral 15% alpha；skip-to-content link 於 admin layout 頁首；icon-only button 用 `<span class="sr-only">` 提供 label；toast 用 `aria-live="polite"`；reduced-motion 替代滑入動畫為 fade；touch target ≥ 44px on mobile / 40px on desktop；rem-based sizing 支援 200% zoom 不破版；color 之外有 icon 第二語意通道（success ✓ / warning ! / error ✗ / role badge 配文字標籤）；headings 階層連續 h1 → h2 → h3；Modal/Sheet 開啟時 focus trap（Radix 內建）關閉後 focus 還給觸發元素
- **UX-DR22: A11y 工具鏈與測試矩陣** — 自動: `axe-core` 整合進 Vitest test run / `eslint-plugin-jsx-a11y` recommended rules（強制 lint pass）；手動每 milestone 跑: keyboard-only navigation J1–J4 / macOS VoiceOver + NVDA / Chrome devtools color blindness 模擬 / iOS Safari + Android Chrome real device on member 端 / Chrome+Edge+Firefox+Safari 最新兩版；不適用: JAWS（付費）、User testing with disabled users（無 budget）

**User Journey UX Flow Detail**

- **UX-DR23: 4 條 User Journey 的 UX flow 細節** — **J1 Member 註冊到上手**：inline password 強度 meter（onChange）/ 友善 invalid token recovery 含「重新申請」一鍵動作；**J2 Token 過期與 Recovery**：401 silent refresh + retry queue（多並發 request queue 等同一次 refresh）/ amber warning toast「Session 已過期」/ return URL preservation 於 `/login?return=`+ 右上角 micro-copy「將返回：{URL}」/ 連續 3 次 refresh 失敗強制登出；**J3 Admin 操作**：`AlertDialog` 含明確標的（「確定要停權 user@x.com 嗎？」）/ spatie cache reset 背景自動 + toast 註記「對方下次登入後生效」/ Audit auto-write via Observer 無手動按鈕 / `Sheet` 從右滑入不切離列表
- **UX-DR24: `bin/new-project.sh` CLI UX** — ANSI 色碼（question prompt cyan / default value dim / success green / error red）；box drawing banner（`╭─╮ │ ╰─╯`）；width 適配 `$COLUMNS`（最少 60、最多 100）；6 個 interactive prompts `[N/6]` progress 標記 with smart defaults（namespace 從 project name 推導 / port 偵測 8080 衝突建議 8081 / DB 名同步）；衝突偵測即時反饋（port 已佔用 / namespace 已存在）；dry-run summary 對齊欄位排版（左 key、中 arrow、右 value）+ Files to be changed 列檔清單；每答案 echo 確認；spinner + ✓ marker per step；中斷可 Ctrl+C 安全退出未 apply 不改檔；apply 中斷可 resume via `.new-project-state`；final ASCII box banner with `Next:` 三條指令（`docker compose up` / open URL / login info）+ ADR pointer；exit code 0 on success；無 emoji（除 ✓ ✗ ASCII compatible）

### FR Coverage Map

| FR | Epic | 對映描述 |
|---|---|---|
| FR1 註冊 | Epic 1 | Member 註冊（J1 opening） |
| FR2 email 驗證 token 核發 | Epic 1 | 註冊成功 → 寫 log + verification_tokens 表 |
| FR3 完成 email 驗證 | Epic 1 | 驗證頁 + 單次使用規則 |
| FR4 登入 | Epic 1 | 登入頁 + access (in-memory) + refresh (httpOnly cookie) 核發 |
| FR5 登出 | Epic 1 | 撤銷當前 refresh jti |
| FR6 密碼重設請求 | Epic 2 | 寫 log 模式 password_reset_tokens |
| FR7 完成密碼重設 | Epic 2 | 單次使用 token + 設新密碼 |
| FR8 改密碼（需舊密碼） | Epic 2 | Profile 設定頁 |
| FR9 access token in-memory | Epic 1 | TokenIssuer + 前端 AuthContext 存 state |
| FR10 refresh token httpOnly cookie | Epic 1 | TokenIssuer set cookie |
| FR11 silent refresh on 401 | Epic 2 | axios interceptor + AuthContext refresh action |
| FR12 refresh rotation | Epic 2 | TokenRefresher 核發新 jti |
| FR13 jti blacklist | Epic 1 (schema 建立 + logout 撤銷) + Epic 2 (rotation 寫入) | token_blacklist 表 schema + JwtBlacklist service |
| FR14 refresh 失敗強制登出 + return URL | Epic 2 | 攔截器 retry queue + AuthContext forced logout |
| FR15 檢視 profile | Epic 1 | `/me` 路由與最簡 GET |
| FR16 更新 profile editable fields | Epic 2 | PATCH `/me` |
| FR17 會員列表 search/pagination/sort | Epic 3 | MemberController@index + shadcn DataTable |
| FR18 停權 | Epic 3 | MemberSuspender + AlertDialog confirm + 寫 audit |
| FR19 恢復停權 | Epic 3 | suspended_at = null + 寫 audit |
| FR20 admin 代改密碼 | Epic 3 | MemberPasswordResetter + 寫 audit |
| FR21 三角色 seeder | Epic 1 | RoleSeeder (admin/editor/member) |
| FR22 指派角色 | Epic 3 | RoleAssigner + 寫 audit |
| FR23 受保護 endpoint/UI route 守門 | Epic 1 (基礎) + Epic 3 (admin policies) | JwtAuthenticate middleware + Policy/Gate |
| FR24 spatie cache 自動失效 | Epic 3 | RoleAssigner.assign() 顯式呼叫 PermissionRegistrar.forgetCachedPermissions() |
| FR25 角色 differentiated 選單 | Epic 1 | Sidebar + RoleBadge + 動態 nav items |
| FR26 audit 寫入（停權/角色/代改密碼） | Epic 3 | AuditableObserver 強制機制 |
| FR27 audit 紀錄 actor/action/target/timestamp/metadata | Epic 3 | AuditLogger 服務 + audit_logs schema |
| FR28 audit 瀏覽 filter/pagination | Epic 3 | AuditLogController + table + AuditDetailSheet |
| FR29 docker compose 單指令啟動 | Epic 1 | docker-compose.yml + nginx + php-fpm + postgres + node |
| FR30 首次啟動自動 seed | Epic 1 | docker-entrypoint.sh + Role/AdminUser/DemoMembers seeder |
| FR31 bin/new-project.sh fork 腳本 | Epic 4 | 6 prompts + dry-run + apply |
| FR32 bin/new-project.sh 冪等 | Epic 4 | resume via `.new-project-state` + 重跑不爆炸 |
| FR33 ADR ≥ 5 篇 | Epic 4（收尾），Epic 1/2/3（隨需寫） | docs/decisions/0001–0008 |
| FR34 README quickstart + 踩坑清單 | Epic 4 | README.md 30 秒 quickstart ≤ 200 字 |
| FR35 Scribe API 文件 | Epic 4 | knuckleswtf/scribe + /api/docs |
| FR36 JWT bearer try-it-out | Epic 4 | scribe.php auth.in=bearer 設定 |
| FR37 OpenAPI export 至 docs/api/openapi.json | Epic 4 | bin/export-openapi.sh |
| FR38 Auth/Member Domain 邊界可整段刪 | Epic 1（結構建立），Epic 3（Member 完整實作驗證可刪） | app/Domain/Auth + Member + DomainServiceProvider 自動發現 |

**NFR 分布**（NFR 為跨 epic 持續約束，非單一 epic ownership）：

| NFR Range | 起點 | 收尾驗證 |
|---|---|---|
| NFR1–4 Performance（FCP/bundle/p95/staleTime） | Epic 1 起 baseline | Epic 4 量測達標 |
| NFR5–11 Security（TTL/bcrypt/headers/rate limit/append-only/token 單次） | Epic 1（headers/rate limit/bcrypt）→ Epic 2（TTL/rotation/token 單次）→ Epic 3（audit append-only） | Epic 4 安全清單復查 |
| NFR12–14 Accessibility（WCAG AA/keyboard/對比） | Epic 1 起 baseline（含 axe-core 整合 Vitest） | Epic 4 完整測試矩陣（VoiceOver/NVDA/colorblind/real device） |
| NFR15–17 Testability（Pest 60%/Vitest 60%/關鍵路徑必測） | Epic 1 起每 story 寫測試 | Epic 4 覆蓋率達標 + 關鍵路徑必測清單全綠 |
| NFR18 ADR ≥ 5 篇 | Epic 1 起隨決策寫（0001–0004） | Epic 4 收尾（0005–0008 + 補齊） |
| NFR19 README quickstart ≤ 200 字 | — | Epic 4 撰寫 |
| NFR20 fork ≤ 2h | — | Epic 4 半年後實際計時驗證 |

## Epic List

### Epic 1: Walking Skeleton — Foundation + Authenticated Shell

**Goal:** Developer 執行 `docker compose up` 後 60 秒內到達 cream + Cormorant Login 頁；可註冊（email 寫 log）→ 驗證 → 登入 → 看到角色 differentiated sidebar 的 admin shell；登出可運作。整個技術 stack（自寫 docker stack + 裸 Laravel + 裸 Vite + JWT + Domain 邊界）已在 W0 spike 驗過並可長期使用。

**Why this epic stands alone:** 結束時 starter kit 已是「可 demo 的 fork-able authenticated shell」。沒有 Epic 2 也能 register/login/logout（只是 token 過期後需手動 re-login）；沒有 Epic 3 也能展示 sidebar 角色差異化。

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR9, FR10, FR15, FR21, FR23（基礎守門）, FR25, FR29, FR30, FR38（結構建立）

**Cross-cutting NFR addressed:** NFR1–4（performance baseline）, NFR5（access TTL 15min）, NFR6（refresh TTL 7d）, NFR7（bcrypt 12）, NFR8（security headers）, NFR9（rate limit）, NFR11（verification token TTL/單次）, NFR12–14（a11y baseline 含 axe-core Vitest 整合）, NFR15–17（測試從第一個 story 起寫）

**Architecture covered:** AR1 starter strategy, AR2 monorepo, AR3 Domain-first, AR4 ID 策略, AR5 schema（users + spatie + verification_tokens + email log）, AR9 同網域反代, AR11 RFC 7807, AR12 security headers, AR13 rate limit, AR14 Windows Docker, AR15 entrypoint auto-seed, AR17 ADR 0001/0002/0003/0004, AR18 W0 spike（含 axios 401 並發策略決議延後 Epic 2 實作 + Windows Docker volume + shadcn-admin layout + TanStack Router）, AR19 版本鎖, AR20 enforcement tooling 基礎

**UX-DR covered:** UX-DR1 色彩 token, UX-DR2 typography token, UX-DR3 spacing/radius token, UX-DR4 RoleBadge, UX-DR5 PageHeading, UX-DR12 敘事/工作分離規範, UX-DR13 Login 頁, UX-DR14 Sidebar+Topbar, UX-DR16 Toast（基礎 4 variant）, UX-DR17 Loading state, UX-DR18 Form patterns, UX-DR19 Modal & Overlay（基礎）, UX-DR21 WCAG AA baseline, UX-DR23 J1 註冊到上手 flow

**Implementation Notes:**
- 起手 W0 spike：Windows Docker volume 行為驗、shadcn-admin layout + TanStack Router 整合驗、JWT 基本流程驗（complex 401 並發處理留 Epic 2）
- Domain 邊界（FR38）在 Epic 1 建結構（`app/Domain/Auth` + `Domain/Member` 空殼 + `DomainServiceProvider` 自動發現），Member 實際內容在 Epic 3 填
- ADR 0001–0004 在本 epic 內隨技術決定寫
- 不在本 epic：refresh rotation、blacklist 完整、401 interceptor、password reset、profile update（這些是 Epic 2 主軸）

---

### Epic 2: Resilient Session — Token Lifecycle + Profile/Password

**Goal:** Session 在 token 過期/撤銷/失敗時優雅 recover；access token 過期前端靜默 refresh + rotation（核發新 jti、舊 jti 立即 blacklist）；連續 3 次失敗強制登出 + return URL preservation；密碼變更/重設/Profile 編輯流暢，使用者完全感受不到 token 機制（J1 + J2 全套達成）。

**Why this epic stands alone:** Epic 2 結束時即達成 PRD 兩個 primary journey（J1 + J2）；Epic 3 的 admin 端能用既有 session 立即執行，無依賴 Epic 4。

**FRs covered:** FR6, FR7, FR8, FR11, FR12, FR13, FR14, FR16

**Cross-cutting NFR addressed:** NFR5（access TTL ≤ 15min 完整 enforce）, NFR6（refresh TTL ≤ 7d + 每次使用必 rotate）, NFR11（password reset token TTL/單次）, NFR15–17 測試（auth/refresh rotation 為關鍵路徑必測）

**Architecture covered:** AR5 token_blacklist 完整 schema + password_reset_tokens, AR6 rotation atomicity（DB transaction）, AR10 axios 401 並發 queue（W0 spike 已決議 mutex/promise pool 模式，本 epic 實作）, AR17 ADR 0006 token-storage-strategy

**UX-DR covered:** UX-DR11 TokenStatusIndicator（dev tool）, UX-DR23 J2 token recovery flow（含 amber warning toast、return URL micro-copy、forced logout 文案）

**Implementation Notes:**
- 動 Epic 1 的 `AuthController`、`AuthContext`、`api.ts`（擴充 401 interceptor）—— 屬有意 ordered append，非 file churn
- ADR 0006 token-storage-strategy 在本 epic 寫

---

### Epic 3: Admin Operations — Member Management + RBAC + Audit Trail

**Goal:** Admin 可完成會員列表（search/pagination/sort）/ 停權 / 恢復 / 代改密碼 / 指派角色全套作業；所有敏感操作自動經 Observer 寫入可查詢 audit log（含 metadata JSON 詳情）；spatie cache 在角色變更時自動失效化；J3 全套達成；Cmd+K 命令選盤、敘事性 empty state 與 dark navy code-window 等視覺亮點到位。

**Why this epic stands alone:** Epic 3 結束時 admin 業務閉環完整可用；FR38 邊界「Member domain 可整段刪」獲得真實驗證（因為已存在大量 Member-domain code 可一次刪）。

**FRs covered:** FR17, FR18, FR19, FR20, FR22, FR23（admin Policy 完整守門）, FR24, FR26, FR27, FR28

**Cross-cutting NFR addressed:** NFR10（audit append-only via Model::saving event）, NFR15–17 測試（RBAC middleware + Policy / audit log 寫入為關鍵路徑必測）

**Architecture covered:** AR5 audit_logs schema 完整, AR7 spatie cache vs JWT stateless 對策, AR8 AuditableObserver 強制機制, AR17 ADR 0005 spatie-permission / 0007 domain-boundary / 0008 RFC 7807

**UX-DR covered:** UX-DR6 EmptyState（4 SVG line-art variants）, UX-DR7 CodeWindow, UX-DR8 AuditDetailSheet, UX-DR9 CommandPalette, UX-DR10 ConfirmDestructive, UX-DR15 DataTable wrapper, UX-DR19 Modal & Overlay 全套（Sheet/Dialog/AlertDialog/Popover）, UX-DR23 J3 admin 操作 flow

**Implementation Notes:**
- 本 epic 90% 動 `app/Domain/Member/` 與 `frontend/src/features/members/`，與 Auth domain 重疊極少
- ADR 0005、0007、0008 在本 epic 內寫
- Empty state SVG illustration 自繪或委外手繪（4 個 variant），需在 Story 內排時間

---

### Epic 4: Fork-Ready — Docs, Tests, Coverage + bin/new-project.sh

**Goal:** Starter kit 真正成為「能 fork 起新專案的可重用骨架」：Scribe API 文件 + JWT bearer try-it-out + OpenAPI JSON export；Pest/Vitest 覆蓋率達 60% + 4 條關鍵路徑必測清單全綠；ADR ≥ 5（本案實際 8 篇）+ README 30 秒 quickstart ≤ 200 字 + 「踩坑」清單；`bin/new-project.sh` 6 prompts 互動式 + dry-run preview + 冪等可 resume + box drawing 結束畫面 + ASCII art + 「Next:」三條指令。J4「fork → 業務開發 ≤ 2 小時」達成驗證。

**Why this epic stands alone:** Epic 4 是 starter kit 「fork ROI」的最終 enabler。沒有 Epic 4，Epic 1–3 已是「可運作的 admin 應用」但**還不是 starter kit**；Epic 4 把骨架轉化為可被半年後的我複用的資產。

**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37

**Cross-cutting NFR addressed（本 epic 主場）:** NFR1–4 performance 達標量測, NFR15 Pest ≥ 60%, NFR16 Vitest ≥ 60%, NFR17 關鍵路徑必測 4/4, NFR18 ADR ≥ 5, NFR19 README quickstart ≤ 200 字, NFR20 fork ≤ 2h

**Architecture covered:** AR16 OpenAPI Export Pipeline, AR17 ADR 收尾（0001–0008 全部完成）, AR20 enforcement tooling 收尾（pint + larastan + eslint + prettier + jsx-a11y 全部 wired）

**UX-DR covered:** UX-DR20 responsive 收尾驗證（含 xs/md/xl 三斷點驗）, UX-DR22 a11y 工具鏈與測試矩陣全套（axe-core / jsx-a11y / Lighthouse manual / VoiceOver+NVDA / Color blind / Chrome+Edge+Firefox+Safari × 最新兩版 / iOS Safari + Android Chrome real device）, UX-DR24 `bin/new-project.sh` CLI UX

**Implementation Notes:**
- bin/new-project.sh 的 sed/regex 規則需在本 epic 確定（W0 spike 已驗概念）
- README「踩坑」清單包含 Windows Docker volume / line ending / file watcher 等 Major Risk #2 實作記錄
- W3 末 Stop-loss（5/7 場景未達時砍 Scribe + Audit log）在本 epic 開始前自檢

---

## Epic 1: Walking Skeleton — Foundation + Authenticated Shell

**Epic Goal:** Developer 執行 `docker compose up` 後 60 秒內到達 cream + Cormorant Login 頁；可註冊（email 寫 log）→ 驗證 → 登入 → 看到角色 differentiated sidebar 的 admin shell；登出可運作。整個技術 stack（自寫 docker stack + 裸 Laravel + 裸 Vite + JWT + Domain 邊界）已在 W0 spike 驗過。

### Story 1.1: W0 Spike — Verify Tech Stack Risk Items + ADR Foundation

As a **developer (Jie)**,
I want **在投入正式 build 前用一週 spike 驗證最高風險的技術組合（Windows Docker volume、shadcn-admin + TanStack Router、JWT 基本流程、axios 401 概念驗證）**,
So that **W1 開始正式 build 時不會撞牆，且核心決策已有 ADR 留檔**.

**Acceptance Criteria:**

**Given** 一個全新乾淨的 Windows 11 開發環境（含 Docker Desktop ≥ 24、Node ≥ 20 LTS、PHP 8.3+、Git）
**When** 我建立最小可運作的 docker-compose（nginx + php-fpm + postgres + node 四 service）
**Then** 容器全部成功啟動且 `http://localhost:8080` 可回應
**And** named volumes（非 bind mount）在 Windows 環境下 file watcher 與啟動速度可接受（< 30s cold start）
**And** `.gitattributes` 設 `eol=lf` 避免 CRLF 自動轉換問題

**Given** spike 用 `composer create-project laravel/laravel` + `pnpm create vite --template react-ts`
**When** 我手動抄 `satnaing/shadcn-admin` 的 layout component（Sidebar / Topbar / AppShell）到 Vite 專案
**And** 加入 TanStack Router file-based routing 含 `__root.tsx` 與 `_authenticated.tsx`
**Then** layout 渲染正常且路由守門可運作（未登入 redirect `/login`）

**Given** spike 用 `php-open-source-saver/jwt-auth` v2.8.2 設好基本 guard
**When** 我寫一個最簡 `POST /api/auth/login` 回傳 access token
**And** frontend 用 axios 帶 `Authorization: Bearer <token>` 呼叫受保護 endpoint
**Then** 認證成功路徑可運作
**And** access TTL 設 15 分鐘可生效

**Given** spike 寫一個概念版 axios 401 interceptor（不含 retry queue，留 Epic 2 完整實作）
**When** access token 過期後再請求一個受保護 endpoint
**Then** interceptor 偵測到 401 並呼叫 refresh endpoint
**And** 確認單一 request 的概念可運作（多並發 queue 留 Epic 2 AR10）

**Given** spike 完成
**When** 我撰寫 ADR
**Then** `docs/decisions/0001-record-architecture-decisions.md`（記錄 ADR 方法本身）與 `0002-jwt-over-sanctum.md`（記錄選 JWT 不選 Sanctum 的脈絡）已寫入並 commit

**Given** spike 期間遇到的踩坑
**When** 我整理結論
**Then** Windows Docker volume / line ending / file watcher 相關發現寫入 `docs/spike-notes-w0.md`（為 Epic 4 README 「踩坑」清單做素材）
**And** 任何發現的 blocker 已記錄並決定處理方式（continue / pivot / defer）

---

### Story 1.2: Backend Scaffold — Bare Laravel 12 + JWT/Spatie/Scribe + Domain Boundary

As a **developer (Jie)**,
I want **裸 Laravel 12 專案 + 必要套件（JWT、Spatie、Scribe、Pest）+ Domain 邊界目錄結構（Auth / Member）+ DomainServiceProvider 自動發現機制**,
So that **後續 auth/member story 都有明確 namespace 與 module 邊界可用，且 fork 時可整段刪 Member（FR38 結構性實作）**.

**Acceptance Criteria:**

**Given** `backend/` 目錄不存在
**When** 我跑 `composer create-project laravel/laravel backend` + `composer remove laravel/sanctum`（明確拒絕 Sanctum）
**And** `composer require php-open-source-saver/jwt-auth spatie/laravel-permission knuckleswtf/scribe`
**And** `composer require --dev pestphp/pest pestphp/pest-plugin-laravel`（並 `composer remove phpunit/phpunit`）
**Then** `composer.json` 含上述套件且版本符合 AR19 lock（jwt-auth v2.8.2、spatie/laravel-permission v7.x、Pest v3+）
**And** `php artisan jwt:secret` 已執行且 `.env` 含 `JWT_SECRET`

**Given** Laravel 12 預設目錄結構
**When** 我建立 Domain 邊界
**Then** `app/Domain/Auth/{Controllers,Services,Models,Policies,Observers,Middleware,Requests,Resources,Events,AuthServiceProvider.php}` 目錄存在
**And** `app/Domain/Member/{Controllers,Services,Models,Policies,Observers,Requests,Resources,MemberServiceProvider.php}` 目錄存在
**And** `app/Providers/DomainServiceProvider.php` 自動發現並註冊 `Domain/*/...ServiceProvider`

**Given** Member domain 是範例業務（FR38）
**When** 我嘗試刪除整個 `app/Domain/Member/` 目錄
**Then** `php artisan route:list` 仍可運作（不含 Member 路由），且 `composer dump-autoload` 無 PSR-4 錯誤
**And** Auth domain 內 controller 不依賴 Member domain（PHPStan / Larastan 可驗）

**Given** Laravel 12 用 `bootstrap/app.php` 取代 Kernel.php
**When** 我設定 middleware alias
**Then** `role`、`permission`、`role_or_permission`（spatie 三 alias）於 `bootstrap/app.php` 註冊
**And** `bcrypt` cost 設為 12（NFR7，於 `config/hashing.php`）

**Given** 後端 stack 完整
**When** 我跑 `vendor/bin/pest`
**Then** 預設 Laravel test（ExampleTest）通過
**And** `vendor/bin/pint` 與 `vendor/bin/phpstan analyse` 無錯誤（larastan lvl 5+）

**Given** PostgreSQL 17 driver
**When** 我設 `.env` `DB_CONNECTION=pgsql` 連到 docker postgres container
**Then** `php artisan migrate` 可建立預設 Laravel migration 表
**And** 用 `string()` + check constraint 取代 `enum()`（PG 行為與 MySQL 不同）

---

### Story 1.3: Frontend Scaffold — Vite + React 19 + TanStack + shadcn + Anthropic Tokens

As a **developer (Jie)**,
I want **裸 Vite + React 19 SPA + TanStack Router/Query + shadcn/ui + Anthropic 色彩/typography/spacing token + 抄 satnaing/shadcn-admin layout**,
So that **後續所有前端 story 都有設計系統 baseline 與 layout shell 可用**.

**Acceptance Criteria:**

**Given** `frontend/` 目錄不存在
**When** 我跑 `pnpm create vite frontend --template react-ts` + `pnpm dlx shadcn@latest init`
**And** `pnpm add @tanstack/react-router @tanstack/react-query react-hook-form @hookform/resolvers zod axios`
**And** `pnpm add @fontsource/cormorant-garamond @fontsource/inter @fontsource/jetbrains-mono`
**Then** `package.json` 含上述套件且符合 AR19 版本鎖（React 19、Vite 6/7、TanStack Router latest）
**And** `tsconfig.json` 啟用 strict mode

**Given** Anthropic 色彩 token（UX-DR1）
**When** 我設定 `src/styles/globals.css` 的 CSS variable
**Then** `--background` cream（HSL 48 33% 97%）、`--primary` coral（17 51% 58%）、`--foreground` ink、`--border` hairline、`--destructive` red 等 9 個 token 已定義
**And** `[data-mode="dark-surface"]` 區域性 dark variant 已定義（不做全站 dark mode toggle）
**And** `tailwind.config.ts` 的 `theme.extend.colors` 對接 CSS variable

**Given** Typography token（UX-DR2）
**When** 我設定 `tailwind.config.ts` 與引入字體
**Then** `fontFamily: { display: ['"Cormorant Garamond"', ...], sans: ['Inter', ...], mono: ['"JetBrains Mono"', ...] }` 已設
**And** `src/main.tsx` 已 import `@fontsource/cormorant-garamond/500.css` + Inter 400/500 + JetBrains Mono 400
**And** 9 個字級 token（display-md/sm、title-md/sm、body-md/sm、caption、caption-uppercase、code）對應的 Tailwind class 可用

**Given** Spacing + Radius token（UX-DR3）
**When** 我設定 `tailwind.config.ts`
**Then** 4-base spacing（4/8/12/16/24/32/48/96px）映射為 Tailwind 標準 scale
**And** `rounded-md` 8px、`rounded-lg` 12px、`rounded-xl` 16px 已對齊

**Given** shadcn-admin layout（UX-DR14 結構）
**When** 我手動從 `satnaing/shadcn-admin` 抄 `src/components/layout/{AppShell,Sidebar,Topbar,Breadcrumb}.tsx`
**And** 新增 `src/components/custom/RoleBadge.tsx`（UX-DR4 placeholder，先放最簡 admin/editor/member 三 variant）
**Then** `pnpm dev` 啟動可看到 Sidebar + Topbar 結構
**And** layout 不依賴 `features/`（boundary 隔離）

**Given** TanStack Router file-based routing
**When** 我建立 `src/routes/{__root.tsx, index.tsx, login.tsx, _authenticated.tsx, _authenticated/me/index.tsx, _authenticated/admin/index.tsx}`
**Then** `routeTree.gen.ts` 由 router plugin 自動生成
**And** `_authenticated` 路由用 `beforeLoad` 守門：未登入 redirect `/login?return=<current>`（先 stub return URL，邏輯在 Epic 2 完整實作）

**Given** Vitest + RTL
**When** 我設 `vitest.config.ts` 與 `tests/setup.ts`
**Then** `pnpm test` 可跑且 RoleBadge 至少 1 個 story（render with role=admin → coral pill 可見）

**Given** ESLint + a11y
**When** 我設 `.eslintrc.cjs`
**Then** `eslint-plugin-jsx-a11y` recommended rules 已啟用
**And** `pnpm lint` 無 violation

---

### Story 1.4: Docker Compose Stack — nginx Reverse Proxy + 4 Containers + Auto-Seed Entrypoint

As a **developer (Jie)**,
I want **單一 `docker compose up` 啟動 nginx + php-fpm + postgres + node 四個容器，nginx 反代 `/api/*` → php-fpm 與 `/*` → vite，並在首次啟動自動 migrate + seed（建三角色與 admin）**,
So that **fork 起新專案的開發者 60 秒內可到達可用狀態（FR29 + FR30 + AR9 + AR15）**.

**Acceptance Criteria:**

**Given** `docker/` 目錄與 `docker-compose.yml` 不存在
**When** 我建立 `docker/{nginx,php-fpm,postgres,node}/Dockerfile` 與 config
**And** 撰寫 `docker-compose.yml` 含四個 service（nginx 對外 8080、php-fpm 內部 9000、postgres 17、node 用於 Vite dev）
**Then** `docker compose up` 全部成功啟動且 health check 通過

**Given** nginx 反代設定（AR9 同網域反代）
**When** 我設 `docker/nginx/default.conf`
**Then** `location /api/` proxy 到 `php-fpm:9000` 並帶正確 proxy headers
**And** `location /ws` proxy 到 `node:5173`（Vite HMR WebSocket）
**And** `location /` proxy 到 `node:5173`（SPA fallback）
**And** 從 `http://localhost:8080` 可同時取到前後端，無 CORS 問題

**Given** 首次啟動自動 seed（AR15）
**When** php-fpm 容器啟動且 `docker/php-fpm/docker-entrypoint.sh` 偵測 `migrations` 表不存在
**Then** entrypoint 自動跑 `php artisan migrate --force`
**And** 自動跑 `php artisan db:seed`（RoleSeeder 建 admin/editor/member 三角色 + AdminUserSeeder 建 `admin@example.com` / `password`）
**And** 非首次啟動（`migrations` 表已存在）跳過 seed

**Given** `.env.example` 與 `.gitattributes`
**When** 我撰寫範例設定
**Then** `.env.example` 含所有環境變數（DB / JWT / APP_URL 等），fork 時複製即可
**And** `.gitattributes` 設 `* text=auto eol=lf`（防 Windows CRLF）
**And** `docker-compose.override.yml.example` 提供本機 override 範例

**Given** Windows Docker 兼容性（AR14）
**When** 我設定 volumes
**Then** `pg_data` 為 named volume；`backend/` 與 `frontend/` 為 bind mount 但已測 file watcher 在 Windows 可運作
**And** named volume 使用優先於 bind mount 處（W0 spike 結論落地）

**Given** Spatie permission seeder（FR21）
**When** RoleSeeder 跑完
**Then** DB 含 admin / editor / member 三角色
**And** `AdminUserSeeder` 建出的 user 已 assignRole('admin')

**Given** entrypoint 結束
**When** 我打開 `http://localhost:8080`
**Then** 可看到 React SPA 渲染（即使尚未有 Login UI 也至少看到 Vite 預設或自訂 placeholder）
**And** `http://localhost:8080/api/health`（health endpoint）回 200 JSON

---

### Story 1.5: User Registration with Email Verification Log

As a **visitor**,
I want **以 email + 密碼註冊新帳號，並可用 docker logs 撈到的驗證連結完成 email 驗證**,
So that **我能驗證 email 為真實可達，並進入「已驗證」狀態以登入（FR1 + FR2 + FR3 + NFR11）**.

**Acceptance Criteria:**

**Given** `users` 表與 `verification_tokens` 表的 migration 尚未存在
**When** 我建立 migration
**Then** `users` 表含 ULID PK（26 字串）、email UNIQUE NOT NULL、password VARCHAR(255)、name VARCHAR(255)、email_verified_at NULL、suspended_at NULL、created_at/updated_at（AR4 + AR5）
**And** `verification_tokens` 表含 id BIGINT PK、user_id ULID FK、token VARCHAR(64) UNIQUE（hash 過）、expires_at、used_at NULL、created_at
**And** migration 跑通且可 rollback

**Given** 訪客在 `/register` 頁面
**When** 我填寫 valid email + password（≥ 8 字元）+ confirm password 並 submit
**And** 前端表單已用 zod schema 驗證（onBlur email format、onChange password 強度 meter、onChange 一致性）
**Then** `POST /api/auth/register` 接受該 payload 並回 201
**And** `users` 表新增一筆 record，`email_verified_at` 為 NULL
**And** `verification_tokens` 表新增一筆 record，`expires_at` ≤ 24 小時、`used_at` 為 NULL（NFR11）
**And** 驗證 URL（`http://localhost:8080/verify/<token>`）寫入 Laravel log（`storage/logs/laravel.log` 或 stdout）

**Given** 訪客送出 invalid payload（如 email 已存在 / 密碼長度不足）
**When** API 收到
**Then** 回應為 RFC 7807 Problem Details（AR11）格式 422，含 `errors: { email: [...], password: [...] }`
**And** 前端 `FormMessage` 顯示具體錯誤於對應欄位下方

**Given** 訪客打開 docker logs 撈到 `/verify/<token>` URL 並點擊
**When** `POST /api/auth/verify/{token}` 被觸發
**And** token 在 `verification_tokens` 表且 `used_at IS NULL` 且 `expires_at > now()`
**Then** 對應 user 的 `email_verified_at` 設為 now()
**And** `verification_tokens.used_at` 設為 now()（單次使用 NFR11）
**And** 回應 200 + 前端顯示「✓ Email 已確認，請登入」（UX-DR16 success toast 3s）

**Given** token 已被使用過 / 已過期 / 不存在
**When** 訪客點擊
**Then** 回應 422 + 前端顯示友善錯誤頁「連結已失效，請重新申請」+ 提供「重新申請」一鍵動作（UX-DR23 J1）
**And** 不洩漏 token 為「過期」還是「不存在」的差異（安全）

**Given** Rate limit（NFR9）
**When** 同一 IP 在一分鐘內呼叫 `/api/auth/register` 超過 10 次
**Then** 第 11 次起回應 429 + `Retry-After` header

**Given** 註冊頁面（敘事性視覺 UX-DR12）
**When** 訪客打開 `/register`
**Then** cream canvas + Cormorant `display-md`「Create your account」hero
**And** Form 使用 shadcn `Form` + `Input` + coral primary `Sign up` button
**And** UX-DR18 form pattern 全套：label 上方、helper 下方、required `*` coral、validation 三時機

**Given** 寫測試（NFR15 + NFR17 關鍵路徑）
**When** 我跑 `pest tests/Feature/Auth/RegistrationTest.php`
**Then** 至少含：happy path 註冊 → 驗證 → user 表狀態正確 / invalid email format / duplicate email / weak password / expired token / used token，全綠

---

### Story 1.6: Login + Logout with JWT Access (In-Memory) + Refresh (httpOnly Cookie)

As a **已驗證的 user**,
I want **以 email + 密碼登入並收到 short-lived access token（前端記憶體）+ refresh token（httpOnly cookie）；可登出撤銷當前 session**,
So that **我能進入受保護頁面且 token 機制符合 PRD 安全約束（FR4 + FR5 + FR9 + FR10 + NFR5 + NFR6）**.

**Acceptance Criteria:**

**Given** 已驗證 user（`email_verified_at IS NOT NULL`）
**When** 我於 `/login` 送出正確的 email + 密碼
**Then** `POST /api/auth/login` 回 200 含 `{ access_token, expires_in, user: {...} }` JSON
**And** access token TTL = 15 分鐘（NFR5），HS256 algorithm，claims 含 `sub` (ULID), `iat`, `exp`, `jti`, `role`, `iss`
**And** response 設 `Set-Cookie: refresh_token=...; HttpOnly; SameSite=Lax; Path=/api/auth/refresh; Max-Age=604800`（NFR6 7d、prod 才加 `Secure`）

**Given** 前端收到 login response
**When** AuthContext.dispatch(LOGIN) 被呼叫
**Then** access token 存於 React Context state（**非** localStorage / sessionStorage，NFR5 in-memory only）
**And** user 物件存於 Context 供 sidebar / topbar 用
**And** 自動 redirect 到 return URL（若有）或預設 `/admin`（admin role）/ `/me`（其他 role）

**Given** 我送出錯誤的 email / 密碼
**When** API 驗證失敗
**Then** 回應 RFC 7807 401 + `title: "Invalid credentials"`
**And** 不洩漏「email 不存在」與「密碼錯誤」的差異
**And** 前端用 `--destructive` toast 顯示「Email 或密碼錯誤」（UX-DR16 friendly tone，禁用「FAILED」「ERROR」嚴厲詞）

**Given** 未驗證 email 的 user 嘗試登入
**When** API 收到
**Then** 回應 403 + `title: "Email not verified"` + 提供「重新寄驗證信」CTA（前端顯示）

**Given** `token_blacklist` 表的 migration 尚未存在
**When** 我建立 migration
**Then** 表含 id BIGINT PK、jti VARCHAR(64) UNIQUE NOT NULL、user_id ULID FK、expires_at TIMESTAMP NOT NULL、reason VARCHAR(50)（enum 涵蓋 Epic 1-3 所有撤銷情境：`logout` / `rotation` / `admin_revoke` / `password_change` / `password_reset` / `admin_suspend` / `admin_password_reset` / `token_chain_failed`）、created_at
**And** 含 `INDEX (jti)` 與 `INDEX (expires_at)`（後者為過期清理用）
**And** migration 跑通且可 rollback

**Given** 已登入 user 觸發登出
**When** 前端送 `POST /api/auth/logout` 含當前 access token + refresh cookie
**Then** 後端從 refresh token decode 出 jti 並寫入 `token_blacklist` 表，reason='logout'（FR13 在此 epic 建立完整 schema 並完成 logout 撤銷路徑；Epic 2 Story 2.1 將擴展同一 schema 用於 rotation 寫入）
**And** 回應 204 + 清除 refresh cookie（`Set-Cookie: refresh_token=; Max-Age=0`）
**And** 前端 AuthContext.dispatch(LOGOUT) 清空 state + redirect `/login`

**Given** Login 頁敘事性視覺（UX-DR13）
**When** 我打開 `/login`
**Then** cream canvas + 左 6/12 form（Cormorant display-md「Welcome back」hero + Inter sub-line「Sign in to manage your starter kit.」+ shadcn Form + coral primary `Sign in` button + `Forgot? · Register` link）
**And** 右 6/12 dark navy illustration container（`rounded-xl` 16px + 內部 cream 子表面 + simple coral/navy line-art SVG placeholder）
**And** 若 URL 含 `?return=<path>`，form 右上角顯示「將返回：{path}」micro-copy

**Given** Rate limit（NFR9）
**When** 同一 IP 在一分鐘內 `/api/auth/login` 超過 10 次
**Then** 429 + `Retry-After`

**Given** Security headers（NFR8 + AR12）
**When** 任何 `/api/*` 回應
**Then** 含 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Given** 寫測試
**When** 我跑 `pest tests/Feature/Auth/LoginTest.php`
**Then** 含：happy path login → cookie 設定 / access token 結構 / wrong password / unverified email / logout 撤銷 jti / rate limit 觸發，全綠

---

### Story 1.7: Authenticated Shell with Role-Differentiated Sidebar + Minimal Profile

As a **已認證 user (admin/editor/member)**,
I want **登入後看到角色 differentiated sidebar（不同 nav items + role badge）+ topbar + breadcrumb + 自己的 Profile 最簡檢視頁**,
So that **我隨時知道自己以什麼身分操作、能導航到允許的頁面（FR15 + FR23 基礎 + FR25 + UX-DR14）**.

**Acceptance Criteria:**

**Given** user 已登入且 access token 在 Context state
**When** 我訪問任何 `/_authenticated/*` 路由
**Then** TanStack Router 的 `_authenticated.tsx` 的 `beforeLoad` 驗證 token 存在
**And** 未驗證或 token 缺失 → redirect `/login?return=<current path>`

**Given** admin 角色 user
**When** 我看到 sidebar
**Then** 頂端 spike-mark `⊛` + project name 「bmad-project」+ `RoleBadge` coral pill「Admin」（UX-DR4）
**And** nav items 含：Profile / Members / Roles / Audit / Sign out（Members/Roles/Audit 為 admin only placeholder，Epic 3 填內容）
**And** active item 為 coral 3px left-border + bold（UX-DR14）

**Given** editor 角色 user
**When** 我看到 sidebar
**Then** RoleBadge cream-strong 「Editor」
**And** nav items 不含 Members / Roles / Audit（只看到允許項目，FR25）

**Given** member 角色 user
**When** 我看到 sidebar
**Then** RoleBadge muted「Member」
**And** nav items 只含 Profile / Sign out

**Given** topbar（UX-DR14）
**When** 我看 admin shell
**Then** topbar 左側 breadcrumb（自當前路由生成，最後一項不可點）
**And** 中央 search input + `Cmd+K` shortcut hint（hint 視覺化，實際 palette 在 Epic 3 實作）
**And** 右側 avatar dropdown（含 profile / sign out）

**Given** 我訪問 `/me`（Profile 最簡 GET）
**When** 我已登入
**Then** `GET /api/me` 回 200 + 自己的 user object（id ULID、email、name、email_verified_at、roles、suspended_at）
**And** 前端 Profile 頁顯示 user info（Inter body-md，只讀；編輯功能留 Epic 2 FR16）

**Given** UX-DR21 a11y baseline
**When** 我用鍵盤 Tab 過 sidebar
**Then** 每個 nav item 有 visible focus ring（3px coral 15% alpha）
**And** sidebar 開頭含 skip-to-content link `<a href="#main">Skip to content</a>`
**And** axe-core 整合 Vitest test 對 shell 渲染無 a11y violation

**Given** Responsive（UX-DR20）
**When** 我縮窗到 < 768px
**Then** sidebar 收為 hamburger sheet 從左滑入
**And** 縮到 768–1279px sidebar 為 icon-only 64px
**And** ≥ 1280px 完整展開 256px

**Given** UX-DR16 toast + UX-DR17 loading
**When** API call 進行中
**Then** Page-level fetch 顯示 shadcn `Skeleton` 配對佈局
**And** API 失敗顯示 friendly toast（如「無法載入 profile，請稍候重試」）

**Given** ADR 0003/0004 撰寫
**When** Story 1.4/1.7 完成
**Then** `docs/decisions/0003-self-written-docker-compose-vs-sail.md` 與 `0004-postgresql-over-mysql.md` 已寫入並 commit

**Given** 寫測試
**When** 我跑 frontend Vitest
**Then** Sidebar component 對 3 個角色 render 結果 snapshot 不同（nav items 數量、badge variant）
**And** `_authenticated` 路由守門測試（未登入 → redirect）通過

---

## Epic 2: Resilient Session — Token Lifecycle + Profile/Password

**Epic Goal:** Session 在 token 過期/撤銷/失敗時優雅 recover；access token 過期前端靜默 refresh + rotation（核發新 jti、舊 jti 立即 blacklist）；連續 3 次失敗強制登出 + return URL preservation；密碼變更/重設/Profile 編輯流暢，使用者完全感受不到 token 機制（J1 + J2 全套達成）。

### Story 2.1: Refresh Token Rotation with Atomic Blacklist

As a **已登入 user**,
I want **access token 過期時可用 refresh token 取得新 access + 新 refresh（rotation）；舊 jti 在同一 transaction 內被列入 blacklist**,
So that **token 在自然過期前可被撤銷，且 partial failure 不會造成 token 被撤銷卻無新 token 的窗口（FR12 + FR13 + AR6）**.

**Acceptance Criteria:**

**Given** `token_blacklist` 表已在 Story 1.6 建立（schema 含所有 reason enum 值）
**When** 我擴展 rotation 寫入路徑
**Then** rotation 時舊 jti 寫入 token_blacklist，reason='rotation'
**And** 不需新增 migration（schema 已就位，本 story 為 reason='rotation' 的 usage 擴展而非 schema 變更）

**Given** 已登入 user 持有 valid refresh token（在 httpOnly cookie）
**When** 前端 `POST /api/auth/refresh` 被觸發（access token 已過期或即將過期）
**Then** 後端用 `DB::transaction()` 包裹（AR6 atomicity）：
  - 從 refresh cookie decode 出 jti
  - 驗證 jti 不在 token_blacklist 表
  - 驗證 refresh token 未過期
  - 核發新 access token（jti_new_access）與新 refresh token（jti_new_refresh）
  - 舊 refresh jti 寫入 token_blacklist，reason = 'rotation'
**And** 整個 transaction 為 atomic：任一步失敗則回滾，user 仍持有原 refresh 可重試
**And** 回應 200 + `{ access_token, expires_in }` + 新 refresh cookie

**Given** refresh token 已 expire / 已 blacklist
**When** 前端送 refresh 請求
**Then** 後端回 401 + RFC 7807 `title: "Refresh token invalid"`
**And** 不洩漏「過期」「黑名單」差異

**Given** Rate limit（NFR9）
**When** 同 IP /api/auth/refresh 一分鐘超過 10 次
**Then** 429

**Given** 安全
**When** refresh 成功
**Then** 新 refresh cookie 屬性與 login 時一致（HttpOnly / SameSite=Lax / Path=/api/auth/refresh / 7d Max-Age）

**Given** 寫測試（NFR17 關鍵路徑必測）
**When** 我跑 `pest tests/Feature/Auth/TokenRefreshTest.php` 與 `tests/Unit/Domain/Auth/JwtBlacklistTest.php`
**Then** 含：happy path rotation + blacklist 寫入 / 用過期 refresh / 用 blacklist 中的 refresh / DB transaction 中段失敗應全 rollback（模擬 blacklist insert 失敗時舊 jti 不應被「先撤銷」） / 並發 refresh 用同一 refresh token 應只有一次成功（另一次 race 應失敗），全綠

---

### Story 2.2: Frontend Silent Refresh with 401 Concurrency Queue

As a **編輯中的 user**,
I want **access token 過期後再發 API 請求時，前端 axios 攔截器自動 refresh + 重發原請求，且多個並發 401 共用同一次 refresh（避免 race）**,
So that **我完全感受不到 token 機制，UX 永遠不中斷（FR11 + AR10）**.

**Acceptance Criteria:**

**Given** `src/lib/api.ts` 的 axios instance 已建立（Epic 1 Story 1.3 已預留）
**When** 我新增 response interceptor 處理 401
**Then** interceptor 偵測到 401 且 `error.config._retry !== true` 時：
  - 標記 `_retry = true`
  - 觸發單一 refresh promise（promise pool / mutex 模式 AR10）
  - 等 refresh 完成後重發原 request
  - 重發成功則回正常 response

**Given** 多個並發 request（如同時打 3 個受保護 endpoint）同時收到 401
**When** 攔截器啟動
**Then** 3 個 request 共用同一個 refresh promise（不重複觸發 3 次 refresh）
**And** refresh 完成後 3 個 request 全部用新 access token 重發
**And** 3 個 request 最終全部成功

**Given** Retry 上限 1 次（PRD Domain Risk Mitigations）
**When** 重發後仍收到 401
**Then** 不再 retry，throw 原 error 給呼叫方

**Given** refresh 本身失敗（refresh token 也死了）
**When** interceptor 收到 refresh endpoint 的非 200 response
**Then** AuthContext.dispatch(LOGOUT, { reason: 'token_chain_failed' })
**And** 留待 Story 2.3 處理強制登出 + return URL UX

**Given** TokenStatusIndicator dev tool（UX-DR11）
**When** `import.meta.env.DEV === true`
**Then** 右下角 fixed panel 顯示 access TTL 倒數 + refresh 狀態 + jti 縮寫
**And** polling 1s 更新
**And** production build (`pnpm build`) 不 include 此元件

**Given** 寫測試（NFR17 關鍵路徑）
**When** 我跑 Vitest + MSW（mock service worker）
**Then** 含：單一 401 → refresh → retry 成功 / 多並發 401 共用 refresh / refresh 失敗 → dispatch LOGOUT / retry 上限 1 次後 throw，全綠

---

### Story 2.3: Forced Logout with Return URL Preservation + Friendly Recovery UX

As a **正在編輯中的 user，其 refresh chain 失敗（refresh token 過期或連續失敗 3 次）**,
I want **被強制登出並跳轉到 `/login?return=<原頁面>`，登入後自動回到原來操作位置，過程有 reassuring 而非 alarming 的訊息**,
So that **session 失效不像懲罰而像 recovery，我能無痛接續操作（FR14 + UX-DR23 J2 + emotional principle）**.

**Acceptance Criteria:**

**Given** Refresh 連續失敗計數
**When** axios interceptor 偵測 refresh endpoint 連續 3 次非 200 response（PRD Domain Risk）
**Then** AuthContext.dispatch(FORCED_LOGOUT, { reason: 'token_chain_failed' })

**Given** AuthContext FORCED_LOGOUT action
**When** dispatch 完成
**Then** 清空 access token + user state
**And** 不呼叫 `/api/auth/logout`（因 refresh 已死，logout 也會失敗；後端 token 自然過期）
**And** 觸發 `router.navigate('/login?return=<currentPath>')`

**Given** UX-DR16 toast tone 與 UX-DR23 文案
**When** forced logout 觸發
**Then** 顯示 `--warning` amber toast「Session 已過期，請重新登入」（**不**用「ERROR」「FAILED」嚴厲詞）
**And** toast 持續 5s auto-dismiss + 含 close button

**Given** Login 頁收到 `?return=<path>`
**When** 渲染
**Then** form 右上角顯示 `--muted-foreground` micro-copy「將返回：{decodedPath}」（UX-DR13）
**And** return URL 經過 sanitize（禁外部 URL；只接受 same-origin path）

**Given** 重新登入成功
**When** AuthContext.dispatch(LOGIN) 完成
**Then** `router.navigate(returnUrl)` 自動跳回原頁面
**And** 若無 return URL 則跳預設（admin → `/admin`、其他 → `/me`）

**Given** Reduced motion
**When** `prefers-reduced-motion: reduce`
**Then** toast 滑入改 fade，duration 仍同（UX-DR21）

**Given** 寫測試
**When** 我跑 Vitest
**Then** 含：3 次 refresh fail → FORCED_LOGOUT dispatch / return URL 帶到 login / 重新登入後跳回 / external URL 不接受（sanitize），全綠

---

### Story 2.4: Profile Update + Password Change

As a **已認證 user**,
I want **更新自己的 profile 可編輯欄位（如姓名）且能變更密碼（需以舊密碼確認）**,
So that **我能自主管理身分與密碼安全（FR8 + FR16）**.

**Acceptance Criteria:**

**Given** 已登入 user 訪問 `/me`
**When** 我看到 Profile 編輯頁
**Then** 顯示 email（唯讀）、name（可編輯）、roles（唯讀 badge list）、suspended_at（若有，唯讀 warning alert）
**And** name field 使用 shadcn `Form` + `Input` + zod schema 驗證（非空、長度 1-255）
**And** `PATCH /api/me` 接受 `{ name }` payload 並回 200 + 更新後 user resource

**Given** UX-DR23 J2 optimistic UI（profile 改名為低風險操作）
**When** 我送出新 name
**Then** TanStack Query mutation 使用 `onMutate` 樂觀更新 UI（sidebar avatar dropdown 與 topbar 顯示立即更新）
**And** API 成功時 `invalidateQueries(['me'])` 觸發 refetch 對齊
**And** API 失敗時 rollback 並 `--destructive` toast「無法儲存：<reason>，請重試」

**Given** Password change `/me/password`
**When** 我送 `POST /api/me/password` 含 `{ current_password, new_password, new_password_confirmation }`
**Then** 後端用 `Hash::check($current, $user->password)` 驗證舊密碼
**And** 舊密碼錯 → 422 + RFC 7807 `errors: { current_password: ['密碼錯誤'] }`
**And** 新密碼 ≥ 8 字元 + 不可與舊密碼相同 + 與 confirmation 一致
**And** 通過驗證 → `bcrypt(12)` hash 新密碼存入 users 表 + 撤銷所有此 user 的 refresh token（寫 blacklist，reason='password_change'）+ 回 204

**Given** 密碼變更成功
**When** 前端收到 204
**Then** 強制 logout + 跳 `/login?return=/me`（PRD emotional principle「trust feature」force re-login）
**And** Login 頁 success toast「密碼已更新，請重新登入」

**Given** UX-DR18 form pattern
**When** 我填密碼變更
**Then** password meter（onChange）即時顯示強度
**And** confirmation 一致性檢查（onChange）
**And** 任一欄位未通過 → submit button disabled

**Given** Rate limit（NFR9 一般 api）
**When** 一分鐘超過 60 次
**Then** 429

**Given** 寫測試
**When** 我跑 Pest + Vitest
**Then** 含：name update happy path / name 空白 422 / password change happy path → 舊 refresh 全 blacklist / wrong current_password / new_password 與 confirmation 不一致 / new = old 不允許 / 密碼變更後強制 re-login，全綠

---

### Story 2.5: Password Reset Request + Execution（Single-Use Token, 24h Expiry）

As a **忘記密碼的 user**,
I want **請求密碼重設連結（寫入 log，MVP 階段）並用單次使用 token 完成重設**,
So that **無 SMTP 也能在 MVP 階段達成密碼重設能力（FR6 + FR7 + NFR11）**.

**Acceptance Criteria:**

**Given** `password_reset_tokens` 表的 migration 尚未存在
**When** 我建立 migration（與 verification_tokens 同結構，AR5）
**Then** 表含 id、user_id ULID FK、token VARCHAR(64) UNIQUE（hash 過）、expires_at、used_at NULL、created_at

**Given** 訪客在 `/password-reset` 頁送 email
**When** `POST /api/auth/password/reset-request` 收到
**Then** 若 email 存在 user，產生新 reset token（hash 後存表，expires_at ≤ 24h）
**And** 重設 URL 寫入 Laravel log（同 verification token 模式）
**And** 不論 email 是否存在，回應一律 202 「若 email 註冊過，重設連結已送出」（防 enumeration）

**Given** user 撈到 log 的重設 URL `/password-reset?token=<raw>`
**When** 訪客打開該頁
**Then** 顯示新密碼 + confirmation 表單（不顯示 email、token 隱藏在 form）
**And** 前端 zod schema 驗證 + password meter

**Given** 訪客送 `POST /api/auth/password/reset` 含 `{ token, new_password, new_password_confirmation }`
**When** 後端驗證
**Then** 在 `DB::transaction()` 內：
  - 驗證 token 存在且 `used_at IS NULL` 且 `expires_at > now()`
  - bcrypt(12) hash 新密碼存入對應 user
  - `password_reset_tokens.used_at = now()`（單次使用）
  - 撤銷所有此 user 的 refresh token（blacklist reason='password_reset'）
**And** 回 204 + 前端跳 `/login` + success toast「密碼已重設，請以新密碼登入」

**Given** token 已用 / 過期 / 不存在
**When** 訪客送 reset
**Then** 422 + RFC 7807「連結已失效，請重新申請」
**And** 不洩漏「過期」「用過」差異

**Given** Rate limit（NFR9 auth）
**When** 同 IP 一分鐘 reset-request 超過 10 次
**Then** 429

**Given** Forgot password 入口（UX-DR13 Login 頁）
**When** 我在 Login 頁
**Then** form 下方含 `Forgot? · Register` link，「Forgot?」跳 `/password-reset` 頁

**Given** ADR 0006 撰寫
**When** Epic 2 接近完成
**Then** `docs/decisions/0006-token-storage-strategy.md` 已寫入，記錄 access in-memory + refresh httpOnly cookie + rotation + blacklist 的脈絡

**Given** 寫測試
**When** 我跑 Pest
**Then** 含：reset-request happy path / unknown email 也回 202 / reset 用 valid token 成功 → 舊 refresh 全 blacklist / token 過期 / token 已使用 / token 不存在，全綠

---

## Epic 3: Admin Operations — Member Management + RBAC + Audit Trail

**Epic Goal:** Admin 可完成會員列表（search/pagination/sort）/ 停權 / 恢復 / 代改密碼 / 指派角色全套作業；所有敏感操作自動經 Observer 寫入可查詢 audit log（含 metadata JSON 詳情）；spatie cache 在角色變更時自動失效化；J3 全套達成；Cmd+K 命令選盤、敘事性 empty state 與 dark navy code-window 等視覺亮點到位。

### Story 3.1: Member List with Search / Pagination / Sort + DataTable Wrapper + Empty State

As an **admin**,
I want **`/admin/members` 頁面以高密度 DataTable 顯示會員列表，支援關鍵字搜尋（email / name）、分頁、排序，無會員時顯示 line-art empty state**,
So that **我能高效找到並管理目標會員（FR17 + UX-DR15 + UX-DR6 members-empty）**.

**Acceptance Criteria:**

**Given** admin 已登入並訪問 `/admin/members`
**When** TanStack Router 守門通過 + Policy（`MemberPolicy::viewAny`）驗證 admin role
**Then** 渲染 `PageHeading display-md`「Members」+ description「Manage users, suspensions, and role assignments」（UX-DR5）

**Given** `GET /api/admin/members?search=foo&page=1&per_page=20&sort=created_at&direction=desc` 被觸發
**When** 後端 `MemberController@index` 處理
**Then** 套用 search（LIKE email + name）、pagination（per_page 預設 20、max 100）、sort（白名單欄位 created_at / email / name）
**And** 回應為列表 envelope：`{ data: [...member resources], meta: { total, page, per_page, last_page } }`（AR11）
**And** 非 admin user 訪問此 endpoint → 403 + RFC 7807

**Given** UX-DR15 DataTable wrapper
**When** 列表渲染
**Then** cell padding 12-16px、hairline border、row hover `--surface-soft #f5f0e8`、無 shadow
**And** column 含 email / name / roles（badge list）/ status（active 綠 dot / suspended amber dot，UX-DR21 色彩+icon 雙通道）/ created_at
**And** 右側 `DropdownMenu` 三點按鈕為 row action（Suspend / Resume / Reset password / Assign roles，依當前狀態 enable/disable）
**And** 底部 shadcn `Pagination` 置中 + 左側「1–20 of N」字樣

**Given** 搜尋框（topbar 或頁內）
**When** 我輸入關鍵字
**Then** debounce 300ms 後觸發 query
**And** 清除 button `X` 顯示於 input 右側 when value present
**And** `Cmd+/` 聚焦 search input（Linear 模式）

**Given** 列表為空（無會員或搜尋無結果）
**When** API 回 `{ data: [], meta: { total: 0 } }`
**Then** 顯示 `EmptyState` component 之 `members-empty` variant（UX-DR6）：placeholder illustration（lucide icon 或 inline SVG stub 暫充）+ Cormorant display-sm「No members yet」+ Inter body-md「Invite your first member to see them here.」+ coral CTA「Invite member」（MVP 該 CTA 可為 placeholder 或 disabled 提示）
**And** placeholder illustration 將由 Story 3.7 swap 為最終 line-art SVG（書架 / 信箱）；若搜尋無結果使用同 EmptyState 變體，由 Story 3.7 引入 `search-no-results.svg` 替換或新增 variant 區分

**Given** Initial load loading state（UX-DR17）
**When** Query 進行中
**Then** Table 顯示 `Skeleton` rows（20 rows）配對佈局結構

**Given** UX-DR20 responsive
**When** 我縮到 < 768px
**Then** Table 改為 Card list view（不滾動水平 table）：每筆 member 一張 card 顯示 avatar/email/status/role badges + 點 card 展開行動 sheet

**Given** 寫測試
**When** 我跑 Pest + Vitest
**Then** Pest 含：admin 可拿列表 / non-admin 403 / search filter / pagination / sort 白名單之外的欄位 422 / per_page 上限；Vitest 含 DataTable render + EmptyState 渲染，全綠

---

### Story 3.2: Member Suspend / Resume with ConfirmDestructive + Auto-Write Audit (Observer)

As an **admin**,
I want **能停權某會員（soft，可回復）並恢復停權，操作前有 ConfirmDestructive 對話框，所有操作自動寫入 audit log（無需手動點按鈕）**,
So that **敏感操作有 confirm 防誤觸，且 audit 透明可追蹤（FR18 + FR19 + FR23 + FR26 + FR27 + UX-DR10 + AR8）**.

**Acceptance Criteria:**

**Given** `audit_logs` 表的 migration 尚未存在
**When** 我建立 migration（AR5）
**Then** 表含 id、actor_id ULID NULL（系統操作為 NULL）、actor_role VARCHAR(20)、action VARCHAR(50)（`member.suspend` / `member.resume` 等）、target_type VARCHAR(50)、target_id VARCHAR(26)、metadata JSONB NULL、ip_address INET NULL、user_agent VARCHAR(500) NULL、created_at NOT NULL
**And** 含三個 composite indexes：`(actor_id, created_at)` / `(target_type, target_id, created_at)` / `(action, created_at)`
**And** 無 updated_at 欄位（append-only NFR10）

**Given** `AuditableObserver` 與 `AuditLogger` service（AR8 強制機制）
**When** 我實作 `app/Domain/Member/Observers/AuditableObserver.php`
**Then** Observer 在 `User` model 的 `updated` 事件偵測 `suspended_at` 是否有 dirty change
**And** 若有，呼叫 `AuditLogger::log(action, target, metadata, currentAuthUser)` 寫入 audit_logs
**And** `bootstrap/app.php` 或 `MemberServiceProvider` 註冊 `User::observe(AuditableObserver::class)`

**Given** Audit append-only 強制（NFR10）
**When** 任何 code 嘗試 `AuditLog::find($id)->update([...])` 或 `->delete()`
**Then** Model 的 `saving` event 阻擋（throw `LogicException`）
**And** Pest test 驗證該 enforcement

**Given** admin 在會員列表點某 row 三點 → 「Suspend」
**When** UI 觸發 `ConfirmDestructive`（UX-DR10）
**Then** AlertDialog 標題「確定要停權 user@example.com 嗎？」
**And** description 明確標的 +「user@example.com 將無法登入直到恢復」
**And** confirm button 為 `--destructive` red「Suspend」
**And** Esc 與 click outside 都不關閉（destructive 例外，UX-DR19）

**Given** Confirm 點下
**When** `PATCH /api/admin/members/{id}` 含 `{ status: 'suspended', reason?: string }` 送出
**Then** Policy（`MemberPolicy::suspend`）驗證 admin role + 不能停權自己
**And** `MemberSuspender::suspend($member, $reason)` 設 `suspended_at = now()` + `suspended_reason = $reason`
**And** Observer 自動寫 audit_logs（action='member.suspend'、actor_id=當前 admin、target_type='user' target_id=被停權 user ULID、metadata={ reason, suspended_at_iso }、ip + user_agent）
**And** 撤銷該 user 所有 refresh token（blacklist reason='admin_suspend'）強制現有 session 失效
**And** 回 200 + 更新後 UserResource

**Given** Frontend 收到 200
**When** TanStack Query mutation `onSuccess`
**Then** `invalidateQueries(['members'])` 觸發列表 refetch
**And** UX-DR16 success toast「✓ 已停權 user@example.com」3s

**Given** 恢復停權（FR19）
**When** admin 對 suspended user 點「Resume」（同 ConfirmDestructive 但 confirm button 為 `--primary` coral）
**Then** `PATCH /api/admin/members/{id}` 含 `{ status: 'active' }`
**And** `suspended_at = null` + `suspended_reason = null`
**And** Observer 寫 audit action='member.resume'
**And** 回 200 + toast「✓ 已恢復 user@example.com」

**Given** Edge cases
**When**
  - admin 嘗試停權自己 → 422 + RFC 7807「不能停權自己」
  - 對已停權 user 再停權 → 409 conflict
  - 對 active user 嘗試 resume → 409 conflict

**Given** 寫測試（NFR17 關鍵路徑 `audit log` 寫入）
**When** 我跑 Pest
**Then** 含：suspend happy path + audit 寫入 + refresh blacklist / resume + audit / 停權自己 422 / 重複停權 409 / 嘗試 update audit log 應失敗 / 嘗試 delete audit log 應失敗，全綠

---

### Story 3.3: Admin Password Reset for Member (with Audit)

As an **admin**,
I want **能代某會員重設密碼（用於使用者忘記且無法自己 reset 的場景），新密碼立即生效且舊 session 失效**,
So that **admin 能緊急介入而不影響審計（FR20 + FR23 + FR26）**.

**Acceptance Criteria:**

**Given** admin 在會員列表點某 row 三點 → 「Reset password」
**When** UI 開啟 shadcn `Dialog`（非 destructive 故用一般 Dialog）
**Then** Dialog 含新密碼 + confirmation 兩 input
**And** UX-DR18 password meter onChange + 一致性檢查 + submit button 在無效時 disabled

**Given** admin 送 `POST /api/admin/members/{id}/password` 含 `{ new_password, new_password_confirmation }`
**When** 後端處理
**Then** Policy（`MemberPolicy::resetPassword`）驗證 admin role + 不能對自己用此 endpoint（自己用 `/me/password`）
**And** `MemberPasswordResetter::reset($member, $newPassword)` 在 `DB::transaction()` 內：
  - bcrypt(12) hash 存入 user
  - 撤銷該 user 所有 refresh token（blacklist reason='admin_password_reset'）
**And** Observer 寫 audit action='member.password_reset'、actor_id=admin、target=被改 user、metadata 不含明文密碼（僅記事件發生）
**And** 回 204

**Given** Frontend 收到 204
**When** Dialog close
**Then** `--success` toast「✓ 已重設 user@example.com 的密碼」+ 提示「對方現有 session 已強制失效」

**Given** Edge cases
**When**
  - admin 對自己 → 422「請用個人 Profile 頁變更自己的密碼」
  - new_password 不符 zod schema → 422 RFC 7807

**Given** 寫測試
**When** 我跑 Pest
**Then** 含：admin reset happy path + audit + blacklist / non-admin 403 / 對自己 422 / 密碼太短 422 / metadata 不含明文密碼（驗 audit row payload）

---

### Story 3.4: Role Assignment with Spatie Cache Reset + Audit + JWT Stateless 對策

As an **admin**,
I want **能為某會員指派一個或多個角色（admin/editor/member），spatie permission cache 自動失效化以避免 stale 權限**,
So that **角色變更即時生效（在 access token TTL ≤ 15min 內），且符合 JWT 無狀態的特殊性（FR22 + FR24 + AR7 + UX-DR9 預留入口）**.

**Acceptance Criteria:**

**Given** Story 1.2 已安裝 `spatie/laravel-permission`
**When** Story 1.4 已 seed admin/editor/member 三角色
**Then** `permission_tables` migration 已 publish 並執行

**Given** admin 在會員列表點某 row 三點 → 「Assign roles」
**When** UI 開啟 shadcn `Sheet` 從右滑入（UX-DR19）
**Then** Sheet 含多選 checkbox list of 三角色（current roles 預勾選）
**And** 顯示 helper text「對方下次登入後生效，或等當前 access token（≤ 15 分鐘）過期」

**Given** admin 送 `POST /api/admin/members/{id}/roles` 含 `{ roles: ['admin', 'editor'] }`
**When** 後端處理
**Then** Policy（`MemberPolicy::assignRoles`）驗證 admin role + 不能對自己 + 至少留一個 admin 在系統（防鎖住自己）
**And** `RoleAssigner::assign($member, $roles)` 在 `DB::transaction()` 內：
  - `$member->syncRoles($roles)`（spatie API）
  - 顯式呼叫 `app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions()`（FR24 + AR7）
**And** Observer 寫 audit action='member.role_change'、metadata={ before: [...prev_roles], after: [...new_roles] }
**And** 回 200 + 更新後 UserResource 含新 roles

**Given** AR7 JWT Stateless 對策
**When** 對象 user 持有未過期 access token
**Then** access token 本身**不** embed permissions（每次請求查 DB + cache 加速）
**And** 改角色後對方的下一次請求即時拿到新權限（cache 已 reset）
**And** 文件中 access TTL ≤ 15min 為「容忍窗口」上限（NFR5）

**Given** 邊界：嘗試指派不存在的角色
**When** payload 含 'superadmin'
**Then** 422 + RFC 7807

**Given** 邊界：移除唯一 admin
**When** 系統中只剩此一個 admin user，admin 嘗試把自己降為 member
**Then** 422「至少需保留一個 admin 帳號」

**Given** Frontend toast（UX-DR23 J3）
**When** 成功
**Then** `--success` toast「✓ 角色已更新（對方下次登入後生效）」5s

**Given** ADR 0005 撰寫
**When** Story 3.4 完成
**Then** `docs/decisions/0005-spatie-permission-package.md` 已寫入

**Given** 寫測試（NFR17 關鍵路徑 RBAC middleware + Policy）
**When** 我跑 Pest
**Then** 含：role assign happy path + cache reset 被呼叫 + audit before/after metadata / non-admin 403 / 對自己降權鎖系統 422 / 不存在的角色 422 / Policy 守門對所有 admin endpoint，全綠

---

### Story 3.5: Audit Log Browser with Filter / Pagination + AuditDetailSheet (Dark Navy Code-Window)

As an **admin**,
I want **`/admin/audit` 頁面瀏覽所有 audit 紀錄（含 actor / action / target / timestamp），可依 actor / action / 時間範圍篩選，點 row 滑入 detail sheet 看完整 metadata JSON**,
So that **能完整追蹤系統敏感操作（FR28 + UX-DR7 + UX-DR8 + UX-DR15 + NFR10）**.

**Acceptance Criteria:**

**Given** admin 訪問 `/admin/audit`
**When** Policy 通過
**Then** PageHeading「Audit log」+ description「Track all sensitive operations across the system」

**Given** `GET /api/admin/audit-logs?actor_id=&action=&date_from=&date_to=&page=1&per_page=20` 被觸發
**When** 後端 `AuditLogController@index` 處理
**Then** 套用 filter（actor_id ULID、action enum、date_from/to ISO 8601）+ pagination + sort（預設 created_at desc）
**And** 回應為列表 envelope（同 3.1）

**Given** UX-DR15 DataTable
**When** 列表渲染
**Then** column 含 timestamp（ISO 8601 + tooltip 顯示本地時間）/ actor (email + RoleBadge size=md) / action (badge variant 依類別 colored) / target / IP
**And** row click 觸發 AuditDetailSheet（UX-DR8）

**Given** AuditDetailSheet（UX-DR8）
**When** row click 觸發
**Then** shadcn `Sheet` 從右滑入 max-w-xl
**And** 上半部 Inter body 顯示 actor / action / target / timestamp / IP / User-Agent
**And** 下半部 `CodeWindow`（UX-DR7）dark navy + JetBrains Mono 顯示 metadata JSON
**And** Sheet Esc 與 click outside 關閉（非 destructive）

**Given** CodeWindow（UX-DR7）
**When** 渲染 audit metadata
**Then** dark navy `--surface-dark #181715` 背景 + JetBrains Mono code
**And** 預設 variant 含 row number + top bar
**And** syntax highlight 用 shiki 或 prism-react-renderer，Anthropic palette
**And** 含 `Copy` button 將 JSON 複製到剪貼簿

**Given** Empty state
**When** filter 後無結果
**Then** `EmptyState` `audit-empty` variant 含 placeholder illustration（lucide icon 或 inline SVG stub）+ 「No audit entries match your filters」
**And** placeholder illustration 將由 Story 3.7 swap 為最終 line-art SVG（翻開的本子 / 鬧鐘）

**Given** UX-DR23 J3 + Audit log 自動寫入
**When** admin 操作完任意 action（如停權某 user）
**Then** 切到 audit 分頁可立即看到該筆 audit（無需手動 refresh，TanStack Query invalidate）

**Given** NFR10 append-only enforcement
**When** UI 渲染 audit log
**Then** 完全無 edit / delete row action（UI 層也禁止）
**And** Story 3.2 已驗 DB/Model 層 enforcement

**Given** 寫測試
**When** 我跑 Pest + Vitest
**Then** 含：admin 拿 audit list / non-admin 403 / filter by actor / filter by action / date range / Vitest 渲染 AuditDetailSheet + CodeWindow snapshot / Copy button 觸發 clipboard，全綠

---

### Story 3.6: Cmd+K Command Palette for Quick Navigate / Search / Actions

As an **admin or editor**,
I want **按 `Cmd+K`（macOS）或 `Ctrl+K`（Windows/Linux）開啟 command palette，快速導航、搜會員、執行高頻動作**,
So that **頻繁操作不需要每次點 sidebar 與下拉選單（UX-DR9 + ADR 0007/0008）**.

**Acceptance Criteria:**

**Given** `CommandPalette` component（UX-DR9）
**When** 我實作
**Then** 包 shadcn `Command` + `Dialog` 組合
**And** 全域 keyboard listener 監聽 Cmd+K / Ctrl+K → 開啟
**And** Esc 關閉 / ↑↓ navigate / Enter 執行

**Given** Palette 開啟
**When** 渲染（依當前 user role 動態 sections）
**Then** Section「Quick navigate」: Profile / Members（admin only）/ Roles（admin only）/ Audit（admin only）/ Sign out
**And** Section「Recent actions」: 最近 5 個操作（從 localStorage 暫存）
**And** Section「Quick search」: 輸入時即時搜會員 email / name（debounce 300ms，admin only）
**And** Section「Quick actions」（admin only）: 「停權某會員」「指派角色」「查 audit by actor」等高頻入口

**Given** 我輸入「ada」
**When** debounce 300ms
**Then** Quick search section 顯示符合的會員 email / name + RoleBadge
**And** 選一個 Enter → 跳該會員 detail page（或選清單再選動作）

**Given** Section visibility 依角色
**When** member role user 開 palette
**Then** 只看到 Quick navigate（Profile / Sign out）+ Recent
**And** Quick search / Quick actions 不渲染

**Given** Topbar Cmd+K hint（Epic 1 Story 1.7 已預留）
**When** palette 元件已就位
**Then** 點 hint 觸發開啟相同 palette

**Given** ADR 0007 / 0008 撰寫
**When** Epic 3 接近完成
**Then** `docs/decisions/0007-domain-boundary-pattern.md`（記錄 Domain/Auth vs Member 分離 + DomainServiceProvider 自動發現脈絡）已寫入
**And** `docs/decisions/0008-rfc-7807-error-format.md`（記錄 RFC 7807 vs 自製 envelope 取捨）已寫入

**Given** a11y（UX-DR21）
**When** palette 開啟
**Then** focus 自動進到 search input
**And** focus trap 在 palette 內
**And** 關閉後 focus 還給觸發元素

**Given** 寫測試
**When** 我跑 Vitest + RTL
**Then** 含：Cmd+K 開啟 / Esc 關閉 / 鍵盤導航 ↑↓ / role-based sections 渲染差異 / quick search debounce + 結果，全綠

---

### Story 3.7: Four Empty State SVG Illustrations + RoleBadge Audit Display Variant

As a **user (any role)**,
I want **「無資料」場景看到風格一致、有設計感的 line-art empty state（4 種 illustration），而非 lucide 大灰圖示**,
So that **starter kit 視覺辨識度延伸到「失敗 / 空狀態」場景（UX-DR6 全套 + UX-DR4 變體完備）**.

**Acceptance Criteria:**

**Given** `src/assets/empty-states/` 目錄
**When** 我建立 4 個 SVG illustration（手繪或委外）
**Then** `members-empty.svg`（書架 / 信箱意象）
**And** `audit-empty.svg`（翻開的本子 / 鬧鐘）
**And** `search-no-results.svg`（放大鏡 / 紙團）
**And** `error-404.svg`（失蹤的書頁）
**And** 每個 SVG 設計符合：coral `#cc785c` + dark navy `#181715` stroke on cream 內襯背景 / 64-96px 高 / `aria-hidden="true"`

**Given** `EmptyState` component（UX-DR6）
**When** 我實作
**Then** 接受 `variant` prop 對映 4 個 illustration
**And** 接受 `title` (Cormorant display-sm) + `description` (Inter body-md muted) + 可選 `action: { label, onClick / href }`
**And** padding xxl 48px 上下 / xl 32px 左右（UX-DR12 敘事性 spacing）
**And** illustration `aria-hidden="true"`，文字承擔語意

**Given** 整合到既有頁面
**When** Story 3.1 Member list 為空 / Story 3.5 Audit filter 無結果 / 全域 404 頁
**Then** 對應 variant 自動使用
**And** 404 頁路由用 TanStack Router catch-all + `error-404` variant + 「Page not found」hero + coral「Back to dashboard」CTA（UX-DR12 敘事性）

**Given** Story 3.1 與 Story 3.5 已用 placeholder illustration（lucide icon 或 inline SVG stub）
**When** 4 個 final SVG 完成後
**Then** swap Story 3.1 EmptyState `members-empty` variant 的 placeholder 為 `members-empty.svg`
**And** swap Story 3.5 EmptyState `audit-empty` variant 的 placeholder 為 `audit-empty.svg`
**And** Story 3.1 搜尋無結果路徑使用 `search-no-results.svg`（若採同 variant 則 swap 同處，若新增 variant 區分則新增 `search-no-results` variant）
**And** Story 3.7 自身新建的 404 route 直接用 `error-404.svg`
**And** swap 後跑 Vitest snapshot 應更新（移除 placeholder 痕跡）

**Given** RoleBadge size=md variant（UX-DR4 完整）
**When** 我在 audit log table 顯示 actor 角色
**Then** RoleBadge size=md（padding 4×12px）顯示於 actor 欄
**And** size=sm 仍用於 sidebar 角色 badge（避免太大）

**Given** UX-DR21 a11y
**When** EmptyState 渲染
**Then** title 為 `<h2>`（semantic）
**And** 對比度驗證通過（cream bg + ink heading + muted body 全 ≥ AA）

**Given** 寫測試
**When** 我跑 Vitest
**Then** 含：每個 variant render snapshot / CTA click handler 觸發 / aria-hidden 設定 / no description 時佈局正常，全綠

---

## Epic 4: Fork-Ready — Docs, Tests, Coverage + bin/new-project.sh

**Epic Goal:** Starter kit 真正成為「能 fork 起新專案的可重用骨架」：Scribe API 文件 + JWT bearer try-it-out + OpenAPI JSON export；Pest/Vitest 覆蓋率達 60% + 4 條關鍵路徑必測清單全綠；ADR ≥ 5（本案實際 8 篇）+ README 30 秒 quickstart ≤ 200 字 + 「踩坑」清單；`bin/new-project.sh` 6 prompts 互動式 + dry-run preview + 冪等可 resume + box drawing 結束畫面 + ASCII art。J4「fork → 業務開發 ≤ 2 小時」達成驗證。

### Story 4.1: Scribe API Docs + JWT Bearer Try-It-Out + OpenAPI Export

As a **fork 後的開發者（與 future API consumer）**,
I want **`/api/docs` 提供自動生成的 API 文件含 JWT bearer try-it-out 互動，且可手動匯出 OpenAPI JSON 至 `docs/api/openapi.json`**,
So that **未來不需翻 controller 就能理解 API contract（FR35 + FR36 + FR37 + AR16）**.

**Acceptance Criteria:**

**Given** Story 1.2 已安裝 `knuckleswtf/scribe`
**When** 我跑 `php artisan vendor:publish --tag=scribe-config`
**Then** `config/scribe.php` 已 publish

**Given** Scribe config 客製
**When** 我修改 `config/scribe.php`
**Then** `auth.in = 'bearer'`（FR36 JWT bearer try-it-out）
**And** `routes` 設為 `/api/*` 全部納入
**And** `intro_text` 描述 starter kit 概要
**And** API base URL 為 `http://localhost:8080`

**Given** 既有 controller（Epic 1-3 已建）
**When** 我跑 `php artisan scribe:generate`
**Then** `/api/docs` 可訪問且顯示全部 endpoint groups（Auth / Profile / Admin Members / Admin Roles / Admin Audit Logs）
**And** 每個 endpoint 含 request schema / response example / error responses
**And** Auth 標記 bearer 的 endpoint 顯示「Authorize」button，點開可貼 JWT token

**Given** Try-it-out 流程
**When** 我於 `/api/docs` 「Authorize」貼上有效 access token + 對某 endpoint 點「Send Request」
**Then** 實際送出帶 `Authorization: Bearer <token>` 的請求
**And** 回應顯示真實 JSON + status code

**Given** AR16 OpenAPI Export Pipeline
**When** 我跑 `bin/export-openapi.sh`（撰寫此 shell script）
**Then** 跑 `php artisan scribe:generate` + 確認 `docs/api/openapi.json` 已產生
**And** OpenAPI 3.x format 驗證通過（可用 `openapi-cli validate` 或 swagger validator）

**Given** UX-DR12 視覺整合（Scribe 主題客製）
**When** Scribe 預設 theme 不對齊 Anthropic palette
**Then** 接受預設 theme（MVP 不重寫 Scribe theme）但記為 nice-to-have backlog
**And** 至少確認 cream 與 dark navy 不過度違和

**Given** 寫測試
**When** 我跑 Pest
**Then** 含：`/api/docs` 回 200 / 受 bearer 保護的 endpoint 在 docs 中顯示 lock icon

---

### Story 4.2: Test Coverage Push to ≥ 60% + Critical Path Suite All Green

As a **developer (Jie)**,
I want **Pest backend coverage ≥ 60%、Vitest frontend coverage ≥ 60%、且 4 條關鍵路徑（auth/register→verify→login、refresh rotation + blacklist、RBAC middleware + Policy、audit log 寫入）必測清單全綠**,
So that **starter kit 達 PRD 約束的測試紀律（NFR15 + NFR16 + NFR17）**.

**Acceptance Criteria:**

**Given** Epic 1-3 已逐 story 寫測試
**When** 我跑 `vendor/bin/pest --coverage`
**Then** Line coverage ≥ 60%（排除 `database/migrations`、`app/Console`、cached route 檔，NFR15）
**And** 若未達標：補測直到達 60%
**And** Coverage HTML report 生成於 `coverage/`

**Given** Frontend 測試
**When** 我跑 `pnpm vitest run --coverage`
**Then** Line coverage ≥ 60%（排除生成的 route 檔，NFR16）
**And** 若未達標：補測直到達 60%

**Given** 4 條 NFR17 關鍵路徑必測清單
**When** 我跑專門的 critical-path suite（可以 tag `@critical` 或獨立 phpunit group）
**Then** **Critical Path 1**: `auth/register → verify → login` 全綠（Story 1.5 + 1.6 已寫，這裡 audit + 補強）
**And** **Critical Path 2**: `refresh rotation + jti blacklist` 全綠（Story 2.1 + 2.2 已寫）
**And** **Critical Path 3**: `RBAC middleware + Policy` 全綠（Story 3.4 已寫，這裡擴展至所有 admin endpoint）
**And** **Critical Path 4**: `audit log` 寫入 + append-only 全綠（Story 3.2 已寫）
**And** 4/4 全綠才算 Story 完成

**Given** UX-DR22 a11y 自動化
**When** 我跑 Vitest
**Then** 含 axe-core 整合，無 a11y violation
**And** `eslint-plugin-jsx-a11y` recommended rules 通過

**Given** AR20 enforcement tooling
**When** 我跑 `composer pint` 與 `vendor/bin/phpstan analyse --level=5`（larastan 等價）
**Then** 0 violation / 0 error
**And** 前端 `pnpm lint` + `pnpm typecheck` 0 error

**Given** 測試 fixture / factory
**When** 補測過程
**Then** `UserFactory` + `AuditLogFactory` 已建並用於批量測資產生

**Given** CI integration（deferred 第二階段，但本 story 預留）
**When** Story 完成
**Then** 在 `docs/decisions/` 留 note 提及 pre-commit hook + GitHub Actions 為第二階段方向（不在 MVP 範圍）

**Given** Coverage report
**When** Story 完成
**Then** README 加一行「Coverage: backend XX% / frontend YY%」（自動或手動更新）

---

### Story 4.3: ADR Closing + README Quickstart + 踩坑 List

As a **fork 後的開發者**,
I want **`docs/decisions/` 有 ≥ 5 篇完整 ADR（本案實際 8 篇）+ `README.md` 提供 ≤ 200 字 quickstart 與 Windows 開發踩坑清單**,
So that **未來重看時能快速理解技術決策，且 30 秒內可啟動本機 stack（FR33 + FR34 + NFR18 + NFR19 + AR17）**.

**Acceptance Criteria:**

**Given** Story 1.1 / 1.7 / 2.5 / 3.4 / 3.6 已隨 story 寫 ADR
**When** 我盤點 `docs/decisions/`
**Then** 至少含：
  - 0001-record-architecture-decisions.md（記錄 ADR 方法本身）
  - 0002-jwt-over-sanctum.md
  - 0003-self-written-docker-compose-vs-sail.md
  - 0004-postgresql-over-mysql.md
  - 0005-spatie-permission-package.md
  - 0006-token-storage-strategy.md
  - 0007-domain-boundary-pattern.md
  - 0008-rfc-7807-error-format.md
**And** 每篇 ADR 結構含 Context / Decision / Consequences / Date
**And** 若某 ADR 在前序 story 未完成，於本 story 補齊

**Given** README.md
**When** 我撰寫
**Then** 30 秒 quickstart 段（NFR19）≤ 200 字（含 `git clone` → `docker compose up` → 開瀏覽器 → seeder 給的 admin 帳密）
**And** quickstart 字數計數可驗證（Pest 或 shell script 自動 check）

**Given** 「踩坑」清單
**When** 我撰寫
**Then** 含 Windows Docker volume / line ending / file watcher（W0 spike 已蒐集，Story 1.1 留下的 `spike-notes-w0.md` 在此整合）
**And** 含 nginx 反代 dev 與 Vite HMR WS 路徑
**And** 含 JWT 攔截器 401 並發 race（AR10 經驗值）
**And** 含 spatie cache reset 與 JWT stateless 的張力（AR7 經驗值）
**And** 每項為 1-3 句具體描述（問題 + 解法）

**Given** 文件結構
**When** 我整理
**Then** 根目錄 `README.md` 為主入口
**And** `docs/decisions/README.md` 索引 8 篇 ADR
**And** `docs/api/README.md` 引導到 `/api/docs` 與 `openapi.json`

**Given** 寫測試
**When** 我跑 Pest（可選的 doc-lint test）
**Then** 含：README quickstart 段字數 ≤ 200 / ADR 檔數 ≥ 5 / 每篇 ADR 含必要章節，全綠

---

### Story 4.4: `bin/new-project.sh` — Interactive Fork Script with Dry-Run + Resume

As a **半年後的我（fork 起新專案）**,
I want **`bin/new-project.sh` 6 個互動式 prompt + dry-run preview + apply + box drawing 結束畫面 + 冪等可 resume + smart defaults**,
So that **clone → 寫第一行業務 controller ≤ 2 小時（FR31 + FR32 + UX-DR24 + AR18 W0 spike 結論落地 + NFR20）**.

**Acceptance Criteria:**

**Given** `bin/new-project.sh` 不存在
**When** 我撰寫 bash script
**Then** 起手檢查依賴：`git` / `docker` / `pnpm` 都在 PATH，缺則明確提示「請安裝 X」+ exit 1
**And** 用 ANSI 色碼：question prompt cyan / default value dim / success green / error red
**And** width 適配 `$COLUMNS`（最少 60、最多 100）

**Given** Box drawing banner（UX-DR24）
**When** script 啟動
**Then** 顯示 `╭─────╮ │ bmad-project starter kit ... │ ╰─────╯`
**And** 無 emoji（除 ✓ ✗ ASCII compatible）

**Given** 6 個 interactive prompts with `[N/6]` progress
**When** script 執行
**Then**
  - [1/6] Project name?（範例「my-rss-tool」）
  - [2/6] PHP namespace?（從 project name 推導 PascalCase 預設）
  - [3/6] HTTP port?（偵測 8080 是否被佔用，建議 8081）
  - [4/6] PostgreSQL DB name?（從 project name 推導 snake_case 預設）
  - [5/6] Keep example Member domain? (Y/n)
  - [6/6] Git remote URL?（可空白）
**And** 每題顯示 helper text + 接受 Enter 預設值
**And** 每答案 echo 確認

**Given** Dry-run summary
**When** 6 個 prompt 完成
**Then** 顯示對齊欄位排版（左 key、中 arrow、右 value）的變更摘要
**And** 列出 Files to be changed（不展開內容）含 `docker-compose.yml` / `composer.json` / `bootstrap/app.php` / `.env.example` / `package.json` / `vite.config.ts` / 各 namespace 檔等預估 12 個檔案
**And** 提示 `Proceed? (Y/n)`

**Given** 確認套用
**When** user 選 Y
**Then** 用 sed / regex 替換各檔案的 namespace / port / DB / project name
**And** 每個檔案改動完成顯示 ✓ spinner marker
**And** 若選「移除 example Member domain」→ `rm -rf app/Domain/Member frontend/src/features/members` + 移除 route + test

**Given** Git 操作
**When** 提供 git remote
**Then** `git remote set-url origin <url>` + `git push -u origin main`
**And** 若 push 失敗（remote 不存在）→ 警告但不阻擋 + 提示手動指令

**Given** 結束 banner
**When** apply 成功
**Then** 顯示「✓ Ready in N min」box banner
**And** Next: 三條指令（`docker compose up` / `open http://localhost:<port>` / 「log in with admin@example.com / password」）
**And** 「Read the ADRs: docs/decisions/」pointer

**Given** FR32 冪等
**When** script 第二次跑（已 fork 過的 repo）
**Then** 偵測 `.new-project-state` 或 sentinel marker（如 `composer.json` 已是新 namespace）
**And** 提示「This project appears already initialized. Resume? (Y/n)」
**And** 重跑不爆炸不重複寫入

**Given** 中斷與 recovery（UX-DR24）
**When** apply 階段中斷（Ctrl+C 或 sed 錯）
**Then** 寫 `.new-project-state` 暫存檔（含已完成步驟）
**And** 下次重跑問「Resume from last state? (Y/n)」

**Given** Edge cases
**When**
  - port range 都被佔用 → 「請手動設定 port，然後重跑」+ exit 1
  - namespace 含非法字元 → 當題重問
  - git push 失敗 → 警告但成功 exit

**Given** AR18 W0 spike 結論
**When** Story 4.4 開始
**Then** 引用 Story 1.1 spike 對 sed/regex 的具體規則設計
**And** 14 個檔案的替換規則文件化

**Given** 寫測試
**When** 我跑（手動 + bats shell test 框架，optional）
**Then** 至少有 sanity smoke test：起一個 temp dir 跑 script → 答 prompts → 驗 sed 結果正確
**And** Resume scenario 手動 verify

**Given** NFR20 fork ≤ 2h
**When** 半年後實際 fork
**Then** wall-clock 量測（半年後驗證，非本 epic 內驗）
**And** README 註記「Last measured: TBD」placeholder

---

### Story 4.5: Cross-Browser + A11y Test Matrix + Performance Audit (Stop-Loss Check)

As a **developer (Jie)**,
I want **跨 4 瀏覽器 × 最新兩版 + iOS Safari + Android Chrome real device 測一遍 J1-J4 / 鍵盤導航 / VoiceOver / Color blind 模擬 / Performance 量測 NFR1-4**,
So that **starter kit 可信驗證符合所有 NFR 並為 W3 末 stop-loss 收尾（NFR1-4 + NFR12-14 + UX-DR20 + UX-DR22）**.

**Acceptance Criteria:**

**Given** Browser matrix（UX-DR22 + PRD Project-Type Specific）
**When** 我手動測試
**Then** Chrome / Edge / Firefox / Safari 最新兩個版本，J1-J4 全部 user journey 可運作
**And** 任何 violation 記錄於 `docs/browser-test-results-w4.md`

**Given** Mobile real device（UX-DR22 + UX-DR20 member 端）
**When** 我用 iOS Safari + Android Chrome 跑 member journey（J1 + J2）
**Then** 註冊 / 登入 / Profile 編輯 / 密碼變更全部可運作
**And** 響應式佈局：< 768px hamburger sheet、Form max-w-md 置中、touch target ≥ 44px

**Given** Keyboard-only navigation
**When** 我用鍵盤跑完 J1-J4
**Then** 所有互動可達（Tab / Shift+Tab / Enter / Space / Esc）
**And** Focus ring 永遠可見（coral 15% alpha 3px）
**And** Skip-to-content link 可用

**Given** Screen reader（VoiceOver macOS + NVDA Windows）
**When** 我手動測 J1-J3
**Then** Toast 用 `aria-live="polite"` 被宣讀
**And** RoleBadge 含 `aria-label` 被宣讀
**And** Form FormMessage 與 aria-describedby 被宣讀

**Given** Color blindness（Chrome devtools rendering 模擬）
**When** 我啟用 protanopia / deuteranopia / tritanopia
**Then** 所有狀態指示（success / warning / error / role badge）仍可辨識（因 UX-DR21 色彩 + icon 雙通道）

**Given** Performance Audit（NFR1-4）
**When** 我用 Lighthouse 跑 admin 主要頁面（local docker）
**Then** **NFR1 FCP ≤ 1.5s** — pass
**And** **NFR2 bundle gzip ≤ 250KB** — `pnpm build && du -h dist/assets/*.js.gz` 驗證
**And** **NFR3 API p95 ≤ 300ms** — 用 `ab` 或 simple script 量測主要 endpoint
**And** **NFR4 TanStack staleTime ≥ 30s** — config code review 驗

**Given** Stop-Loss 自檢（PRD MVP Strategy W3 末強制決策點）
**When** Epic 4 接近結束
**Then** 自檢 7 個 PRD MVP 驗收場景達成數
**And** 若 < 5/7：依 PRD 約束砍 Audit log + Scribe 到第二階段（Epic 3 全部 + Epic 4.1 移到 Phase 2）
**And** 若 ≥ 5/7：繼續完成 W4，記錄達成狀態於 `docs/stop-loss-check-w3.md`

**Given** UX-DR22 不適用項目
**When** Story 完成
**Then** 文件註記「JAWS 與 User testing with disabled users 為個人練手範圍外，公開 repo 後社群回饋作為 proxy」

**Given** Documentation 收尾
**When** Story 4.5 結束
**Then** README 補上 Coverage（Story 4.2 結果）+ Performance benchmark（本 story 結果）+ Browser matrix 結果
**And** 整個 starter kit 進入「可公開 repo」狀態

**Given** 寫測試（NFR15 一般測試已在 Story 4.2 達成）
**When** 本 story 主要為手動 audit
**Then** 結果記錄於三份文件：`docs/browser-test-results-w4.md` / `docs/a11y-audit-w4.md` / `docs/perf-audit-w4.md`

