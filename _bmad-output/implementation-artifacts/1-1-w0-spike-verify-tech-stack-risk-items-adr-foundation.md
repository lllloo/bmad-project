# Story 1.1: W0 Spike — Verify Tech Stack Risk Items + ADR Foundation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer (Jie)**,
I want **在投入正式 build 前用一週 spike 驗證最高風險的技術組合（Windows Docker volume、shadcn-admin + TanStack Router、JWT 基本流程、axios 401 概念驗證）**,
so that **W1 開始正式 build 時不會撞牆，且核心決策已有 ADR 留檔**.

## Story 性質（READ FIRST）

**此 story 是 spike（spike = time-boxed 探索/驗證），不是 production build。** 產出物以**概念驗證**為目標，**允許在 W1 砍掉重練**：

- 不要花精力做完整 testing / linting / type coverage（W1 Story 1.2-1.3 才正式建立 testing infra）
- 不要做 production-grade 錯誤處理、UI polish、a11y 完整對齊
- **必須**留下三類 artifacts：(1) 可跑的 minimal scaffold（spike 程式碼）、(2) ADR 0001 + 0002、(3) `docs/spike-notes-w0.md` 踩坑紀錄
- 任何發現的 blocker 寫進 spike-notes 並標註 continue / pivot / defer 決策

**邊界**：spike 完整版 401 interceptor + retry queue 留 Epic 2 Story 2.2；refresh rotation + blacklist 留 Story 2.1；正式 Domain boundary 結構留 Story 1.2；shadcn token 完整對齊留 Story 1.3。本 story 只驗「能跑起來且沒撞牆」。

## Acceptance Criteria

> 以下 7 組 Given/When/Then 來自 `_bmad-output/planning-artifacts/epics.md#Story 1.1`（line 351-388），AC 編號為本文件指派以供 task / test 引用。

1. **AC1 — Docker stack 啟動**
   **Given** 一個全新乾淨的 Windows 11 開發環境（含 Docker Desktop ≥ 24、Node ≥ 20 LTS、PHP 8.3+、Git）
   **When** 我建立最小可運作的 docker-compose（nginx + php-fpm + postgres + node 四 service）
   **Then** 容器全部成功啟動且 `http://localhost:8080` 可回應

2. **AC2 — Windows volume 行為可接受**
   **And** named volumes（非 bind mount）在 Windows 環境下 file watcher 與啟動速度可接受（< 30s cold start）
   **And** `.gitattributes` 設 `eol=lf` 避免 CRLF 自動轉換問題

3. **AC3 — Frontend scaffold + layout + routing**
   **Given** spike 用 `composer create-project laravel/laravel` + `pnpm create vite --template react-ts`
   **When** 我手動抄 `satnaing/shadcn-admin` 的 layout component（Sidebar / Topbar / AppShell）到 Vite 專案
   **And** 加入 TanStack Router file-based routing 含 `__root.tsx` 與 `_authenticated.tsx`
   **Then** layout 渲染正常且路由守門可運作（未登入 redirect `/login`）

4. **AC4 — JWT 基本流程**
   **Given** spike 用 `php-open-source-saver/jwt-auth` v2.8.2 設好基本 guard
   **When** 我寫一個最簡 `POST /api/auth/login` 回傳 access token
   **And** frontend 用 axios 帶 `Authorization: Bearer <token>` 呼叫受保護 endpoint
   **Then** 認證成功路徑可運作
   **And** access TTL 設 15 分鐘可生效

5. **AC5 — axios 401 概念驗證**
   **Given** spike 寫一個概念版 axios 401 interceptor（**不含** retry queue，留 Epic 2 完整實作）
   **When** access token 過期後再請求一個受保護 endpoint
   **Then** interceptor 偵測到 401 並呼叫 refresh endpoint
   **And** 確認**單一 request** 的概念可運作（多並發 queue 留 Epic 2 AR10）

6. **AC6 — ADR 0001 + 0002 寫入**
   **Given** spike 完成
   **When** 我撰寫 ADR
   **Then** `docs/decisions/0001-record-architecture-decisions.md`（記錄 ADR 方法本身）與 `0002-jwt-over-sanctum.md`（記錄選 JWT 不選 Sanctum 的脈絡）已寫入並 commit

