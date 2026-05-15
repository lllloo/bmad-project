---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
status: complete
releaseMode: phased
classification:
  projectType: web_app+api_backend
  domain: general
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-project.md
  - _bmad-output/planning-artifacts/product-brief-bmad-project-distillate.md
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
project_name: bmad-project
user_name: Jie
date: '2026-05-15'
lastEdited: '2026-05-15'
editHistory:
  - date: '2026-05-15'
    changes: '主軸敘事從「練功 / 練手 / 教練表」改為「side project 起點」，11 處替換；不動 FR / NFR / scope / 技術細節'
  - date: '2026-05-15'
    changes: 'Top 3 polish from validation report：NFR19 主觀化修正、FR 章節加 technical starter kit disclaimer、FR2 與 FR29 微銳化（FR2 引用 NFR11、FR29 列具體容器數）'
---

# Product Requirements Document - bmad-project

**Author:** Jie
**Date:** 2026-05-15

## Executive Summary

**bmad-project** 是一份個人擁有、可重複 fork 的 Laravel + React + AI-ready 全棧後台 starter kit，定位為**能撐住多個 side project 的共同骨架**。目標使用者為開發者本人。第一階段交付可本地 demo 的 MVP——三角色 RBAC + JWT access/refresh rotation + Admin/會員雙端 + Audit log + Scribe API 文件 + Pest/Vitest 測試。第二階段以 RAG（P0）為主軸擴張 AI 後台能力（Agent / Chat / 內容輔助 / NL→SQL）。產品評估指標僅三項：**side project 啟動速度、可重用性、技術深度**。

### What Makes This Special

**反 opinionated、追求 first principles**——刻意拒絕三項社群主流的便利選項：

- **獨立 SPA 而非 Inertia**——保留 CORS、token、refresh、跨服務 API 設計權與實作經驗
- **JWT 而非 Sanctum**——強迫面對無狀態認證全套（token 儲存、rotation、撤銷、CSRF/XSS 防護）
- **自寫 docker-compose 而非 Sail**——看穿 nginx fastcgi、php-fpm pool、postgres volume 每層

加上 **PostgreSQL（為 pgvector 預留）** 與 **AI-first foundation（pgvector schema、queue 入口、token cost 觀測點在 MVP 階段就設計定位）**，把 2026 後台基本功直接灌進骨架，**第一個 side project 就用得到**。

**Core insight**：省事的便利選項抽掉了設計權與實作經驗；逆勢挑路換來的能力，下一個 side project 就回收。

**Value proposition**：一份個人擁有的 Laravel + React + AI starter kit，刻意走冷門路線換來真正能寫進實際 side project 與接案的全棧能力，並以 `bin/new-project.sh` 承諾下個 side project「2 小時內進入業務開發」。

## Project Classification

- **Project Type**：`web_app` + `api_backend`（雙重——獨立 React SPA + Laravel REST API）
- **Domain**：`general`（通用工具，非業務領域）
- **Complexity**：**medium**——無 regulation，但含 JWT rotation / RBAC / 自寫 Docker 編排 / pgvector AI 整合等多套件協作
- **Project Context**：**greenfield**——無既有 codebase

## Success Criteria

### User Success

「User」指開發者本人（短期）與**下個 side project 的我**（中長期）。

- **短期**（W4 完成 MVP）：本機 `docker compose up` → seeders 自動建三角色與 admin → 完整走完 7 個驗收場景（註冊→驗證→登入→token refresh→Profile→Admin 管理→權限差異→Audit log），對自己解釋每一步背後的技術選擇。
- **中期**（首次 fork）：執行 `bin/new-project.sh` → **2 小時內**進入業務開發（namespace / port / seed / git remote 處理完）。
- **Side project ready 自我驗證**：5 分鐘內口頭講清楚 access/refresh token 設計、為何 JWT 不選 Sanctum、為何自寫 compose 不用 Sail；可直接秀 repo 給面試官 / 技術同儕 / 接案窗口。

### Business Success（非商業專案 → Side Project ROI）

本案無營收目標，改以個人投資回報衡量：

