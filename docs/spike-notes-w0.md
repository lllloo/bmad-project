# W0 Spike Notes — 2026 W19

> **目的**：記錄 W0 spike 期間驗證 Docker / Laravel 12 + jwt-auth / Vite + React 19 + TanStack Router / axios 401 interceptor 的踩坑、量測、blocker 決策。
> **讀者**：Jie 自己（一週後重看）、未來 fork 此 starter 的開發者、Epic 4 README「踩坑清單」素材來源。
> **參考 Story**：[Story 1.1 W0 Spike](../_bmad-output/implementation-artifacts/1-1-w0-spike-verify-tech-stack-risk-items-adr-foundation.md)

## TL;DR

- **Status**: ✅ **W0 spike PASS** — 全部 7 個 AC 通過、3 個小 blocker 全 continue / defer 等級
- **Decision**: **continue** 進入 W1 Story 1.2 / 1.3 / 1.4，不需要 pivot 架構
- **Major blockers**: 無 pivot 級
- **Stack actually rocked**: 與 AR19 對齊度高，唯 Vite 6/7→8 / PHP 8.3→8.4 / jwt-auth 2.8.2→2.9.2 / TypeScript →6.0.2 都是 minor 偏差（向前升），均 continue

---

## 0. 環境基準（驗證跑出來那台）

| 項目 | 值 |
|---|---|
| OS | Windows 11 Pro（10.0.26200） |
| Docker | Docker Desktop / docker CLI 29.1.3 |
| Node（host） | v22.22.2（透過 Volta 管） |
| pnpm（host） | 8.15.4（standalone，但與 Volta-managed node 互動有問題——見下） |
| PHP（host） | **未安裝**，所有 PHP 工作走 docker container（composer:2 / php-fpm） |
| Composer（host） | 系統有但無 PHP 配對，故 host 上不能用 |
| Git | 2.36.1.windows.1 |

---

## 1. Windows Docker volume 行為

### 量測：cold start 時間

| 條件 | 時間 | 備註 |
|---|---|---|
| 第一次 `docker compose up -d`（first-ever，含 build images + 拉 base images + npm install 進 named volume） | ~70s（含 build） | image build 是大頭 |
| 第二次 cold start：`docker compose down`（保留 volumes） + `docker compose up -d` | **7.6s** | images cached、`frontend_node_modules` named volume cached |
| 第二次 cold start 後到 `http://localhost:8080` 200 | +0.15s（**total 7.78s**） | 遠優於 AC2 < 30s 目標 |
| Vite 啟動到 `ready in` | 888ms | container 內 node 22-alpine |

**結論**：✅ **AC2 達標**——Windows 上以 named volume 為 hot path 的方案運作良好，cold start 7.78s << 30s。第一次 build 慢屬一次性 cost。

### named volume vs bind mount

- `pg_data` → named volume：避免 Windows host 寫 postgres binary 檔的效能災難
- `frontend_node_modules` → named volume：避免 Vite watcher 在 host bind 上的 IO 慢；同時讓 container 內 `npm install` 不污染 host
- `backend/`、`frontend/` 本身走 bind mount（`:cached` flag）：開發要編輯
- 觀察：postgres ready < 5s（migrate 後立即可連），node container 跑完 `npm install` 後 Vite 不到 1s 就 ready。**沒有觀察到 file watcher 災難**——這歸功於 node_modules 走 named volume 而非 host bind。

### `.gitattributes` 與 CRLF

- ✅ Day 1 第一個檔案就建 `.gitattributes` 設 `* text=auto eol=lf`
- 觀察：因為事先設好，spike 期間**沒**踩到任何 CRLF 災難
- 預期若沒先設，最容易出問題的是 `Dockerfile` / `docker/nginx/default.conf` / `*.sh`——這些都 critical to container 啟動

---

## 2. Backend Scaffold（Laravel 12 + jwt-auth）

### 套件版本實鎖