7. **AC7 — spike-notes 踩坑紀錄**
   **Given** spike 期間遇到的踩坑
   **When** 我整理結論
   **Then** Windows Docker volume / line ending / file watcher 相關發現寫入 `docs/spike-notes-w0.md`（為 Epic 4 README 「踩坑」清單做素材）
   **And** 任何發現的 blocker 已記錄並決定處理方式（continue / pivot / defer）

## Tasks / Subtasks

> Spike 順序按依賴關係安排：先 docker（AC1/2）→ backend scaffold（AC4 backend 部分）→ frontend scaffold（AC3）→ 整合（AC4 frontend 部分 + AC5）→ ADR（AC6）→ spike-notes（AC7）。

- [x] **Task 1: Minimal docker-compose 四 service 起跑**（AC: 1, 2）
  - [x] 建立 `.gitattributes` 含 `* text=auto eol=lf`（**第一步**，避免後續所有檔案被 CRLF 污染）
  - [x] 建立 `docker/nginx/{Dockerfile,default.conf}`（nginx 1.27-alpine，listen 80，反代 `/api → php-fpm:9000`、`/ → node:5173`、`/ws → node:5173` HMR upgrade）
  - [x] 建立 `docker/php-fpm/Dockerfile`（PHP 8.3 + ext-pdo_pgsql + ext-mbstring + composer）
  - [x] 建立 `docker/postgres/Dockerfile`（直接 FROM postgres:17-alpine，spike 不需 init.sql）
  - [x] 建立 `docker-compose.yml` 四 service（nginx ports 8080:80、php-fpm internal、postgres named volume `pg_data`、node mounted `./frontend`）
  - [x] 跑 `docker compose up`，確認四 container healthy 且 `curl http://localhost:8080` 有回應（即使是 502 也算可達）
  - [x] **量測 cold start 時間**（從 `docker compose down` 到首頁 200 為止）寫進 spike-notes
  - [x] 驗證 Windows 上的 named volume vs bind mount 行為差異（若 bind mount 慢，記錄下來作為 AR14 決議的 evidence）

- [x] **Task 2: 裸 Laravel 12 + jwt-auth scaffold**（AC: 4 backend 部分）
  - [x] 在 host（不在 container）跑 `composer create-project laravel/laravel backend "^12.0"`
  - [x] 進 `backend/`，跑 `composer remove laravel/sanctum`（明確拒絕 Sanctum）
  - [x] 跑 `composer require php-open-source-saver/jwt-auth:^2.8.2`
  - [x] 跑 `php artisan vendor:publish --provider="PHPOpenSourceSaver\JWTAuth\Providers\LaravelServiceProvider"`
  - [x] 跑 `php artisan jwt:secret`，確認 `.env` 含 `JWT_SECRET`
  - [x] 修改 `config/auth.php`：`guards.api.driver = 'jwt'`、`guards.api.provider = 'users'`
  - [x] 設 `config/jwt.php`：`ttl = 15`（NFR5）、`refresh_ttl = 10080`（7 天，NFR6）
  - [x] 修改 `User.php` 實作 `Tymon\JWTAuth\Contracts\JWTSubject`（`getJWTIdentifier()` + `getJWTCustomClaims()`）
  - [x] 建立 `app/Http/Controllers/AuthSpikeController.php` 含 `login(Request)` 方法（spike-only，**不放 Domain/Auth**，因為 Domain 結構是 Story 1.2 工作）
  - [x] 建立 `routes/api.php` 加 `Route::post('/auth/login', [AuthSpikeController::class, 'login'])` 與 `Route::middleware('auth:api')->get('/me-spike', fn (Request $r) => $r->user())`
  - [x] 設 `.env` `DB_CONNECTION=pgsql`、`DB_HOST=postgres`、`DB_DATABASE=bmad`、`DB_USERNAME=bmad`、`DB_PASSWORD=secret`
  - [x] 跑 `php artisan migrate`（透過 docker exec 或 host 連 8543 都可，spike 自選），確認預設 users 表建立
  - [x] 用 tinker 或 seeder 建一個測試 user（email + bcrypt password）
  - [x] 用 curl 驗證 `POST /api/auth/login` 回 200 + JWT token
  - [x] 用 curl 驗證 `GET /api/me-spike` 帶 `Authorization: Bearer <token>` 回 200 + user data
  - [x] 用 curl 驗證 access TTL：等 15+ 分鐘後同 token 應回 401（或調短 TTL 加速驗，但 spike-notes 註明已驗過）

