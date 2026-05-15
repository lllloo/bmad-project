---
title: "Product Brief Distillate: bmad-project"
type: llm-distillate
source: "product-brief-bmad-project.md"
created: "2026-05-15"
purpose: "Token-efficient context for downstream PRD creation"
---

# Distillate — bmad-project（Laravel + React + AI-ready starter kit）

## Product Framing

- 個人練手非商業專案；唯一使用者是開發者本人；無市場差異化目標，僅評估學習 ROI、可重用性、技術深度。
- 核心哲學：**反 opinionated、追求 first principles**——刻意拒絕 Inertia / Sanctum / Sail / shadcn-admin（直接 fork）等省事路線。
- 兩階段定位：**MVP 是地基，AI 是 punchline**（履歷重點）。

## Technical Stack（固定決策）

- 後端：**Laravel 12 + PostgreSQL**（為第二階段 pgvector 預埋）
- 前端：**React 19 + Vite + TanStack Router + TanStack Query + shadcn/ui**
- 認證：**`php-open-source-saver/jwt-auth` v2.8.2**（fork from tymon，社群主力）
- 權限：**`spatie/laravel-permission`**，三角色 admin / editor / member，必用 Policy / Gate
- 容器：**自寫 docker-compose**（nginx + php-fpm + postgres + node），不用 Sail
- 文件：**Scribe**（zero-annotation 自動推導，`auth.in=bearer` 自訂）
- 測試：**Pest**（後端） + **Vitest + React Testing Library**（前端）
- UI 起點：**抄 `satnaing/shadcn-admin` layout**（非 fork）改造接 TanStack Router

## Authentication 細節（PRD 必須涵蓋）

- **Access token**：短命、放**記憶體**（不可 localStorage）
- **Refresh token**：放 **httpOnly cookie + SameSite=Lax 或 Strict + rotation**
- **撤銷清單**：**DB table（jti blacklist）**，不引入 Redis
- **前端 401 攔截器**：自動 refresh + queue 重試（W0 spike 必驗）
- **CORS / CSRF**：因前後端**同網域反代**，cookie 與 CORS 處理簡化；`supports_credentials=true`，前端 `withCredentials`
- Scribe 對 JWT 需在 `config/scribe.php` 設 `auth.in=bearer, auth.name=Authorization`，並提供 token 範例

## RBAC 細節

- 三角色：admin / editor / member
- Laravel 12 中介層 alias 註冊位置：**`bootstrap/app.php`**（非 `Kernel.php`）
- 改角色後 cache 需 `permission:cache-reset`；JWT 無狀態場景需縮短 access token 壽命或加強制 refresh
- Anti-pattern：禁止 `hasRole()` 撒在 controller，一律走 Policy / Gate

## Module Boundary（fork 友善）

- `app/Domain/Auth/`：框架，fork 保留
- `app/Domain/Member/`：範例業務，fork 可刪
- 前端 `src/features/auth/` vs `src/features/members/` 對稱分離

## Developer Experience（MVP IN）

- **Seeders**：`RoleSeeder` + `AdminUserSeeder` + `DemoMembersSeeder`，docker entrypoint 自動跑
- **ADR**：`docs/decisions/` ≥ 5 篇（JWT vs Sanctum、自寫 compose vs Sail、PG vs MySQL、RBAC 套件、token 儲存）
- **README**：30 秒 quickstart + 踩坑筆記
- **`bin/new-project.sh`**：一鍵 fork 腳本（互動式問 project name / port / DB / namespace，自動改檔），承諾「2 小時內進入業務開發」

## Capacity & Schedule

- 每週投入時數：**不設限**
- W0：技術 spike（shadcn-admin + TanStack Router + JWT refresh 攔截器）
- W1：docker-compose 完整跑通 + 基礎 JWT 登入登出 + shadcn layout
- W2：JWT rotation + blacklist + 401 攔截器 + Profile + 密碼重設
- W3：RBAC 三角色 + Admin 端 + Audit log；**末尾 stop-loss 決策點**
- W4：Scribe + 測試 + Seeders + ADR + README；重構 timebox ≤ 3 天

### Stop-Loss（W3 末強制決策點）

驗收場景未達 5/7 → 自動砍 Audit log + Scribe 到第二階段，保留 auth / RBAC / Docker / 雙端 / 三角色。

## MVP Acceptance Scenarios（PRD 拆 user stories 起點）

1. **註冊 + 驗證**：註冊 → email log 取驗證連結 → 驗證 → 登入
2. **Token 流程**：登入後拿 access + refresh，access 過期自動 refresh，登出能撤銷（blacklist 寫入）
3. **Profile**：可改密碼、改名
4. **Admin 管理會員**：列表、停權、改密碼、指派角色
5. **三角色權限差異**：admin / editor / member 看到不同選單與 API 權限
6. **Audit log**：停權、改角色、改密碼三類敏感操作必記
7. **API 文件**：Scribe try-it-out 可完整跑通 JWT 流程