| 套件 | AR19 鎖定 | 實際安裝 | 偏差 / 備註 |
|---|---|---|---|
| `laravel/framework` | ^12.0 | 12.x（composer create-project 預設） | ✅ |
| `php-open-source-saver/jwt-auth` | ^2.8.2 | **2.9.2** | ⚠️ minor 升版（caret 接受），AR19 寫 2.8.2，實裝 2.9.2——continue（套件持續維護是好事） |
| PHP runtime | 8.3+ | **8.4.21** | ⚠️ 升 8.4（見下「踩坑 #1」） |

### 踩坑與決策

#### 踩坑 #1（**重要**）：composer:2 container 預設 PHP 8.4，撞 platform-check

- 症狀：`php-fpm` Dockerfile 我一開始設 `php:8.3-fpm-alpine`，跑 `php artisan migrate` 撞錯：
  ```
  Composer detected issues in your platform: Your Composer dependencies require a PHP version ">= 8.4.0".
  You are running 8.3.31.
  ```
- 原因：composer container 在跑 `create-project` 時用 PHP 8.4 寫 `composer.lock`，platform-check.php 被生成寫死要 8.4+。
- **修法**：把 php-fpm Dockerfile 升 `php:8.4-fpm-alpine`，重 build。AR19 鎖「8.3+」，8.4 合法。
- **未來啟示**：若要強制 8.3，需要 composer container 也指定 8.3（或在 `composer.json` 加 `"config.platform.php"`）。Story 1.2 評估要不要鎖死。

#### 踩坑 #2：Laravel 12 預設**已不含 Sanctum**

- 與 architecture 文件假設不同：Laravel 12 預設 `composer.json` 沒有 `laravel/sanctum`，所以 Task 2「`composer remove laravel/sanctum`」**不必跑**
- 視覺信號仍保留：`composer.json require` 區塊只有 `laravel/framework` 與 `laravel/tinker`（無 sanctum）

#### 踩坑 #3：Laravel 12 不預設 `routes/api.php`

- `composer create-project` 後**沒有** `routes/api.php`——只有 `web.php` / `console.php`
- Laravel 12 預期透過 `php artisan install:api` 加 api route 檔，但**這個指令會夾帶 Sanctum 一起裝**（違反 ADR 0002）
- **修法**：手動建 `routes/api.php`，並在 `bootstrap/app.php` 的 `withRouting()` 加 `api: __DIR__.'/../routes/api.php'` 與 `apiPrefix: 'api'`
- spike-notes 留：Story 1.2 重構 `app/Domain/Auth/` 結構時延續手動 register 模式

#### 踩坑 #4：API endpoint 401 變 500（`Route [login] not defined`）

- 症狀：`/api/me-spike` 沒帶 token 預期回 401，實際回 500（`RouteNotFoundException: Route [login] not defined`）
- 原因：Laravel 11+ `Authenticate` middleware 預設假設有 web `login` named route 可 redirect。API-only 場景沒設 → 拋異常
- **修法**：
  1. `bootstrap/app.php` → `withMiddleware()` 設 `$middleware->redirectGuestsTo(fn (Request $req) => null)`（永遠不 redirect，讓 AuthenticationException 自然拋）
  2. `bootstrap/app.php` → `withExceptions()` 設 `render(AuthenticationException $e, Request $req)` 回 JSON 401（for `is('api/*')` || `expectsJson()`）
- **未來啟示**：fork 此 starter 的人若要加 web login，記得**同時**改 `redirectGuestsTo` callback 與 exception render，否則 web 與 api 行為會打架

### TTL / Guard 設定（最終）

| 設定點 | 值 | 來源 |
|---|---|---|
| `.env JWT_TTL` | 15 | NFR5（access TTL ≤ 15min） |
| `.env JWT_REFRESH_TTL` | 10080 | NFR6（refresh TTL ≤ 7d / 10080 min） |
| `.env JWT_ALGO` | HS256 | jwt-auth 預設 |
| `.env AUTH_GUARD` | api | 改 default guard from web → api |
| `config/auth.php guards.api` | driver=jwt, provider=users | ADR 0002 |