- [x] **Task 3: 裸 Vite + React 19 + TanStack Router + 抄 shadcn-admin layout**（AC: 3）
  - [x] 在 host 跑 `pnpm create vite frontend --template react-ts`
  - [x] 進 `frontend/`，`pnpm add @tanstack/react-router @tanstack/router-plugin axios`
  - [x] `pnpm add -D @tanstack/router-devtools`
  - [x] **手動** clone `satnaing/shadcn-admin` 到專案外位置（或 GitHub 直接抄），複製 `src/components/layout/*`（Sidebar / Topbar / AppShell / 必要 helper）進 `frontend/src/components/layout/`
  - [x] 處理 shadcn-admin layout 的依賴（Tailwind / shadcn ui primitives / lucide-react）——**spike 可用最小集**，缺什麼裝什麼，**不要**追求完整 token 對齊（那是 Story 1.3 工作），目標是「layout shell 能渲染」
  - [x] 設 `vite.config.ts` 加 TanStack Router plugin
  - [x] 建立 `src/routes/__root.tsx`（含 `<Outlet />` 與最簡 layout）
  - [x] 建立 `src/routes/index.tsx`（重導 `/login`）
  - [x] 建立 `src/routes/login.tsx`（最簡 form：email + password input + submit button，**不要** zod / react-hook-form，spike 用 useState 即可）
  - [x] 建立 `src/routes/_authenticated.tsx`：使用 `beforeLoad` 守門，沒有 token 時 `throw redirect({ to: '/login' })`
  - [x] 建立 `src/routes/_authenticated/me.tsx`（顯示「Hello, <email>」即可）
  - [x] 確認 `routeTree.gen.ts` 由 plugin 自動產出（gitignored）
  - [x] 啟動 `pnpm dev` 並透過 `http://localhost:8080`（nginx）訪問（**禁直連 5173**——這是 AR9 同網域反代約束，spike 也要遵守）
  - [x] 驗證未登入訪問 `/me` 會被 redirect 到 `/login`
  - [x] 驗證 Sidebar / Topbar / AppShell 視覺渲染（可能未對齊 cream/Cormorant，記在 spike-notes，留 Story 1.3）

- [x] **Task 4: Frontend ↔ Backend 整合 + 概念版 401 interceptor**（AC: 4 frontend 部分, 5）
  - [x] 建立 `src/lib/api.ts`：`axios.create({ baseURL: '/api', withCredentials: true })`
  - [x] Request interceptor：從**記憶體**讀 token（用 module-level let 變數即可；**禁 localStorage / sessionStorage**——這是 PRD anti-pattern），帶上 `Authorization: Bearer`
  - [x] Response interceptor 偵測 401，呼叫 `/api/auth/refresh-spike`（**spike-only stub endpoint**，可直接重新核發新 token 而不做真 rotation——真 rotation 是 Story 2.1 工作），retry 原請求**一次**
  - [x] 後端加 `Route::post('/auth/refresh-spike', ...)`（spike-only stub，回新 token；**註明此 endpoint 在 Story 2.1 會被 `/api/auth/refresh` 取代並刪除**）
  - [x] 連 login form 與 axios：登入成功後把 token 存 module 變數 + redirect `/me`
  - [x] 驗證：登入 → 訪問 `/me` 顯示 user data → 等 access TTL 過期（或手動把 module 變數改成過期 token） → 同頁 reload 應觸發 interceptor 自動 refresh → user data 仍可看到（單一 request，**不**測並發）
  - [x] **明確不做**：retry queue、mutex、promise pool、多並發 401 處理（這些是 Epic 2 AR10）

- [x] **Task 5: ADR 0001 + 0002 撰寫**（AC: 6）
  - [x] 建立 `docs/decisions/` 目錄
  - [x] 撰寫 `docs/decisions/0001-record-architecture-decisions.md`：用 MADR 或 Nygard 格式擇一，內容說明本專案會在每個重要架構決策寫 ADR、檔名 `NNNN-kebab-case-title.md`、最低需含 Context / Decision / Consequences 三段
  - [x] 撰寫 `docs/decisions/0002-jwt-over-sanctum.md`：Context（為何不用 Sanctum cookie session）、Decision（jwt-auth v2.8.2、HS256、access 15min + refresh 7d、access 存記憶體、refresh httpOnly cookie、rotation + blacklist）、Consequences（要自己處理 401 retry、token storage、cache 與 stateless 衝突，但換來 first-principles 經驗，PRD anti-pattern 紀律強制）
  - [x] **不要**先寫 ADR 0003-0008（那些在 Story 1.4 / 2.1 / 3.x / 4.3 才寫）