- **時間槓桿**：首次 fork 即省下 1–2 週基礎建設時間；累積三次 fork 後，重複勞動成本趨近於零。
- **能力資產**：完成後具備 JWT 全流程、RBAC 套件實戰、自寫 Docker 編排、Scribe + Pest 寫文件與測試的完整 portfolio。
- **接案 / 面試準備度**：repo 公開可被外部 review；能以具體 ADR 回答取捨問題。

### Technical Success

MVP 收斂條件的詳細逐項與量測值見 [Functional Requirements] 與 [Non-Functional Requirements]。本節僅為人讀摘要：

- **能力面**：三角色 RBAC + JWT rotation + jti blacklist + Audit log + Scribe try-it-out 全部可運作
- **體驗面**：`docker compose up` 一鍵啟動 + seeders auto-run + `bin/new-project.sh` 可互動 fork
- **品質面**：Pest / Vitest 覆蓋率 ≥ 60% + 關鍵路徑必測清單全綠

**Anti-Patterns（成功條件包含「沒做這些」）**：

- ❌ Access token 放 localStorage
- ❌ `hasRole()` 撒在 controller 任一處
- ❌ dev 跳過 nginx 直連 Vite
- ❌ 為衝覆蓋率排擠核心功能
- ❌ 「先 localStorage 之後再改」的妥協

### Measurable Outcomes

| 指標 | 目標值 | 量測方式 |
|---|---|---|
| MVP 驗收場景通過數 | 7/7 | 手動 + Pest/Vitest 涵蓋 |
| 覆蓋率（Pest / Vitest） | 各 ≥ 60% | `pest --coverage` / `vitest run --coverage` |
| 關鍵路徑必測清單 | 4/4 全綠 | 手動跑 + 測試報告 |
| ADR 篇數 | ≥ 5 篇於 `docs/decisions/` | 檔案計數 |
| 首次 fork → 進入業務開發耗時 | ≤ 2 小時 | 半年後實際計時 |
| Stop-loss 是否觸發 | 不觸發（W3 末完成 ≥ 5/7） | W3 末自檢 |

## User Journeys

### Journey 1 — Member 首次註冊到上手（Primary, Success Path）

**Persona**：Lin，受邀加入這個 starter kit 跑起來的 demo 站點，想看看自己的會員資料管理流程。

**Opening Scene**：Lin 收到管理員寄出的邀請連結（MVP 階段 = 從 email log 撈到），點進去進入註冊頁。第一眼看到的是 shadcn/ui 樣板的乾淨表單，沒有花俏元素。

**Rising Action**：
1. 填寫 email + 密碼（前端即時驗證強度與一致性）
2. 送出 → 收到「請至 email 確認」提示
3. 開發者開 `docker logs` 撈到驗證 token URL → 貼到瀏覽器點擊
4. 驗證頁顯示「Email 已確認，請登入」

**Climax**：登入時前端 SPA 拿到 short-lived access token（記憶體）與 refresh token（httpOnly cookie）。Lin 開始操作，**完全感受不到 token 機制**——背景 axios 攔截器自動 refresh，UI 永遠不卡。

**Resolution**：進到 Profile 頁，可改名、改密碼。改完登出 → refresh token 被撤銷（blacklist 寫入 DB），下次重新登入。

**Reveals capabilities**：註冊表單、email 驗證 token 流程（生成 + 過期 + 單次使用）、登入 / 登出、Profile CRUD、密碼變更、access/refresh token 攔截器、jti blacklist 撤銷。

### Journey 2 — Token 過期與 Recovery（Primary, Edge Case）

**Persona**：同 Lin，正在編輯個人資料時 access token 過期。

**Opening Scene**：Lin 編輯到一半被打斷去開會，回來繼續按「儲存」。

**Rising Action**：前端 axios 攔截器偵測到 401 → **靜默自動 refresh**（拿 httpOnly cookie 中的 refresh token → 換新 access token） → 重發原請求。

**Climax**：儲存成功，Lin 完全不知道剛剛發生了什麼事。Network 面板看得到 401 → refresh → retry 的痕跡，但 UX 無中斷。

**Resolution（含失敗路徑）**：