### Spike-only artifacts

- `app/Http/Controllers/AuthSpikeController.php` — `login()` / `refreshSpike()`，故意**不**放 `app/Domain/Auth/`
- `routes/api.php` — 含 `/auth/login`、`/auth/refresh-spike`、`/me-spike`
- `User.php` 加 `implements JWTSubject` + `getJWTIdentifier()` / `getJWTCustomClaims()`
- **Story 1.2 必動作**：把 AuthSpikeController 內容搬入 `app/Domain/Auth/` 並刪除 `-spike` suffix endpoints

---

## 3. Frontend Scaffold（Vite + React 19 + TanStack Router）

### 套件版本實鎖

| 套件 | AR19 鎖定 | 實際安裝 | 偏差 / 備註 |
|---|---|---|---|
| `react` | 19 | 19.2.6 | ✅ |
| `react-dom` | 19 | 19.2.6 | ✅ |
| `vite` | 6/7（pnpm create vite 當下預設） | **8.0.13** | ⚠️ `npm create vite@latest` 在 2026-05-15 預設 Vite 8。AR19 寫 6/7，現實已 8。Vite 8 與 React 19 / TanStack Router 1.169 / @vitejs/plugin-react 6.0 全相容，無問題——continue。AR19 文件 Story 1.3 / 4.3 review 時可更新。 |
| `typescript` | latest | **6.0.2** | ⚠️ TS 6.x 是大版本，需注意。spike 沒啟用 strict 也沒 build，無踩坑。Story 1.3 開 strict + 跑 vue-tsc / tsc -b 時若遇坑記 |
| `@vitejs/plugin-react` | – | 6.0.1 | – |
| `@tanstack/react-router` | latest stable | 1.169.2 | ✅ |
| `@tanstack/router-plugin` | – | 1.167.35 | ✅ |
| `@tanstack/router-devtools` | – | 1.166.13 | ⚠️ **deprecated**——應改用 `@tanstack/react-router-devtools`（見踩坑 #6）。spike 容忍，Story 1.3 切換 |
| `axios` | latest | 1.16.1 | ✅ |

### 踩坑與決策

#### 踩坑 #5（**重要**）：pnpm standalone 與 Volta-managed node 不相容

- 症狀：`pnpm create vite frontend --template react-ts` 報錯：
  ```
  pnpm: not found: node
  ```
- 原因（推測）：pnpm 是 standalone binary（snapshot），用 `which` 找 system node。Volta 把 node 包成 shim 在 `~/AppData/Local/Volta/bin/`，pnpm 的 child-process resolution 不能正確找到。
- **修法**：spike **改用 `npm create vite@latest`**（npm 隨 node 走，無此問題）
- **後續影響**：
  - frontend 的 install / dev 指令統一用 `npm`（package-lock.json 而非 pnpm-lock.yaml）
  - docker-compose `node` service 的 command 也用 `npm install && npm run dev`
  - **Story 1.3 重新評估**：要不要切回 pnpm（解 Volta + pnpm 衝突），或直接以 npm 為 starter 預設（少一個踩坑點）。建議**保持 npm**，理由：fork 此 starter 的人未必裝 Volta + pnpm，npm 是最低門檻
- spike-notes 結論：「**fork-friendly 優先 → 預設 npm**」可寫進 ADR 0003

#### 踩坑 #6：TanStack router-devtools 套件已改名

- 控制台 warning：`[@tanstack/router-devtools] This package has moved to @tanstack/react-router-devtools. Please switch...`
- 影響：spike 沒擋住任何 AC，但 Story 1.3 / 4.x 應改 import 為新名
- **decision**: defer（不在 W0 改）

#### 踩坑 #7：Vite HMR WebSocket through nginx 反代