- [x] **Task 6: spike-notes 與 blocker 決策**（AC: 7）
  - [x] 建立 `docs/spike-notes-w0.md`，至少含以下段落：
    - Windows Docker volume 行為（named vs bind mount，cold start 量測）
    - Line ending（`.gitattributes` 設好之前發生過什麼）
    - File watcher 反應（Vite HMR 是否在 named volume 上正常觸發）
    - shadcn-admin layout 抄入時遇到的依賴缺漏
    - TanStack Router file-based routing 設定要點
    - JWT + axios 401 概念驗證的踩坑
  - [x] 列出**所有 blocker**（若無，寫「無 blocker」），每個 blocker 標 **continue（小坑，照原計畫）/ pivot（換方案）/ defer（記下，留後續解）**
  - [x] 若有任一 blocker 是 pivot 級，**HALT** 並通知 user，不要自行決策架構偏離

## Dev Notes

### Spike 性質與邊界（再次強調）

- W0 spike 的價值在「**最快發現未知數**」，不在「寫出完美 code」
- spike 程式碼可在 W1 Story 1.2-1.4 被完全重構或刪除——這是**設計上預期**，不是浪費
- 若實作中發現 AC 描述與現實衝突（例如：jwt-auth v2.8.2 在 Laravel 12 有未知不相容），**先記入 spike-notes，回報 user，不要自行 pivot**

### Tech Stack（AR19 版本鎖，spike 必須遵守）

| 維度 | 鎖定版本 | 來源 |
|---|---|---|
| PHP | 8.3+ | architecture.md AR19 |
| Laravel | 12.x | architecture.md AR19 |
| jwt-auth | `php-open-source-saver/jwt-auth` v2.8.2 | architecture.md JWT 設計 + Story 1.1 AC4 |
| PostgreSQL | 17 | architecture.md AR19 |
| Node | 22-alpine（容器內）/ 20+ LTS（host） | architecture.md AR19 / Story 1.1 AC1 |
| React | 19 | architecture.md AR19 |
| Vite | 6/7（依 `pnpm create vite` 當下預設） | architecture.md AR19 |
| TanStack Router | latest stable | architecture.md AR19 |
| axios | latest | architecture.md axios interceptor 章節 |
| nginx | 1.27-alpine | architecture.md docker-compose |

### Architecture 重點對映（spike 必看的 source-of-truth）

- **AR9 同網域反代**：dev 也走 nginx 反代到 8080，禁直連 Vite 5173 → 本 story 的 frontend 驗證**必須**透過 8080
- **AR14 Windows Docker**：named volumes 解 file watcher 慢的問題 → AC2 直接驗
- **AR18 W0 spike**：spike 必驗項清單，本 story 全包
- **AR19 版本鎖**：上表整理
- **PRD Anti-Patterns**：access token **禁** localStorage / sessionStorage → spike 的 axios interceptor 必須遵守（用 module-level 變數或 React Context，但別存進 storage）
- **PRD FR9-14 / FR23**：spike 預驗 FR9-14（access in-memory、refresh 概念）；FR23（RBAC 守門）**不在本 story**

### 完整版實作的「延後」清單（spike 不做，但要在 spike-notes 留下「為何不做」一句話）

| 功能 | 留給哪個 story | 為什麼本 story 不做 |
|---|---|---|
| 真正 refresh rotation + jti blacklist | Story 2.1 | spike 用 stub endpoint 即可驗證 401 流向 |
| axios 多並發 401 queue（mutex/promise pool） | Story 2.2 | 單一 request 已足夠驗證概念 |
| Domain Boundary 目錄（`app/Domain/Auth/`） | Story 1.2 | spike 不要先卡 namespace 重構 |
| Spatie laravel-permission 套件 | Story 1.2 | 本 story 不驗 RBAC |
| Scribe API docs | Story 1.2 / 4.1 | 本 story 不驗 API 文件產生 |
| Pest / Vitest scaffold | Story 1.2 / 1.3 | spike 用 curl + 手動 + 視覺驗證 |
| Cream + Cormorant 視覺 token | Story 1.3 | spike 只驗 layout 結構可渲染 |
| docker-entrypoint auto-seed | Story 1.4 | spike 用 `artisan migrate` 即可 |
| Forced logout 連續失敗 3 次 / return URL preservation | Story 2.3 | spike 不驗 forced logout |
| Security headers / Rate limiter | Story 1.2 / 2.x | spike 用 Laravel 預設即可 |