- Refresh token 也過期 / 被撤銷 → 跳 `/login` 並保留 return URL；登入後回原頁
- Refresh API 連續失敗 3 次 → 視為 token 鏈異常，強制登出

**Reveals capabilities**：401 攔截器、refresh token rotation、return URL preservation、token chain failure 重試政策、強制登出機制。

### Journey 3 — Admin 管理會員與角色（Secondary）

**Persona**：Wei，本 starter kit 起的站點的管理員（seeder 建出來的初始 admin）。

**Opening Scene**：Wei 登入後台，左側選單看到「會員管理 / 角色管理 / Audit log」（member / editor 看不到這幾項）。

**Rising Action**：
1. 點「會員管理」→ 列表頁，含 search / pagination / sort
2. 找到一位疑似違規會員 → 點「停權」→ confirm dialog → 提交
3. 切到「Audit log」分頁：剛剛的停權操作已記錄（who / what / when / target user ID）

**Climax**：Wei 同時把另一位會員從 member 升級成 editor → 點「指派角色」→ 多選下拉選 editor → 儲存。被指派的人下次登入後選單立刻多了 editor 才能看到的項目。

**Resolution**：所有操作進 Audit log；改角色後的 cache invalidation 在背景自動發生（spatie permission cache reset）。

**Reveals capabilities**：RBAC 三角色選單差異化、會員列表查詢（search/pagination/sort）、停權 API + UI、角色指派 API + UI、Audit log 寫入 + 查詢、spatie cache invalidation 自動化。

### Journey 4 — Developer Fork 起新專案（半年後的我，Critical）

**Persona**：半年後的 Jie 想做一個新的 AI side project（例如「個人 RSS 內容摘要管理」）。

**Opening Scene**：`git clone bmad-project-starter my-rss-tool && cd my-rss-tool && bin/new-project.sh`