- 控制台 error：
  ```
  [vite] failed to connect to websocket (Error: WebSocket closed without opened.)
  Error: WebSocket closed without opened.
  ```
- 原因：vite.config.ts 我設 `hmr.path: '/ws'`，但 nginx default.conf 的 `/ws` location 我沒對齊好（Vite client 預期 path 與 server 一致）
- 影響：HMR 在 spike 時**沒運作**——修改 React 元件不會自動 reload，需手動 F5
- **decision**: **defer to Story 1.3** — spike 不阻塞 AC，但 Story 1.3 要修對 HMR proxy（建議方案：把 vite hmr.path 改回預設、nginx 反代純粹接管 `/` 與 `/api` 兩條，WebSocket upgrade 套到 `/` location 即可）

### 路由設計（最終）

```
src/routes/
├── __root.tsx                 # <Outlet /> + DevTools
├── index.tsx                  # `/` redirect → `/login`
├── login.tsx                  # 最簡 useState form
├── _authenticated.tsx         # beforeLoad guard：無 token → /login
└── _authenticated/
    └── me.tsx                 # Hello <email> + JSON dump
```

### shadcn-admin layout 抄入

- **決定**：**spike 不深入抄寫 `satnaing/shadcn-admin` 完整 layout**（含 tailwind config / shadcn primitives / lucide-react / cream/Cormorant token）——那是 Story 1.3 主工作
- spike 寫了**最簡 placeholder** layout（inline style，無 tailwind）：`AppShell / Sidebar / Topbar`，結構模仿 shadcn-admin 三段式
- **結論**：layout 結構可渲染 ✅ AC3 達標。視覺對齊留 Story 1.3。

### Vite dev server via nginx 反代（AR9）

- **僅透過** `http://localhost:8080` 訪問，**禁直連 5173** ✅
- 已驗證：browser GET `http://localhost:8080/` 回 200，含 `<div id="root">`
- HMR WebSocket 失敗（見踩坑 #7）

---

## 4. JWT + axios 401 interceptor（概念驗證）

### 設計（最終）

`frontend/src/lib/api.ts`：
- module-level `let accessToken: string | null = null`（**禁 localStorage**）✅
- `setAccessToken()` / `getAccessToken()` export
- request interceptor: `config.headers.Authorization = 'Bearer ' + accessToken`
- response interceptor: 401 → `axios.post('/api/auth/refresh-spike')` → 取新 token → retry 原 request **一次**
- 避免迴圈：`original._retried` flag、跳過 `/auth/refresh-spike` 與 `/auth/login` 自身的 401
- **不**做：retry queue / mutex / promise pool / 多並發 401 處理（Story 2.2）

### 驗證紀錄（從 nginx access log 證實）

| 步驟 | 結果 |
|---|---|
| `POST /api/auth/login` | 200 + bearer token，expires_in=900s ✅ |
| `GET /api/me-spike` with valid Bearer | 200 + user JSON ✅ |
| `GET /api/me-spike` **無** Authorization | **401**（修 redirectGuestsTo + exception render 後）✅ |
| `GET /api/me-spike` with invalid Bearer | **401** ✅ |
| `POST /api/auth/refresh-spike` with valid Bearer | 200 + 新 token ✅ |
| 新 token 訪問 `/me-spike` | 200 ✅ |
| **frontend 端 E2E**：login → `/me` 顯示 user data | ✅（瀏覽器截圖佐證） |
| **frontend axios 401 interceptor 觸發**：手動 swap fake token → `axios.get('/me-spike')` | nginx log 證實：`401 me-spike → POST refresh-spike` 自動發生 ✅ — interceptor 路徑通 |
| **retry success 路徑**：（grace-fully fail，fake token 的 refresh 也 401）→ 整體 reject | 預期行為（spike 不模擬「真的合法但過期」token，需短 TTL 設定才能完整 E2E）|