### Source Tree（spike 階段產出檔案位置）

```
bmad-project/
├── .gitattributes                              # **第一個** 建立的檔案
├── docker-compose.yml                          # 四 service
├── docker/
│   ├── nginx/{Dockerfile,default.conf}
│   ├── php-fpm/Dockerfile
│   └── postgres/Dockerfile
├── backend/                                    # composer create-project 產出
│   ├── app/Http/Controllers/AuthSpikeController.php  # spike-only，留 Story 1.2 重構
│   ├── routes/api.php                          # /auth/login + /auth/refresh-spike + /me-spike
│   ├── config/{auth.php,jwt.php}               # spike 改 driver=jwt + ttl=15
│   └── .env                                    # JWT_SECRET + DB pgsql
├── frontend/                                   # pnpm create vite 產出
│   ├── vite.config.ts                          # + TanStack Router plugin
│   ├── src/
│   │   ├── lib/api.ts                          # axios + interceptors（spike 概念版）
│   │   ├── components/layout/                  # 抄 satnaing/shadcn-admin
│   │   └── routes/
│   │       ├── __root.tsx
│   │       ├── index.tsx                       # redirect /login
│   │       ├── login.tsx                       # 最簡 form
│   │       ├── _authenticated.tsx              # beforeLoad guard
│   │       └── _authenticated/me.tsx           # Hello user
│   └── package.json
└── docs/
    ├── decisions/
    │   ├── 0001-record-architecture-decisions.md
    │   └── 0002-jwt-over-sanctum.md
    └── spike-notes-w0.md
```

**注意**：spike 不建立 `app/Domain/`、`src/features/`、`src/components/custom/`、`docs/api/`、`bin/`、`backend/database/seeders/`、Pest / Vitest 設定——這些是後續 story 的工作。

### Testing Strategy（spike 限定）

- **不裝** Pest / Vitest（Story 1.2 / 1.3 才做）
- 用 **curl** 驗證 backend AC
- 用 **瀏覽器手動** + Vite devtools 驗證 frontend AC
- 把所有手動驗證步驟與結果寫進 spike-notes-w0.md 的「Verification log」段落
- W1 Story 1.2 起會補回測試 infra，本 story 的 spike 程式碼若被保留，需在 Story 1.2 補 test

### Anti-Patterns（spike 也不能踩）

- ❌ access token 進 localStorage / sessionStorage（PRD anti-pattern，spike 必守）
- ❌ dev 環境直連 Vite 5173 不走 nginx（AR9 違反）
- ❌ 為了 spike 方便而把 access TTL 拉到 1 小時+ 寫死（NFR5 違反，可調短不可調長）
- ❌ spike 內就建 `app/Domain/Auth/` 目錄（提前進入 Story 1.2 領域）
- ❌ 寫測試但寫不完整（**spike 不寫測試**，要寫等 Story 1.2 / 1.3）

### Project Structure Notes