## Critical-Path Tests（覆蓋率輔助指標 60%，但這幾條必測）

- `auth/register → verify → login` 流程
- `refresh rotation + blacklist` 流程
- `RBAC middleware + Policy` 守門
- `Audit log` 寫入正確性

## Anti-Patterns（PRD / 開發過程禁止）

- ❌ Access token 放 localStorage
- ❌ `hasRole()` 撒在 controller
- ❌ dev 跳過 nginx 直連 Vite
- ❌ 為衝 60% 覆蓋率排擠核心功能
- ❌ 為全練 AI 而 MVP 做不完
- ❌ 「先 localStorage 之後再改」的妥協

## Rejected Ideas（避免 PRD 重提）

| 拒絕項 | 理由 |
|---|---|
| Sanctum cookie 模式 | 學習目的就是要練 JWT 無狀態全套設計 |
| Inertia.js | 抽掉 CORS / token / SPA 學習價值 |
| Laravel Sail | opinionated 黑盒；自寫 compose 才看穿每層 |
| `tymon/jwt-auth` | 維護停滯；POSS fork 才是社群主力 |
| MySQL | 為第二階段 pgvector 選 PostgreSQL |
| Tailwind Plus / Catalyst UI Kit | 評估後改回 shadcn/ui（免費 + 擁有原始碼） |
| Redis（MVP 階段） | blacklist 用 DB table 足夠；Redis 留第二階段 |
| 真實 SMTP（MVP 階段） | log-only 即可，但 token 過期 / 單次使用要做到位 |
| 線上 deploy（MVP 階段） | 純本機 docker-compose |
| CI/CD / Queue / Reverb / i18n / E2E（MVP 階段） | 都明確排除以鎖 scope |
| Filament / Nova / Breeze / Jetstream / 官方 React starter | Livewire / Vue Inertia / Sanctum 路線不符學習目標 |
| 直接 fork `satnaing/shadcn-admin` | 抄 layout 但自己重接 TanStack Router |
| 公開技術文章 / 影片承諾 | 避免額外負擔（4b 決定） |

## Phase 2 — AI 後台（優先序明確）

| 優先 | 模組 | 備註 |
|---|---|---|
| **P0** | **RAG（pgvector）** | MVP 已預留 PG，入口最近，2026 後台最具備案最廣 |
| P1 | Agent / Tool use + MCP server | 可與 Claude Code / Codex dogfooding |
| P1 | LLM Chat 介面 | 相對簡單 |
| P2 | 內容輔助（改文案 / 摘要 / 翻譯） | 等實際需求 |
| P2 | NL → SQL 資料分析 | 風險高需 guardrail |

第二階段同步引入：線上 deploy、E2E（Playwright）、CI/CD、Queue / Job、Real-time（Reverb）。

## Known Risks（PRD 須有對策）

1. **Scope creep**（最大）：Stop-Loss 機制不可妥協
2. **Windows + Docker volume / line ending / file watcher** 不一致：W0 spike 必驗
3. **TanStack + JWT refresh 攔截器** 401 自動 refresh + queue 重試：W0 spike 必驗
4. **spatie cache invalidation 在 JWT 無狀態場景**：縮短 access TTL 或顯式 cache reset
5. **PostgreSQL 與 MySQL 差異**：enum 自訂 type、jsonb 索引、`LIKE` 預設大小寫敏感（用 ILIKE）

## Open Questions（PRD 階段補答）

- W0 spike 結論：shadcn-admin layout 與 TanStack Router 整合的具體改寫工作量？
- Access token 壽命具體值（5 分鐘？15 分鐘？60 分鐘？）
- Refresh token 壽命與 rotation 觸發條件（每次 refresh 換 / 滑動視窗）
- Audit log 儲存策略（同庫表 / 獨立 schema / 未來導向 OpenTelemetry？）
- `bin/new-project.sh` 改寫範圍：namespace？資料夾名？git remote？
- 第二階段 RAG 的 chunk 策略、embedding model 選擇（OpenAI / Voyage / 本地）
- 線上 deploy 目標（VPS / Forge / Fly.io）— 影響 docker-compose 是否需調整為 docker-compose.prod.yml

## Scope Signals

- **IN MVP**：見 brief §Scope > MVP IN
- **OUT MVP**：見 brief §Scope > MVP OUT
- **第二階段**：見 brief §Scope > 第二階段
- **長期 Vision**：個人版 Laravel + React + AI 平台骨架；公開 repo 可被小範圍社群參考（不承諾維護以上）

## BMAD 流程定位

- 此 brief 為全新 BMad 工作區（v6.6.0）的第一份正式輸出
- 下一步：以本 brief + 本 distillate 為輸入跑 `bmad-create-prd`
- 後續：`bmad-create-ux-design` → `bmad-create-architecture` → `bmad-create-epics-and-stories` → `bmad-check-implementation-readiness` → `bmad-sprint-planning` 進入實作