**結論**：✅ **AC5 達標** — interceptor 偵測 401 並自動呼叫 refresh-spike 的路徑驗證通過，「retry success」leg 在 backend 已單獨驗（refresh + 新 token → /me-spike → 200）。Story 2.2 完整實作時可寫 e2e 測試覆蓋。

---

## 5. ADR 撰寫狀態

| ADR | 標題 | Status |
|---|---|---|
| 0001 | 採用 ADR 記錄重大架構決策 | ✅ Accepted（W0） |
| 0002 | 採用 JWT 而非 Sanctum | ✅ Accepted（W0） |
| 0003 | docker-compose 結構決策（W0 已 implicit decide，但正式 ADR 留 Story 1.4 寫） | 留 Story 1.4 |
| 0004 | npm vs pnpm 決策（建議 starter 預設 npm） | 留 Story 1.3 |
| 0005 | refresh rotation + jti blacklist 設計 | 留 Story 2.1 |
| 0006 | axios 多並發 401 queue 策略 | 留 Story 2.2 |
| 0007 | Domain Boundary 結構（`app/Domain/Auth/` etc.） | 留 Story 1.2 |
| 0008 | Spatie permission cache 與 JWT stateless 衝突解法 | 留 Story 3.4 |

---

## 6. Blocker 清單

| Blocker | Severity | Decision | 對應行動 |
|---|---|---|---|
| Docker Desktop daemon 未啟動 | Low | **continue** | README quickstart 加「先開 Docker Desktop」（Story 4.3） |
| pnpm standalone 在 Volta-managed node 環境找不到 system node | Low | **defer** | Story 1.3 ADR 0004 評估 pnpm vs npm；建議 starter 鎖 npm |
| Vite 8 / TS 6 高於 AR19 鎖定（6/7 + latest） | Low | **continue** | 升版相容性無問題；AR19 文件 Story 4.3 retro 時更新 |
| composer container 預設 PHP 8.4 與 php-fpm 8.3 衝突 | Low | **continue** | php-fpm 升 8.4，spike 已修；rest 同 AR19 |
| Laravel 12 不預設 routes/api.php，install:api 帶 Sanctum | Low | **continue** | spike 手動建 routes/api.php + bootstrap/app.php 註冊；Story 1.2 沿用 |
| API 401 變 500（`Route [login] not defined`） | Low | **continue** | spike 已修（redirectGuestsTo + exception render）；Story 1.2 把這段抽進 ServiceProvider 或 boot |
| `@tanstack/router-devtools` 已 deprecated 為 `@tanstack/react-router-devtools` | Low | **defer** | Story 1.3 切換套件名 |
| Vite HMR WebSocket 走 nginx /ws 反代失敗 | Medium-Low | **defer** | Story 1.3 把 HMR proxy 設對；spike 期間用 F5 重整即可 |

> ✅ **無 pivot 級 blocker**。W0 spike 結論：架構可走，進入 W1。

---

## 7. 給 Epic 4 README「踩坑」清單的素材

> Story 4.3 README quickstart 可直接搬以下「fork 後第一週踩到的坑」：

1. **Windows 11 必須先啟動 Docker Desktop**——光 `docker` CLI 不會自動 wake daemon
2. **`.gitattributes` 必須是專案第一個 commit 的檔案**（`* text=auto eol=lf`），否則 line ending 災難
3. **若 host node 透過 Volta 管，pnpm standalone 會壞**——starter 預設 npm 避開此坑
4. **Vite 預設版本會比文件鎖定的高**（2026-05 已是 8）——若想固定 Vite 7 需在 `package.json` 寫死
5. **PHP 不必裝在 host**——所有 composer / artisan 都可走 container（`docker run --rm composer:2`）
6. **named volume 對 Windows file watcher 是必須**——bind mount node_modules 會死
7. **Laravel 12 預設不含 Sanctum 也不建 routes/api.php**——starter 提供手動範本（在 `bootstrap/app.php` 註冊）
8. **`composer:2` container 用 PHP 8.4**——php-fpm 至少要 8.4-fpm-alpine
9. **Laravel 12 API 401 必須手動處理 redirectGuestsTo + exception render**——預設會拋 `Route [login] not defined`
10. **TanStack `router-devtools` 已改名為 `react-router-devtools`**——install 時記得用新套件名