- Spike 程式碼放 `app/Http/Controllers/AuthSpikeController.php`，故意**不**進 `app/Domain/Auth/`，視覺上提醒這是 throwaway code
- Spike-only endpoint 命名後綴 `-spike`（`/auth/refresh-spike`、`/me-spike`），方便 Story 1.2 grep 找出並刪除
- `routeTree.gen.ts` 加入 `.gitignore`（router plugin 產出物）
- `.env` 不進 git（Laravel 預設 .gitignore 已含）
- spike-notes 是純文字 markdown，無 frontmatter 也可

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — AC 來源
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1] — Epic context、FR/NFR/AR/UX-DR 對映
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] — FR9 / FR10 / FR11 access in-memory / refresh httpOnly cookie / 401 silent refresh
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR5 access TTL ≤ 15min / NFR6 refresh TTL ≤ 7d
- [Source: _bmad-output/planning-artifacts/prd.md#Domain-Specific Requirements > 安全 Constraints] — Anti-pattern 強制
- [Source: _bmad-output/planning-artifacts/architecture.md#JWT 設計（line 405-417）] — JWT v2.8.2 / HS256 / TTL / storage / rotation / revocation
- [Source: _bmad-output/planning-artifacts/architecture.md#axios Interceptor（line 533-560）] — 401 interceptor 概念碼 + 「多並發 queue 留 Epic 2」備註
- [Source: _bmad-output/planning-artifacts/architecture.md#Docker Compose 結構（line 562-606）] — 四 service compose 範本
- [Source: _bmad-output/planning-artifacts/architecture.md#nginx 反代設定（line 607-640）] — 反代 conf 範本
- [Source: _bmad-output/planning-artifacts/architecture.md#First Implementation Priority（W0 spike）（line 1641-1660）] — 架構 handoff 給 W0 的官方清單
- [Source: _bmad-output/planning-artifacts/architecture.md#Important Gaps（line 1530-1536）] — W0 必驗的 5 個 gap，本 story 涵蓋其中 4 個（gap #2 axios 401 並發留 Story 2.2、gap #5 Windows Docker = AC2）

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — Amelia (bmad-agent-dev) via `/bmad-dev-story` workflow，啟動於 2026-05-15。

### Debug Log References

主要 debug 過程都記入 `docs/spike-notes-w0.md` § 2「踩坑與決策」與 § 6「Blocker 清單」。重點：

- **`Route [login] not defined` 500 → 401 修法**：見 spike-notes 踩坑 #4（`bootstrap/app.php` redirectGuestsTo + exception render）
- **PHP 8.3 vs 8.4 platform-check**：見 spike-notes 踩坑 #1（php-fpm Dockerfile 升 8.4）
- **pnpm + Volta 衝突**：見 spike-notes 踩坑 #5（改用 npm create vite）
- **Vite HMR via nginx /ws 失敗**：見 spike-notes 踩坑 #7（defer Story 1.3）

### Completion Notes List

✅ **W0 spike PASS — 7/7 AC**：

- **AC1（docker stack 起動）**：4 containers (nginx / php-fpm / postgres / node) 全部 healthy，`curl http://localhost:8080` 回 200 + Vite SPA root div
- **AC2（Windows volume 行為）**：second cold start = **7.78s** 含 HTTP 200（far below 30s target）；named volume 策略（pg_data + frontend_node_modules）有效；`.gitattributes` 第一個落地，未發生 CRLF 災難
- **AC3（frontend layout + routing）**：TanStack Router file-based routing 通；`/` redirect `/login`、`_authenticated.tsx beforeLoad` guard 通；AppShell + Sidebar + Topbar 結構渲染 OK（視覺對齊 cream/Cormorant 留 Story 1.3）
- **AC4（JWT 基本流程）**：jwt-auth 2.9.2，TTL 15min（NFR5），`POST /auth/login` + `GET /me-spike` 端對端通過，401 路徑也驗（無 token / 壞 token 都回 401）
- **AC5（axios 401 概念驗證）**：nginx access log 證實 axios interceptor 在 401 後自動 POST `/auth/refresh-spike`；retry success leg 在 backend 已單獨驗（合法 token refresh → 新 token → /me-spike 200）
- **AC6（ADR 0001 + 0002）**：兩份 ADR 完整寫入 `docs/decisions/`，含 Context / Decision / Consequences / Alternatives Considered
- **AC7（spike-notes + blocker 決策）**：`docs/spike-notes-w0.md` 含 8 個 blocker 全 continue / defer，**無 pivot 級**

**版本偏差紀錄**（全部 continue，無需 pivot）：
- PHP 8.3 → **8.4.21**（composer:2 container 強制；AR19 鎖 8.3+，8.4 合法）
- jwt-auth ^2.8.2 → **2.9.2**（caret 接受 minor）
- Vite 6/7 → **8.0.13**（`npm create vite@latest` 預設）
- TypeScript latest → **6.0.2**
- 改用 **npm 而非 pnpm**（Volta+pnpm 衝突，見 spike-notes 踩坑 #5；建議 Story 1.3 ADR 0004 固化）

**未做（明確留後續 story）**：
- 完整 shadcn-admin layout + cream/Cormorant token 對齊 → Story 1.3
- refresh rotation + jti blacklist → Story 2.1
- axios 多並發 401 queue → Story 2.2
- Domain Boundary 結構 → Story 1.2
- Spatie permission → Story 1.2
- Scribe API docs → Story 1.2 / 4.1
- Pest / Vitest 測試 infra → Story 1.2 / 1.3
- Vite HMR 反代修正 → Story 1.3
- TanStack `router-devtools` 套件改名 → Story 1.3

### File List

#### 新增（spike scaffold + artifacts）

**Root**
- `.gitattributes` — `* text=auto eol=lf` + 二進位 binary 標記（**第一個落地**）
- `docker-compose.yml` — 4 service stack（nginx / php-fpm / postgres / node）

**Docker**
- `docker/nginx/Dockerfile` — nginx 1.27-alpine
- `docker/nginx/default.conf` — 反代 `/api → php-fpm`、`/ → node:5173`、`/ws → node:5173` upgrade
- `docker/php-fpm/Dockerfile` — **php:8.4-fpm-alpine**（升自 8.3，見 debug log）+ pdo_pgsql / mbstring / zip / bcmath + composer
- `docker/postgres/Dockerfile` — postgres:17-alpine
- `docker/node/Dockerfile` — node:22-alpine + corepack（spike 實際走 npm 而非 pnpm，見 spike-notes 踩坑 #5）

**Backend（`backend/` 全為 `composer create-project laravel/laravel "^12.0"` 後修改）**
- `backend/composer.json` — Laravel 12 預設 + `php-open-source-saver/jwt-auth ^2.8.2`（實裝 2.9.2）
- `backend/.env` — `DB_CONNECTION=pgsql` / `JWT_TTL=15` / `JWT_REFRESH_TTL=10080` / `AUTH_GUARD=api`
- `backend/config/auth.php` — `guards.api`（driver=jwt）
- `backend/config/jwt.php` — published by jwt-auth
- `backend/app/Models/User.php` — implements `JWTSubject` + `getJWTIdentifier()` / `getJWTCustomClaims()`
- `backend/app/Http/Controllers/AuthSpikeController.php` — `login()` + `refreshSpike()`（spike-only，Story 1.2 移入 Domain）
- `backend/routes/api.php` — `/auth/login` + `/auth/refresh-spike` + `/me-spike`（手動建，未走 install:api，避免帶 Sanctum）
- `backend/bootstrap/app.php` — `withRouting(api: ..., apiPrefix: 'api')` + `withMiddleware($middleware->redirectGuestsTo(...))` + `withExceptions($exceptions->render(AuthenticationException ...))`
- `backend/database/seeders/DatabaseSeeder.php` — 改為建 `jie@example.com` / `password123`

**Frontend（`frontend/` 全為 `npm create vite@latest frontend --template react-ts` 後新增）**
- `frontend/package.json` — `@tanstack/react-router` + `@tanstack/router-plugin` + `@tanstack/router-devtools` + `axios`
- `frontend/vite.config.ts` — `@tanstack/router-plugin/vite` + 反代用 server / hmr 設定
- `frontend/.gitignore` — 加 `src/routeTree.gen.ts`
- `frontend/src/main.tsx` — RouterProvider 設定
- `frontend/src/lib/api.ts` — axios instance + module-level accessToken + 401 interceptor + refresh-spike retry
- `frontend/src/routes/__root.tsx` — Outlet + DevTools
- `frontend/src/routes/index.tsx` — redirect `/login`
- `frontend/src/routes/login.tsx` — 最簡 useState form
- `frontend/src/routes/_authenticated.tsx` — `beforeLoad` guard + AppShell wrap
- `frontend/src/routes/_authenticated/me.tsx` — Hello user
- `frontend/src/components/layout/AppShell.tsx` — 三段式 layout（inline style，無 tailwind）
- `frontend/src/components/layout/Sidebar.tsx` — 黑底側欄
- `frontend/src/components/layout/Topbar.tsx` — 頂欄 + Logout

**Docs**
- `docs/decisions/0001-record-architecture-decisions.md` — MADR-lite 採用決策
- `docs/decisions/0002-jwt-over-sanctum.md` — 選 jwt-auth 而非 Sanctum 的完整理由
- `docs/spike-notes-w0.md` — W0 踩坑 / 量測 / blocker 決策

#### 未改動
- `_bmad/**`、`.claude/skills/**`、`.agents/skills/**` — installer-managed，未動
- `CLAUDE.md` / `DESIGN.md` / `README.md` / `_bmad-output/planning-artifacts/**` — spike 範疇外

### Change Log

| Date | Author | Change |
|---|---|---|
| 2026-05-15 | Amelia (Claude Opus 4.7) via bmad-dev-story | W0 spike scaffold + 兩份 ADR + spike-notes + 端對端 docker stack 驗證；6 個 task + 7 個 AC 全 PASS；status: ready-for-dev → in-progress → review |