**Rising Action**：
1. 腳本互動式提問：project name？port（避開現有 8080）？DB 名？namespace（`App\` → `RssTool\`）？保留範例 `Member` domain 嗎？
2. 自動改 `docker-compose.yml`、`.env.example`、`composer.json` namespace、`bootstrap/app.php`、前端 `package.json` 的 name 與 dev port
3. `docker compose up` → seeders 自動跑 → admin 帳號可登入 → ADR 留在 `docs/decisions/` 提醒之前決策

**Climax**：**70 分鐘**後，Jie 已經在新 namespace 下寫第一個 `RssFeedController` 並能用 admin 身分操作；JWT / RBAC / Docker / Scribe 一個都不用碰。

**Resolution**：Jie 把舊有 `Member` domain 整個刪掉（在 `app/Domain/Member/` 是隔離設計），不影響 auth 框架；切回開發 AI 業務邏輯。**承諾達成（2 小時內進入業務開發）**。

**Reveals capabilities**：`bin/new-project.sh`、Domain 邊界分離（Auth 框架 vs Member 範例業務）、docker-entrypoint 自動 seed、ADR 留檔、README quickstart。

### Journey Requirements Summary

| Capability Area | 來自 Journey | MVP 必達 |
|---|---|---|
| 註冊 / Email log 驗證 | J1 | ✅ |
| 登入 / 登出 / refresh token rotation | J1, J2 | ✅ |
| JWT 攔截器 + 401 靜默 refresh + return URL | J2 | ✅ |
| jti blacklist 撤銷 | J1, J2 | ✅ |
| Profile CRUD + 密碼變更 | J1 | ✅ |
| RBAC 三角色 + 選單差異化 | J3 | ✅ |
| 會員列表（search / pagination / sort） | J3 | ✅ |
| 停權 / 改密碼 / 指派角色 Admin API + UI | J3 | ✅ |
| Audit log 寫入 + 查詢 | J3 | ✅ |
| Spatie permission cache invalidation | J3 | ✅ |
| `bin/new-project.sh` 互動式 fork | J4 | ✅ |
| Domain 邊界（Auth vs Member）隔離 | J4 | ✅ |
| Docker entrypoint auto-seed | J4 | ✅ |
| ADR 留檔 + README quickstart | J4 | ✅ |

## Domain-Specific Requirements

Domain = `general`（無 healthcare / fintech / govtech 等業務規範）。**無外部法規或合規門檻**；以下為**自設工程紀律 constraints**，等同於本案的內部「domain」：

### 安全 Constraints（架構紀律核心）

- Access token 必須走記憶體（禁止 localStorage / sessionStorage）
- Refresh token 走 httpOnly cookie + SameSite=Lax（或 Strict，依同網域反代結論）
- Refresh rotation：每次 refresh 換新 jti 與新 token；舊 jti 立即列入 blacklist
- 撤銷清單：DB table（`token_blacklist`，欄位 `jti / expires_at / reason`），不引入 Redis
- 密碼 hash：Laravel 預設 `bcrypt`（cost 12 起跳）
- 所有敏感操作（停權 / 改角色 / 改密碼）寫入 Audit log

### Privacy Constraints

- Email 在 MVP 階段不外寄（log-only），但驗證 token 與密碼重設 token 仍須遵守單次使用、過期失效規則
- Audit log 保存使用者標識（user_id + email 不保存明文，僅 id reference）

### 重用性 Constraints

- 框架（`app/Domain/Auth/`、`src/features/auth/`）與範例業務（`Member`）的目錄與 namespace 邊界必須清楚，fork 時 `Member` 可整段刪除而 auth 框架不破
- 所有環境差異須集中於 `.env`（不可硬編 URL / port / namespace）
- `bin/new-project.sh` 必須是冪等的（重跑不爆炸）

### 風險 Mitigations

| 風險 | 緩解措施 |
|---|---|
| Spatie cache 在 JWT 無狀態下未失效，舊 token 帶舊權限 | Access token TTL ≤ 15 分鐘，並在改角色 API 顯式呼叫 `permission:cache-reset` |
| 同網域反代 dev 與 prod 行為不一致 | Dev 強制走 nginx 反代到 8080，禁止 Vite 直連 |
| Windows + Docker volume / line ending / file watcher | W0 spike 必驗，README 「踩坑」段須記實 |
| 401 自動 refresh 死循環 | 攔截器設 retry 上限 1 次；refresh 失敗 → 強制登出，連續 3 次 token 鏈異常 → forced logout |

## Innovation & Novel Patterns

### Detected Innovation Areas

本案的「innovation」非源自全新技術發明，而是**選擇與整合方式上的逆勢設計**：

- **冷門路線組合**：獨立 SPA + JWT + 自寫 Docker + AI-ready 一次架到位；三項主流便利選項（Inertia / Sanctum / Sail）全部刻意拒絕。社群多以官方 starter 為新專案預設，此組合在 2026 仍稀缺。
- **BMAD × side project 工作流**：以 BMad Method 從零跑完一個非 trivial 全棧 + AI 專案，把所有 artifacts（brief / distillate / PRD / architecture / stories）留存於 `_bmad-output/`，作為「方法論 × 程式碼」雙重 portfolio，未來每個 side project 都能複用。
- **AI-first foundation from day 1**：MVP 階段就為 pgvector schema、queue 入口、token cost 觀測點預留位置，避免第二階段大改。

### Market Context

- Laravel 12 官方四個 starter（React / Vue / Svelte / Livewire）全採 Sanctum + Inertia 2，本案路線屬「**官方主流之外**」。
- shadcn/ui + React 19 + Vite 為 2026 admin dashboard 事實標準，前端與主流同步；後端則刻意逆向。
- `php-open-source-saver/jwt-auth` v2.8.2 與 `spatie/laravel-permission` 在「JWT-only API」場景下的整合範例稀缺，本案可填補社群空白。

### Validation Approach

- **MVP 完成本身就是 validation**——能在一個月內把所有冷門路線整合可運作就是路線可行性的證明。
- 公開 repo + ADR 留檔，讓外部 review 可驗證選擇背後的工程考量。

### Risk Mitigation

- **路線偏門 = 參考實作稀缺**：寫 ≥ 5 篇 ADR 留下決策脈絡；W0 spike 把最大未知數（shadcn-admin + TanStack Router + JWT 攔截器）提前驗證，避免到 W2/W3 才撞牆。

## Project-Type Specific Requirements（web_app + api_backend）

### Project-Type Overview

本案同時為：

- **獨立 React SPA**（前端，給人類使用者用）
- **Laravel REST API**（後端，給前端 SPA 與未來 AI agent 用）

兩者**同網域反代**但各自獨立部署單元，介接以 JSON over HTTPS。

### Technical Architecture Considerations

```
┌──────────────────────────────────────────────────────────┐
│            nginx (8080, 反代閘道)                          │
│  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │  /api/* → php-fpm   │  │  /* → React SPA (Vite dev)  │ │
│  │  Laravel 12         │  │  React 19 + TanStack        │ │
│  │  jwt-auth + spatie  │  │  shadcn/ui + axios          │ │
│  └─────────┬───────────┘  └─────────────────────────────┘ │
└────────────┼───────────────────────────────────────────────┘
             │
             ▼
       ┌──────────┐
       │ Postgres │
       └──────────┘
```

### Web App Specific（前端）

- **Browser Matrix**：Chrome / Edge / Firefox / Safari 最新兩個版本；不支援 IE
- **Responsive Design**：admin 端筆電優先（≥ 1280px），會員端含手機（≥ 375px）。Tailwind breakpoints
- **Performance Targets**：
  - 首次有意義繪製 ≤ 1.5s（local docker 環境）
  - JS bundle gzip ≤ 250KB（initial）
  - TanStack Query 預設 `staleTime` 30s，避免重複請求
- **SEO Strategy**：不適用（私有後台）；`robots.txt: Disallow: /`
- **Accessibility Level**：WCAG 2.1 AA 基準（鍵盤導航 + ARIA），shadcn/ui 內建 Radix 已涵蓋大部分

### API Backend Specific（後端）

**Endpoint Specs**（總列；欄位細節待 Architecture 階段）：

| Method | Path | 用途 |
|---|---|---|
| `POST` | `/api/auth/register` | 註冊 |
| `POST` | `/api/auth/verify/{token}` | Email 驗證 |
| `POST` | `/api/auth/login` | 登入（回 access token + 設 refresh cookie） |
| `POST` | `/api/auth/refresh` | Refresh token rotation |
| `POST` | `/api/auth/logout` | 撤銷 refresh + 加入 blacklist |
| `POST` | `/api/auth/password/reset-request` | 密碼重設請求 |
| `POST` | `/api/auth/password/reset` | 密碼重設執行 |
| `GET` | `/api/me` | 取得自己 profile |
| `PATCH` | `/api/me` | 改 profile |
| `POST` | `/api/me/password` | 改密碼 |
| `GET` | `/api/admin/members` | 會員列表（search/pagination/sort） |
| `PATCH` | `/api/admin/members/{id}` | 改會員（含停權） |
| `POST` | `/api/admin/members/{id}/roles` | 指派角色 |
| `POST` | `/api/admin/members/{id}/password` | Admin 改會員密碼 |
| `GET` | `/api/admin/audit-logs` | Audit log 查詢（filter/pagination） |

- **Auth Model**：JWT bearer in `Authorization` header；refresh token in httpOnly cookie。詳細見 [Domain-Specific Requirements > 安全 Constraints]
- **Data Schemas**：JSON in/out；錯誤格式遵循 [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807)（`type` / `title` / `detail` / `status` / `instance`）
- **Error Codes**：`400` validation；`401` 未認證；`403` 權限不足；`404` not found；`409` conflict；`422` 業務邏輯錯誤；`429` rate limit；`500` server error
- **Rate Limits**：
  - 認證 endpoints（login / register / refresh / password reset）每 IP 每分鐘 10 次
  - 一般 API endpoints 每使用者每分鐘 60 次
- **API Docs**：Scribe 自動生成於 `/api/docs`，含 JWT bearer try-it-out；release 時匯出 OpenAPI JSON 到 `docs/api/openapi.json`

### Implementation Considerations

- **Versioning**：MVP 階段單版本（無 `v1/v2` 前綴）；第二階段 AI endpoint 可考慮 `/api/v2/ai/*`
- **CORS / Cookie 同網域反代**：nginx 反代統一在 8080，`SameSite=Lax` 即可，`supports_credentials=true`，無需處理跨網域 CORS preflight
- **CSRF**：JWT bearer + httpOnly cookie + SameSite=Lax 的組合下，Laravel CSRF middleware 在 stateful routes 開啟，stateless API routes（`/api/*`）關閉
- **回應 envelope**：避免過度包裝；資源回應直接是物件 / 陣列；錯誤遵循 RFC 7807

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach**：**Platform MVP**——目標不是解一個業務問題，而是建立「**未來所有專案能 fork 的可重用骨架**」。MVP 完成等於擁有一份能反覆使用的全棧地基。

**Validated learning 路徑**：MVP 上線本身就是 validation——所有冷門路線（JWT / 自寫 compose / 獨立 SPA）能整合可運作，路線可行性自然證實；後續 AI 階段才是「能不能套上業務」的真正試煉。

**Resource Requirements**：

- 團隊：1 人（開發者本人）
- 投入時數：不設限（隨興，依生活節奏）
- 完成時程目標：W4（一個月內），含 W0 spike + 4 週執行 + W3 末 stop-loss 決策點

### MVP Feature Set（Phase 1，W0–W4）

**Core User Journeys Supported**：

- Journey 1（Member 註冊到上手）
- Journey 2（Token 過期與 Recovery）
- Journey 3（Admin 管理會員與角色）
- Journey 4（Developer Fork 起新專案）

**Must-Have Capabilities**（與 Journey Requirements Summary 一致）：

- 認證：註冊 / Email log 驗證 / 登入 / 登出 / 密碼重設
- Token：JWT access (in-memory) + refresh (httpOnly cookie) + rotation + DB jti blacklist
- 前端攔截器：401 靜默 refresh + return URL + retry 上限 1
- 會員端：Profile CRUD + 密碼變更
- Admin 端：會員列表（search/pagination/sort） + 停權 + 改密碼 + 指派角色
- RBAC：admin / editor / member 三角色 + Policy / Gate + 選單差異化
- Audit log：停權 / 改角色 / 改密碼三類敏感操作寫入 + 查詢介面
- Spatie cache invalidation 自動化
- 基礎設施：自寫 docker-compose（dev/prod 都走 nginx 反代到 8080）+ seeders auto-run
- 開發體驗：`bin/new-project.sh` + Domain 邊界（Auth vs Member） + ADR ≥ 5 + README quickstart
- 文件：Scribe + JWT bearer try-it-out
- 測試：Pest + Vitest 各 ≥ 60% + 關鍵路徑必測清單全綠

**MVP OUT（明確排除）**：任何 AI 功能、真實 SMTP、線上 deploy、CI/CD、Queue / Reverb / Horizon、i18n、Redis、E2E（Playwright）、任何業務功能（CMS / 訂單 / billing 等）

**Stop-Loss（W3 末強制決策點）**：

- 驗收場景未達 5/7 → 自動砍 Audit log + Scribe 到第二階段
- 保留 auth / RBAC / Docker / 雙端 / 三角色作為 MVP 收斂版本
- W4 重構 timebox ≤ 3 天，超時直接進第二階段

### Post-MVP Features

**Phase 2（AI 後台，優先序明確）**：

| 優先 | 模組 | 依賴 |
|---|---|---|
| **P0** | **RAG（pgvector）** | MVP 階段已預留 PG schema |
| P1 | Agent / Tool use + MCP server | 依賴 P0 RAG 的 embedding 基礎設施 |
| P1 | LLM Chat 介面 | 獨立可開發 |
| P2 | 內容輔助（改文案 / 摘要 / 翻譯） | 依賴 LLM 整合骨架 |
| P2 | NL → SQL 資料分析 | 需 guardrail，留最後做 |

Phase 2 同步引入：線上 deploy、E2E（Playwright）、CI/CD（GitHub Actions）、Queue / Job（Horizon）、Real-time（Reverb）。

**Phase 3（Vision，兩到三年）**：

- 累積三次以上 fork 的多 side project 使用驗證
- 公開 repo + 小範圍社群參考（不承諾維護）
- 個人「全棧 + AI 履歷」portfolio 完整成形

### Risk Mitigation Strategy

詳細風險矩陣見 [Domain-Specific Requirements > 風險 Mitigations]。摘要：

- **Technical Risks**：W0 spike 提前驗證最大未知數（shadcn-admin + TanStack Router + JWT 攔截器、Windows + Docker volume / line ending）
- **Market Risks**：不適用（非商業專案）
- **Resource Risks**：Stop-Loss（W3 末檢核 5/7）防止 scope creep；個人專案無外部 deadline，但設內部 timebox 防無限延期
- **Path-of-least-resistance 風險**：明確列 Anti-Patterns 防止為求快妥協 token 儲存或散撒 `hasRole()`

## Functional Requirements

**Capability Contract**：本節列出 MVP 必須具備的所有 capabilities。後續 UX 設計、Architecture、Epic / Story 拆解都只實作這裡列的；未列入則不會存在於最終產品。

> **Disclaimer（technical starter kit 性質）**：本 PRD 為 technical starter kit。FR 中提及的技術元件（Docker stack、JWT token 結構、`spatie/laravel-permission`、Scribe、`bin/new-project.sh` 等）**屬於產品能力的必要描述，是 product surface 而非實作 leakage**。下游 Architecture 階段會繼續細化各元件的具體版本、配置與設計。

### Authentication & Identity

- **FR1**：Visitor 可使用 email 與密碼註冊新帳號
- **FR2**：System 在註冊成功時可發出單次使用、有期限的 email 驗證 token（MVP 階段寫入 log；TTL 與單次使用規則見 NFR11）
- **FR3**：未驗證使用者可以使用有效 token 完成 email 驗證
- **FR4**：已驗證使用者可使用 email 與密碼登入
- **FR5**：已認證使用者可登出，撤銷當前 session 的 refresh token
- **FR6**：使用者可請求密碼重設連結（MVP 階段寫入 log）
- **FR7**：使用者可使用有效的單次重設 token 完成密碼重設
- **FR8**：已認證使用者可變更自己的密碼（需以舊密碼確認）

### Session & Token Management

- **FR9**：System 可發行短時效 access token，前端只能存於記憶體（不可持久化儲存）
- **FR10**：System 可發行 refresh token 並以 httpOnly cookie 遞送
- **FR11**：Client 可在 access token 過期時靜默 refresh 並重發原請求
- **FR12**：System 可在每次 refresh 時 rotation（核發新 jti 與新 token，舊 jti 立即撤銷）
- **FR13**：System 可維護 token 撤銷清單（jti blacklist），讓 refresh token 在自然過期前可被撤銷
- **FR14**：Client 可在 refresh 失敗時優雅降級（達重試門檻或連續失敗 3 次後強制登出並保留 return URL）

### User Profile

- **FR15**：已認證使用者可檢視自己的 profile
- **FR16**：已認證使用者可更新自己 profile 中的可編輯欄位（如姓名）

### Member Administration

- **FR17**：Admin 可列出會員，支援搜尋、分頁、排序
- **FR18**：Admin 可停權會員帳號（soft，可回復）
- **FR19**：Admin 可恢復先前被停權的會員
- **FR20**：Admin 可代會員重設密碼

### Role & Permission Management

- **FR21**：System 支援三個預設角色：admin、editor、member
- **FR22**：Admin 可為會員指派一個或多個角色
- **FR23**：System 在每個受保護 API endpoint 與 UI 路由上強制角色 / 權限檢查
- **FR24**：System 在角色或權限變更後自動失效化權限快取（spatie cache reset）
- **FR25**：已認證使用者只看得到自己角色允許的選單項目與頁面

### Audit Logging

- **FR26**：System 對每筆會員停權 / 恢復、角色變更、admin 代改密碼操作寫入 audit log
- **FR27**：每筆 audit 紀錄記載 actor、action、target、timestamp 與上下文 metadata
- **FR28**：Admin 可瀏覽 audit log，支援篩選與分頁

### Developer Experience (Fork & Onboarding)

- **FR29**：Developer 可用單一 `docker compose up` 指令啟動 nginx、php-fpm、postgres、node 四個容器並接通網路
- **FR30**：System 在首次啟動時自動執行 seeders，產出三個預設角色與一個初始 admin 帳號
- **FR31**：Developer 可執行 `bin/new-project.sh` 將本 starter fork 為新專案，互動式重新命名 namespace、port、DB、git remote
- **FR32**：`bin/new-project.sh` 是冪等的（重複執行不會錯誤）
- **FR33**：Repository 包含 ≥ 5 篇 ADR 於 `docs/decisions/`，記錄核心技術選擇的脈絡
- **FR34**：Repository README 提供 30 秒 quickstart 與「踩坑」清單

### API Documentation

- **FR35**：System 在執行 stack 內提供自動生成的 API 文件（路徑 `/api/docs`）
- **FR36**：API 文件支援以 JWT bearer 完成互動式 try-it-out
- **FR37**：System 可在 release 時匯出 OpenAPI JSON 至 `docs/api/openapi.json`

### Module Boundary Constraint

- **FR38**：Codebase 將 auth 框架（`app/Domain/Auth/`、`src/features/auth/`）與範例業務（`app/Domain/Member/`、`src/features/members/`）分離至獨立 namespace；範例業務可被整段刪除而不破壞 auth 框架

## Non-Functional Requirements

僅列**對本案有意義**的類別（Scalability / Integration / Reliability 在 MVP 階段不適用，故略）。

### Performance

- **NFR1**：前端首次有意義繪製（FCP）≤ 1.5s（本機 docker，Chrome 最新版，M1 等級或同等硬體）
- **NFR2**：前端初始 JS bundle（gzipped）≤ 250 KB
- **NFR3**：API 非 AI endpoints p95 回應時間 ≤ 300 ms（本機 docker）
- **NFR4**：TanStack Query 預設 `staleTime` ≥ 30s 以降低重複請求

### Security

- **NFR5**：Access token TTL ≤ 15 分鐘
- **NFR6**：Refresh token TTL ≤ 7 天，每次使用必 rotation
- **NFR7**：密碼使用 bcrypt hashing，cost ≥ 12
- **NFR8**：所有 API 回應夾帶安全標頭：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`
- **NFR9**：Rate limits：
  - 認證 endpoints（login / register / refresh / password reset）每 IP 每分鐘 10 次
  - 一般受保護 endpoints 每使用者每分鐘 60 次
- **NFR10**：Audit log 記錄為 append-only；寫入後不可 UPDATE / DELETE
- **NFR11**：Email 驗證 token 與密碼重設 token 均為單次使用 + ≤ 24 小時過期

### Accessibility

- **NFR12**：所有會員與 admin 端頁面遵循 WCAG 2.1 Level AA
- **NFR13**：所有互動元件支援完整鍵盤導航（Tab / Shift+Tab / Enter / Space / Esc）
- **NFR14**：本文與背景對比度 ≥ 4.5:1（shadcn/ui + Radix 預設已符合，須驗證自訂主題不破壞）

### Testability

- **NFR15**：Pest line coverage ≥ 60%，排除 `database/migrations`、`app/Console`、cached route 檔
- **NFR16**：Vitest line coverage ≥ 60%，排除生成的 route 檔
- **NFR17**：關鍵路徑必測清單（`auth/register → verify → login`、`refresh rotation + blacklist`、`RBAC middleware + Policy`、`audit log` 寫入）每次測試執行必須 100% 通過

### Maintainability & Documentation

- **NFR18**：Repository 包含至少 5 篇 ADR，涵蓋：JWT vs Sanctum、自寫 docker-compose vs Sail、PostgreSQL vs MySQL、RBAC 套件選擇（spatie/laravel-permission）、token 儲存策略
- **NFR19**：README 的 quickstart 段落字數 ≤ 200 字（不含 Docker pull 與 build 時間）

### Reusability

- **NFR20**：首次使用 `bin/new-project.sh` fork 起新專案，從 `git clone` 到「可寫第一行業務 controller」的 wall-clock 時間 ≤ 2 小時