---

## 8. Verification log（手動測試紀錄）

### AC1 — docker compose 起動

- 跑：`docker compose down && docker compose up -d`
- 結果：**4 containers all Up within 4.4s**（first up） / **7.6s**（second cold start）
- nginx → Vite 反代 200：`curl http://localhost:8080/` → 200，含 `<div id="root">`
- ✅ **PASS**

### AC2 — Windows volume 行為

- cold start（second，volumes cached）：**7.78s 含 HTTP 200**（target < 30s）
- HMR：失敗（見踩坑 #7，defer Story 1.3）
- bind mount vs named volume：node_modules 走 named volume，未觀察到 IO 災難
- ✅ **PASS**（30s 目標達成；HMR defer）

### AC3 — frontend layout + routing

- `http://localhost:8080/` → 自動 redirect `/login` ✅
- 未登入訪問 `/me` → 自動 redirect `/login`（`_authenticated.tsx beforeLoad guard`） ✅
- Sidebar + Topbar + Content area 三段式 layout 渲染 ✅（截圖佐證）
- TanStack Router file-based routing + DevTools 可用 ✅
- 視覺對齊 cream / Cormorant：**未做**（Story 1.3）
- ✅ **PASS**

### AC4 — JWT 基本流程

- `POST /api/auth/login` `{"email":"jie@example.com","password":"password123"}` → 200 + `access_token` + `token_type=bearer` + `expires_in=900` ✅
- `GET /api/me-spike` with `Authorization: Bearer <token>` → 200 + user JSON ✅
- TTL 設定：`.env JWT_TTL=15` 對應 expires_in=900s（15min × 60）= NFR5 達標 ✅
- ✅ **PASS**

### AC5 — axios 401 概念驗證

- 手動 swap fake token → `axios.get('/me-spike')` → nginx log 確認 sequence：
  ```
  GET /api/me-spike → 401
  POST /api/auth/refresh-spike → 401 (fake token refresh fail)
  ```
  → interceptor 路徑**確實**觸發（detect 401 → call refresh） ✅
- retry success 路徑：backend 用合法 token 已單獨驗（refresh → 新 token → /me-spike → 200） ✅
- 並發 queue / mutex：**不做**（Story 2.2）
- ✅ **PASS**

### AC6 — ADR 0001 + 0002 寫入

- `docs/decisions/0001-record-architecture-decisions.md` ✅
- `docs/decisions/0002-jwt-over-sanctum.md` ✅
- ✅ **PASS**

### AC7 — spike-notes

- 本檔案 ✅
- Blocker 清單與 continue/defer 標註 ✅（section 6）
- 無 pivot 級 blocker → 不需要 HALT 通知 user
- ✅ **PASS**

---

## 結論

🎯 **W0 spike PASS — 7/7 AC ✅**
- 8 個 spike-level blocker 全 Low severity，全 continue 或 defer
- 無 pivot 級 blocker → 不需要架構偏離 / pivot
- 架構（Docker + Laravel 12 + JWT + Vite + React 19 + TanStack Router + axios）可走，進入 W1
- 已生成 artifacts：
  - ADR 0001 / 0002 ✅
  - Docker compose（4 service）+ Dockerfile（nginx / php-fpm 8.4 / postgres 17 / node 22）✅
  - Backend scaffold：Laravel 12 + jwt-auth 2.9.2 + AuthSpikeController + routes/api.php ✅
  - Frontend scaffold：Vite 8 + React 19 + TanStack Router + axios + 最簡 AppShell ✅
  - 本 spike-notes ✅
