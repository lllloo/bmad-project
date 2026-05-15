---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
status: complete
lastStep: 8
completedAt: '2026-05-15'
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-project.md
  - _bmad-output/planning-artifacts/product-brief-bmad-project-distillate.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/validation-report-2026-05-15.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - DESIGN.md
workflowType: 'architecture'
project_name: bmad-project
user_name: Jie
date: '2026-05-15'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

#### Functional Requirements

PRD 含 **38 個 FR**，分 8 個 capability area：

| Capability Area | FRs | 架構意義 |
|---|---|---|
| Authentication & Identity（FR1-8） | 8 | 標準 auth flow，但 token 設計（FR9-14）才是核心 |
| **Session & Token Management（FR9-14）** | 6 | **架構最關鍵**：JWT access in-memory + refresh httpOnly cookie + rotation + DB jti blacklist + 401 攔截器；多元件協作（後端 guard、middleware、blacklist table、前端 axios interceptor） |
| User Profile（FR15-16） | 2 | 標準 CRUD |
| Member Administration（FR17-20） | 4 | Admin CRUD + 停權 + 改密碼 + 指派角色 |
| **Role & Permission Management（FR21-25）** | 5 | `spatie/laravel-permission` + Policy / Gate；**FR24 cache invalidation 在 JWT 無狀態場景下需特殊設計** |
| **Audit Logging（FR26-28）** | 3 | Append-only table + actor/action/target/metadata；需 cross-cutting concern（任何敏感操作自動寫入） |
| **Developer Experience（FR29-34）** | 6 | **架構需配合 starter kit 性質**：自寫 docker-compose、seeders auto-run、`bin/new-project.sh`、Domain 邊界、ADR、README |
| API Documentation（FR35-37） | 3 | Scribe + OpenAPI JSON 匯出 |
| Module Boundary（FR38） | 1 | **`app/Domain/Auth/` vs `app/Domain/Member/` 強制分離**——架構層級設計，跨多檔 |

#### Non-Functional Requirements

20 個 NFR，6 個類別。架構驅動：

- **Performance（NFR1-4）**：FCP ≤ 1.5s、bundle ≤ 250KB gzipped、API p95 ≤ 300ms、TanStack Query staleTime ≥ 30s → 影響 SPA 拆 bundle 策略、API 設計層級緩存
- **Security（NFR5-11）**：access TTL ≤ 15min、refresh TTL ≤ 7d + rotation、bcrypt cost ≥ 12、security headers、rate limits、audit log append-only、verification token TTL ≤ 24h + 單次使用 → **架構安全層完整 specification**
- **Accessibility（NFR12-14）**：WCAG 2.1 AA、鍵盤導航、對比度 ≥ 4.5:1 → 元件層而非架構層；shadcn Radix 已涵蓋
- **Testability（NFR15-17）**：Pest / Vitest ≥ 60%、關鍵路徑必測清單 100% → 影響專案結構（test 目錄、CI integration）
- **Maintainability（NFR18-19）**：≥ 5 篇 ADR、README quickstart ≤ 200 字 → 架構交付物
- **Reusability（NFR20）**：fork → 業務開發 ≤ 2 小時 → 架構必須 fork-friendly

### Scale & Complexity

- **Primary domain**: `web_app` + `api_backend` 雙重（獨立 React SPA + Laravel REST API）
- **Complexity level**: **medium**——非 enterprise scale，但含 JWT rotation / RBAC / 自寫 Docker / Audit log / 文件自動化等多套件協作；**無 multi-tenancy、無 real-time、無 ML、無外部 integration**（MVP 階段）
- **Estimated architectural components**: ~12（auth service、token service、blacklist store、RBAC layer、audit logger、member CRUD、admin CRUD、API gateway/nginx、SPA shell、auth interceptor、Scribe generator、bin scripts）
- **Project context**: greenfield，無既有 codebase 限制
- **Deployment scope**: 本機 docker-compose 為 MVP 目標；line 上 deploy 為第二階段

### Technical Constraints & Dependencies

#### 固定技術棧（PRD 已鎖）

| Layer | 選擇 | 原因 |
|---|---|---|
| Backend | **Laravel 12 + PHP 8.3+** | PRD 明定 |
| DB | **PostgreSQL** | 為 pgvector（第二階段 RAG）預留 |
| Auth | **`php-open-source-saver/jwt-auth` v2.8.2** | tymon fork，社群主力，Laravel 12 相容 |
| RBAC | **`spatie/laravel-permission`** | 事實標準，1200 萬+ 下載 |
| API Docs | **Scribe（knuckles.wtf）** | zero-annotation，社群偏好 |
| Test (backend) | **Pest v3+** | Laravel 12 新專案預設 |
| Frontend | **React 19 + Vite** | PRD 明定 |
| Router | **TanStack Router** | 與 TanStack Query 同源、type-safe routing |
| State / Data | **TanStack Query** | server state 標準 |
| UI | **shadcn/ui + Radix + Tailwind** | UX spec 確認 |
| Test (frontend) | **Vitest + React Testing Library** | Vite 同源 |
| Container | **自寫 docker-compose**（nginx + php-fpm + postgres + node） | 拒絕 Sail |

#### 外部依賴

- 套件管理：composer（PHP）、pnpm（Node.js）
- Node.js 版本：≥ 20 LTS
- PHP：≥ 8.3
- Docker：≥ 24 + Compose v2

#### 環境約束

- **Windows 開發**：volume / line ending / file watcher 不一致是 Major Risk #2；推薦 WSL2
- **同網域反代**：nginx 反代 dev/prod 一致到 8080；禁止 Vite dev server 直連

### Cross-Cutting Concerns Identified

跨多元件、需架構層處理的關注點：

1. **Token Rotation Atomicity**——refresh 換新 token 與舊 jti 列入 blacklist 必須在同一 DB transaction；否則中間失敗會造成 token 既被撤銷又無新 token
2. **Spatie Cache vs JWT Statelessness**——改角色後 cache reset 是必要的，但 JWT 內 embedded permissions（若採此模式）即使 cache 重置仍會帶舊權限到 access TTL 結束。**設計選擇**：access token 不 embed permissions，每次請求查 DB（spatie cache 加速）；TTL ≤ 15 min 緩解 stale cache
3. **Audit Log 寫入時機**——所有敏感操作（停權 / 改密碼 / 改角色）必須**強制**寫入 audit；架構需用 Observer / Event listener 或 trait 強制，不靠開發者記得手動寫
4. **CORS / Cookie / CSRF**——同網域反代讓這三件事互相影響；架構需在 nginx + Laravel config + 前端 axios 三處一致設定
5. **Domain Boundary Enforcement**——`app/Domain/Auth/` 與 `app/Domain/Member/` 邊界靠**目錄分離 + namespace + ServiceProvider 注入**而非僅文字 convention；架構需設計 module loader 機制
6. **Dev/Prod Parity for Reverse Proxy**——nginx 反代必須在 dev 也跑通（不只 prod）；docker-compose dev profile 需含 nginx 容器
7. **Fork-Friendliness**——任何硬編 namespace / port / project name 都會破壞 `bin/new-project.sh` 冪等性；架構需把所有環境差異集中在 `.env`
8. **Windows Docker Compatibility**——volume bind mount 在 Windows 慢、line ending 自動轉換是地雷；架構需在 docker-compose 用 named volumes（不 bind mount）+ 在 git config 設 core.autocrlf
9. **Seeders Auto-Run on First Boot**——docker entrypoint 需偵測「是否首次啟動」（migration table 是否存在 / 是否空），首次跑 migration + seeders；非首次跳過
10. **OpenAPI Export Pipeline**——Scribe 產生 docs/api/openapi.json 需在 build 階段而非運行階段；架構需在 deploy 流程或 CI 中加入

## Starter Template Evaluation

### Primary Technology Domain

`web_app` + `api_backend` 雙重：

- **Backend**：Laravel 12 + PostgreSQL（純 API，無 Inertia）
- **Frontend**：React 19 + Vite（獨立 SPA，與 Laravel 同 repo 但不同目錄）

### Starter Options Considered

| 選項 | 評估 | 結論 |
|---|---|---|
| **Laravel React Starter Kit（官方）** | Inertia + Sanctum 路線，與 PRD 衝突 | ❌ 拒絕（PRD 明定） |
| **Laravel Breeze API + 自建 React SPA** | Breeze API stack 仍預設 Sanctum | ❌ 拒絕 |
| **Filament / Nova** | Livewire / Vue Inertia | ❌ 拒絕（不是 React 路線） |
| **yogijowo/laravel12-react-starterkit** | Inertia + 預設 session auth | ❌ 拒絕 |
| **satnaing/shadcn-admin（前端） + 自建 Laravel API** | 前端有完整 admin layout 可抄；後端從 `laravel new` 起 | **✓ 採用前端部分** |
| **完全自建（laravel new + vite create + shadcn init）** | 完全控制、無多餘依賴 | **✓ 採用後端與 shadcn 起點** |

### Selected Starter Strategy

**雙軌起點 — 後端「裸 Laravel」+ 前端「抄 shadcn-admin layout」**

#### 1. Backend：裸 Laravel 12

從零起，不用官方 starter kit（直接拒絕 Inertia/Sanctum 預載入）。

**Initialization Commands**（W1 起手）：

```bash
# 在 starter repo 根目錄
composer create-project laravel/laravel backend
cd backend

# 加 PostgreSQL driver（Laravel 預載入 mysql 與 sqlite，pgsql 需另設定但 driver 已有）
# 移除 mysql / sqlite 相關 .env 預設值

# JWT auth（替代 Sanctum）
composer require php-open-source-saver/jwt-auth
php artisan vendor:publish --provider="PHPOpenSourceSaver\JWTAuth\Providers\LaravelServiceProvider"
php artisan jwt:secret

# RBAC
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# API docs
composer require knuckleswtf/scribe
php artisan vendor:publish --tag=scribe-config

# Testing（Pest 替代 PHPUnit）
composer remove phpunit/phpunit
composer require pestphp/pest --dev --with-all-dependencies
composer require pestphp/pest-plugin-laravel --dev
php artisan pest:install

# 移除 Sanctum（Laravel 12 預載入但本案不用）
composer remove laravel/sanctum
```

**Architectural Decisions Provided by laravel new**：

- **PHP / Laravel 版本**：Laravel 12（PHP 8.3+）
- **Routing**：Laravel 預設 file-based（`routes/web.php`、`routes/api.php`）
- **ORM**：Eloquent
- **Migration / Seeder**：Laravel 預設 `database/migrations`、`database/seeders`
- **Service Provider**：Laravel 12 用 `bootstrap/app.php`（不再 Kernel.php）
- **Middleware alias 註冊位置**：`bootstrap/app.php`（PRD Domain-Specific Requirements 已強調）
- **Testing**：移除預設 PHPUnit、改用 Pest

#### 2. Frontend：Vite + React 19 + 抄 shadcn-admin Layout

```bash
# 在 starter repo 根目錄
pnpm create vite@latest frontend --template react-ts
cd frontend
pnpm install

# Tailwind 4 + shadcn init
pnpm dlx shadcn@latest init  # 互動式設 base color、style

# TanStack Router + Query
pnpm add @tanstack/react-router @tanstack/react-query
pnpm add -D @tanstack/router-devtools @tanstack/react-query-devtools

# Form
pnpm add react-hook-form @hookform/resolvers zod

# axios（用於 JWT bearer header + 401 interceptor）
pnpm add axios

# 字體 self-hosted
pnpm add @fontsource/cormorant-garamond @fontsource/inter @fontsource/jetbrains-mono

# 測試
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Lint / a11y
pnpm add -D eslint eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks

# shadcn 元件（按需 add）
pnpm dlx shadcn@latest add button input form label card table sheet dialog alert-dialog command popover dropdown-menu select checkbox switch pagination tooltip skeleton avatar badge sidebar
```

**Layout 抄 `satnaing/shadcn-admin`**：

```bash
# 不要 git clone 整個 repo；只抄需要的 layout 檔
# 從 https://github.com/satnaing/shadcn-admin 手動複製：
#   src/components/layout/* → frontend/src/components/layout/
#   src/hooks/use-* → frontend/src/hooks/（按需）
#   不抄路由（用 TanStack Router 自建）
#   不抄 mock data
```

**Architectural Decisions Provided by Vite + shadcn**：

- **Build tool**：Vite（dev server + production build + HMR）
- **TypeScript**：strict mode（Vite 預設）
- **Styling**：Tailwind 4 + CSS variables（shadcn theme 機制）
- **Component pattern**：copy-paste shadcn 元件到 `src/components/ui/`
- **Path alias**：`@/*` → `src/*`（shadcn 預設）
- **Test**：Vitest + RTL

#### 3. 整體 Repo 結構（雙軌共存於 monorepo）

```
bmad-project/
├── backend/                  # Laravel 12 API
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/api.php        # 唯一 routing（無 web.php 使用）
│   ├── tests/
│   ├── composer.json
│   └── .env
├── frontend/                 # React 19 SPA
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── .env
├── docker/                   # 自寫 docker compose
│   ├── nginx/
│   │   └── default.conf      # 同網域反代
│   ├── php-fpm/
│   │   └── Dockerfile
│   └── postgres/
│       └── init.sql
├── docs/
│   ├── decisions/            # ADRs
│   └── api/                  # Scribe export
├── bin/
│   └── new-project.sh        # fork 腳本
├── docker-compose.yml
├── README.md
└── DESIGN.md                 # 視覺參考
```

**為何 monorepo 而非 polyrepo**：

- Side project starter kit 性質——`git clone` 一次拿到完整 stack
- Fork 時 `bin/new-project.sh` 一次處理前後端 namespace、port、git remote
- 部署一致性（同 docker compose 起所有服務）

**Note**：Project initialization using these commands should be the first implementation stories（W1 計畫的核心）。

## Core Architectural Decisions

### Decision Priority Analysis

#### Critical Decisions（Block Implementation）— 必須在 W1 前定案

1. JWT token 設計（TTL、claims、storage）
2. RBAC 模型（roles / permissions / user_has_roles 表結構）
3. 資料模型核心表（users / token_blacklist / audit_logs / verification_tokens / password_reset_tokens）
4. nginx 反代 routing 規則（/api/* → php-fpm、/* → vite/react）
5. CORS / cookie / CSRF 策略
6. Domain boundary（`app/Domain/Auth/` 與 `app/Domain/Member/` 載入機制）

#### Important Decisions（Shape Architecture）

7. ID 策略（ULID vs auto-increment）
8. Cache driver（file / database / Redis）
9. Front-end State 分層（auth context / TanStack Query / 不引入 Redux）
10. axios interceptor 結構（401 retry queue）
11. Audit logger 強制機制（Observer pattern）

#### Deferred Decisions（Post-MVP，第二階段再定）

12. Real-time（Reverb / WebSocket）
13. Queue driver 切換（database → Redis）
14. Multi-tenancy 模型
15. CI/CD pipeline（GitHub Actions）
16. APM / structured logging（OpenTelemetry）

### Data Architecture

#### ORM & Migration

- **ORM**：Eloquent（Laravel 內建）
- **Migration**：Laravel 預設 `database/migrations`
- **Seeder**：`database/seeders`（`RoleSeeder`、`AdminUserSeeder`、`DemoMembersSeeder`）
- **PostgreSQL specific**：在 migration 中**禁用 `enum()`**（PG 行為與 MySQL 不同），改用 `string()` + check constraint 或 Eloquent cast

#### ID 策略

- **Users 表**：**ULID**（`Str::ulid()`，26 字串）——對外可見、不洩漏建立順序、time-sortable
- **內部表**（roles / permissions / token_blacklist / audit_logs）：**auto-increment bigint**——僅內部 join，無需 ULID
- **Foreign key**：明確用 `users.id` 或 `users.ulid`，避免混淆

#### 核心表結構

```sql
-- users (Eloquent default + 擴展)
users {
  id ULID (PK, 26 chars)
  email VARCHAR(255) UNIQUE NOT NULL
  password VARCHAR(255) NOT NULL  -- bcrypt cost ≥ 12
  name VARCHAR(255) NOT NULL
  email_verified_at TIMESTAMP NULL
  suspended_at TIMESTAMP NULL          -- 軟停權
  suspended_reason VARCHAR(500) NULL
  created_at, updated_at
}

-- spatie/laravel-permission（套件自帶）
roles { id, name, guard_name, ... }
permissions { id, name, guard_name, ... }
model_has_roles { role_id, model_id (= users.id ULID), model_type }
role_has_permissions { ... }

-- token_blacklist（JWT 撤銷）
token_blacklist {
  id BIGINT (PK)
  jti VARCHAR(64) UNIQUE NOT NULL    -- JWT ID
  user_id ULID NOT NULL              -- FK users(id)
  expires_at TIMESTAMP NOT NULL      -- 同 token 原本到期時間
  reason VARCHAR(50) NOT NULL        -- 'logout' / 'rotation' / 'admin_revoke'
  created_at
  INDEX (jti)
  INDEX (expires_at)                  -- 過期清理用
}

-- audit_logs（append-only）
audit_logs {
  id BIGINT (PK)
  actor_id ULID NULL                  -- 操作者 user_id，系統操作為 NULL
  actor_role VARCHAR(20)              -- 操作者角色快照
  action VARCHAR(50) NOT NULL         -- 'member.suspend' / 'member.role_change' / 'member.password_change'
  target_type VARCHAR(50) NULL        -- 'user' / 'role'
  target_id VARCHAR(26) NULL          -- 操作對象 ID（ULID 字串或 bigint 字串）
  metadata JSONB NULL                 -- 任意上下文 payload
  ip_address INET NULL
  user_agent VARCHAR(500) NULL
  created_at TIMESTAMP NOT NULL
  INDEX (actor_id, created_at)
  INDEX (target_type, target_id, created_at)
  INDEX (action, created_at)
}
-- NFR10：append-only — 不寫 updated_at，DB 層用 trigger 禁 UPDATE/DELETE（或在 model 層 override save）

-- verification_tokens（email 驗證）
verification_tokens {
  id BIGINT (PK)
  user_id ULID NOT NULL
  token VARCHAR(64) UNIQUE NOT NULL   -- hash 過的，不存明文
  expires_at TIMESTAMP NOT NULL       -- ≤ 24h (NFR11)
  used_at TIMESTAMP NULL              -- 單次使用 (NFR11)
  created_at
}

-- password_reset_tokens（同上結構）
password_reset_tokens {
  ... (與 verification_tokens 同結構)
}
```

#### Caching Strategy

- **MVP**：`CACHE_DRIVER=database`（不引入 Redis）
- **Spatie permission cache**：採 database driver；改角色時呼叫 `app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions()`
- **TanStack Query cache（前端）**：staleTime ≥ 30s（NFR4），memory-only，不持久化到 localStorage

### Authentication & Security

#### JWT 設計

| 維度 | 決策 |
|---|---|
| 套件 | `php-open-source-saver/jwt-auth` v2.8.2 |
| Algorithm | HS256（symmetric，本案單一後端 service，無需 RS256 asymmetric） |
| Access TTL | **15 分鐘**（NFR5 上限）|
| Refresh TTL | **7 天**（NFR6 上限） |
| Access claims | `sub` (user_id ULID), `iat`, `exp`, `jti`, `role` (snapshot for fast UI hint, 但**權限檢查不靠它**), `iss` |
| Access storage | **前端記憶體**（React Context state，不存 localStorage / sessionStorage） |
| Refresh storage | **httpOnly cookie**, `SameSite=Lax`, `Secure` (prod 才設), `Path=/api/auth/refresh` (cookie 不送其他 endpoint) |
| Rotation | **每次 refresh 必 rotate**——核發新 jti + 新 access + 新 refresh，舊 jti 立刻寫入 token_blacklist |
| Revocation | jti 寫入 `token_blacklist` 表，Guard 每次驗證 access token 查表（cache 加速） |

#### Authorization

- **套件**：`spatie/laravel-permission`
- **3 角色**：`admin`、`editor`、`member`（seeder 建立）
- **Permission 粒度**：MVP 簡化為「按 role 控管」，不細到 individual permission；Policy 寫法仍預留 permission grain
- **Middleware alias**：`role`、`permission`、`role_or_permission` 註冊在 `bootstrap/app.php`
- **Policy 模式**：所有 admin 端 controller 用 `authorize()`；禁止直接 `if ($user->hasRole(...))`

#### Security Headers（NFR8）

於全域 middleware 設定：

```php
'X-Content-Type-Options' => 'nosniff'
'X-Frame-Options' => 'DENY'
'Referrer-Policy' => 'strict-origin-when-cross-origin'
'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()'
```

#### Rate Limiting（NFR9）

Laravel 內建 `RateLimiter`，在 `app/Providers/AppServiceProvider.php` 設：

```php
RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
RateLimiter::for('api', fn (Request $r) => Limit::perMinute(60)->by($r->user()?->id ?: $r->ip()));
```

`/api/auth/*` 套 `auth` limiter；其餘 `/api/*` 套 `api` limiter。

### API & Communication Patterns

#### API Design

- **Pattern**：RESTful + JSON
- **URL convention**：`/api/<resource>` 複數 + 子資源（`/api/admin/members/{id}/roles`）
- **HTTP method 語意**：GET 唯讀、POST 新增、PATCH 部分更新、PUT 完整替換、DELETE 刪除
- **Versioning**：MVP 無版本前綴；第二階段 AI 用 `/api/v2/*`

#### Response Envelope

- **資源回應**：直接物件 / 陣列，不包 `{data: ...}` envelope（與 Laravel API Resources 預設 `data` wrapping 不同——關閉 `JsonResource::withoutWrapping()`）
- **列表回應**：`{ data: [...], meta: { total, page, per_page, last_page } }`（pagination 才包）

#### Error Format（RFC 7807 Problem Details）

```json
{
  "type": "https://example.com/probs/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "The email field must be a valid email address.",
  "instance": "/api/auth/register",
  "errors": {
    "email": ["The email field must be a valid email address."]
  }
}
```

在 `bootstrap/app.php` 註冊 Exception Handler 統一轉換成此格式。

#### Error Code 對映

| HTTP | type | 用途 |
|---|---|---|
| 400 | validation | 輸入格式錯（早於 422）|
| 401 | unauthenticated | 無 token / token 過期 |
| 403 | forbidden | 有 token 但角色 / 權限不足 |
| 404 | not-found | 資源不存在 |
| 409 | conflict | 資源狀態衝突（已存在等）|
| 422 | validation-business | 通過格式但業務邏輯失敗 |
| 429 | rate-limit | 觸發 rate limit |
| 500 | server-error | 未預期錯誤 |

### Frontend Architecture

#### State 分層

| 類別 | 工具 | 範圍 |
|---|---|---|
| Server state | **TanStack Query** | API 回應、cache、stale time、background refetch |
| Auth state | **React Context**（`AuthContext`） | 當前 user、access token、roles、login/logout/refresh actions |
| Form state | **React Hook Form + Zod** | 所有表單 |
| URL state | **TanStack Router**（search params + route params） | 列表 filter、pagination、tabs 等可分享 URL 的狀態 |
| UI state | **`useState` / `useReducer`** | 元件內局部狀態（dialog open/close、tab active） |
| **不引入** | ~~Redux / Zustand / Jotai / Recoil~~ | MVP 不需全域 client state library |

#### Routing 結構

TanStack Router file-based routing（`src/routes/*.tsx`）：

```
src/routes/
├── __root.tsx              # Root layout（AuthProvider + QueryClientProvider）
├── index.tsx               # / → 重導 to /admin 或 /login
├── login.tsx               # /login
├── verify/$token.tsx       # /verify/:token
├── _authenticated.tsx      # 受保護 layout（檢查 auth context）
├── _authenticated/
│   ├── me/
│   │   ├── index.tsx       # /me (Profile)
│   │   └── password.tsx    # /me/password
│   ├── admin/
│   │   ├── members/
│   │   │   ├── index.tsx   # /admin/members
│   │   │   └── $id.tsx     # /admin/members/:id
│   │   ├── roles.tsx
│   │   └── audit.tsx
│   └── editor/
│       └── ... (editor 角色限定路由)
```

`_authenticated` 路由用 `beforeLoad` 守門：未登入 → redirect `/login?return=<current>`。

#### axios Interceptor

```ts
// src/lib/api.ts
const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use((config) => {
  const token = authContext.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true
    try {
      await authContext.refresh()  // 換新 access token
      return api(error.config)      // 重發原請求
    } catch {
      authContext.logout({ reason: 'token_chain_failed' })
      throw error
    }
  }
  throw error
})
```

**重要**：refresh 過程中若有多個並發 401，需 queue 後等同一次 refresh 完成再 retry，避免 race。

### Infrastructure & Deployment

#### Docker Compose 結構

`docker-compose.yml`（dev 與 prod 共用 base，prod 用 override file）：

```yaml
services:
  nginx:
    image: nginx:1.27-alpine
    ports: ['8080:80']
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [php-fpm, node]

  php-fpm:
    build: ./docker/php-fpm
    volumes:
      - ./backend:/var/www/html
    environment:
      - DB_HOST=postgres
      - DB_DATABASE=${DB_DATABASE:-bmad}
    depends_on: [postgres]
    entrypoint: ['/docker-entrypoint.sh']  # 自動 migrate + seed on first boot

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: ${DB_DATABASE:-bmad}
      POSTGRES_USER: ${DB_USERNAME:-bmad}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    volumes:
      - pg_data:/var/lib/postgresql/data

  node:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: ['pnpm', 'dev', '--host', '0.0.0.0', '--port', '5173']

volumes:
  pg_data:
```

#### nginx 反代設定

`docker/nginx/default.conf`：

```nginx
upstream php_backend { server php-fpm:9000; }
upstream vite_frontend { server node:5173; }

server {
  listen 80;

  location /api/ {
    proxy_pass http://php_backend;
    # ... proxy headers ...
  }

  location /api/docs {
    proxy_pass http://php_backend;  # Scribe 文件
  }

  # Vite dev HMR ws
  location /ws {
    proxy_pass http://vite_frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  # 所有其他流量到 Vite（SPA fallback）
  location / {
    proxy_pass http://vite_frontend;
  }
}
```

#### Logging

- **Backend**：Laravel default logging → `storage/logs/laravel.log`（dev）/ stdout（prod docker）
- **Audit log**：寫入 `audit_logs` DB table（NFR10 append-only）
- **Email 寄送**：MVP `MAIL_MAILER=log`，verification / reset token URL 直接在 log 可見

#### Monitoring（Deferred to Phase 2）

- 第二階段才加 OpenTelemetry / Sentry / Logtail
- MVP 階段純 docker logs + Laravel log file

### Decision Impact Analysis

#### Implementation Sequence（架構決定的實作順序）

1. **W0 spike**：技術組合驗證（shadcn-admin layout + TanStack Router + JWT 攔截器 + Docker on Windows）
2. **W1**：docker-compose + nginx 反代 + 裸 Laravel + 裸 Vite + 基礎 JWT 登入登出
3. **W2**：Token rotation + blacklist + Profile + 密碼重設 + 401 interceptor
4. **W3**：RBAC + Admin 端 + Audit log（Observer pattern 強制寫入）
5. **W4**：Scribe + Pest/Vitest + Seeders + ADR + README + `bin/new-project.sh`

#### Cross-Component Dependencies

- **JWT Auth**（FR9-14） → 影響 axios interceptor、AuthContext、TanStack Router 守門、所有 receiving endpoint 的 middleware
- **Spatie Cache** → 影響 RBAC API 改角色時的 cache reset、所有 Policy / Gate 的 permission lookup
- **Audit Log Observer** → 影響所有 admin write endpoint（停權 / 改密碼 / 改角色 model events）
- **Domain Boundary**（`Auth/` vs `Member/`） → 影響整個 codebase 目錄結構與 `bin/new-project.sh` 的 namespace 替換規則
- **Same-domain reverse proxy** → 影響 nginx config、Laravel session config（雖然不用 session）、cookie config、CORS 解除設定（同網域反代不需 CORS preflight）

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

涵蓋 5 大 conflict points（防止不同 AI agent 寫出不一致風格）：naming / structure / format / communication / process。

### Naming Patterns

#### Database

- **Table names**：snake_case 複數（`users`、`token_blacklist`、`audit_logs`）
- **Column names**：snake_case 單數（`user_id`、`expires_at`、`actor_role`）
- **Foreign keys**：`<referenced_table_singular>_id`（`user_id` not `users_id` or `fk_user`）
- **Primary key**：`id`（不用 `uuid` 或 `user_id` 當 PK 欄位名，即使值為 ULID）
- **Timestamps**：`created_at` / `updated_at`；軟事件用語意名（`suspended_at`、`used_at`）
- **Index 命名**：`{table}_{columns}_index`（Laravel migration 預設 helper 產生）
- **Enum-like columns**：用 `string()` + check constraint（PG），值用 snake_case（`'member.suspend'`）

#### API

- **Endpoint paths**：複數 RESTful（`/api/admin/members` not `/api/admin/member`）
- **Path params**：`{id}` 大括號（Laravel 慣例）
- **Query params**：snake_case（`?search=foo&per_page=20&sort=created_at`）
- **Header names**：`X-Custom-Header`（Title-Case-With-Hyphens）；標準 header 用 `Authorization`、`Content-Type`
- **HTTP method 語意**：嚴格遵守 REST（不用 POST 做 read）

#### Code（Backend Laravel）

- **Classes**：PascalCase（`UserController`、`AuditLogger`、`JwtBlacklistService`）
- **Methods**：camelCase（`getUserById`、`revokeToken`）
- **Variables**：camelCase（`$userId`、`$accessToken`）
- **Constants**：UPPER_SNAKE（`ACCESS_TOKEN_TTL_MINUTES = 15`）
- **DB 欄位 → PHP property**：自動 camelCase（Eloquent default）；JSON 序列化保留 snake_case（API 對外）
- **Domain Service 命名**：`Domain\Auth\Services\TokenIssuer`、`Domain\Member\Services\MemberSuspender`

#### Code（Frontend React）

- **Components**：PascalCase（`MemberList.tsx`、`AuditDetailSheet.tsx`）
- **Files**：與 component 同名（`MemberList.tsx`，不用 `member-list.tsx`）
- **Hooks**：`use` 前綴 camelCase（`useAuthContext.ts`、`useMembers.ts`）
- **Utility functions**：camelCase（`formatRelativeTime`、`maskToken`）
- **Variables**：camelCase
- **Constants**：UPPER_SNAKE 或 PascalCase enum
- **Route files**：TanStack Router file-based 慣例（`members.tsx`、`$id.tsx`）
- **Test files**：`*.test.ts(x)` co-located 在 component 旁

### Structure Patterns

#### Backend Project Organization

```
backend/
├── app/
│   ├── Domain/                       # ← 業務邊界，按 domain 分（非預設 Laravel）
│   │   ├── Auth/                     # 框架（fork 保留）
│   │   │   ├── Controllers/
│   │   │   ├── Services/
│   │   │   ├── Models/
│   │   │   ├── Policies/
│   │   │   ├── Observers/
│   │   │   ├── Middleware/
│   │   │   └── AuthServiceProvider.php
│   │   └── Member/                   # 範例業務（fork 可刪）
│   │       ├── Controllers/
│   │       ├── Services/
│   │       ├── Models/
│   │       ├── Policies/
│   │       └── MemberServiceProvider.php
│   ├── Http/                         # Laravel 預設保留，只放共用 Kernel-level
│   │   ├── Middleware/               # 全站 middleware（security headers、rate limit）
│   │   └── Resources/                # 共用 API resource base
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   └── DomainServiceProvider.php # 自動發現並註冊 Domain/*/...ServiceProvider
│   └── Exceptions/
├── bootstrap/
│   └── app.php                       # middleware alias 註冊在此
├── config/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   └── api.php                       # 唯一 routing；無 web.php 使用
└── tests/
    ├── Feature/
    │   ├── Auth/
    │   └── Member/
    └── Unit/
        └── Domain/
```

#### Frontend Project Organization

```
frontend/src/
├── components/
│   ├── ui/                           # shadcn 元件（copy-paste）
│   ├── custom/                       # 自製元件（RoleBadge / PageHeading / EmptyState / CodeWindow 等）
│   └── layout/                       # 抄自 satnaing/shadcn-admin（Sidebar / Topbar / AppShell）
├── features/                         # 按 domain 分
│   ├── auth/                         # 框架（fork 保留）
│   │   ├── AuthContext.tsx
│   │   ├── hooks/
│   │   ├── api/                      # auth API calls
│   │   └── components/
│   └── members/                      # 範例業務（fork 可刪）
│       ├── hooks/
│       ├── api/
│       └── components/
├── lib/
│   ├── api.ts                        # axios instance + interceptors
│   ├── query-client.ts               # TanStack Query setup
│   └── utils.ts                      # shared utilities
├── routes/                           # TanStack Router file-based
├── styles/
│   └── globals.css                   # CSS variables + Tailwind base
├── assets/
│   └── empty-states/                 # SVG line-art illustrations
└── main.tsx
```

#### Test 位置

- **Backend**：`tests/Feature/<Domain>/<Feature>Test.php` 與 `tests/Unit/Domain/<Domain>/<Service>Test.php`（**不**co-located）
- **Frontend**：`*.test.tsx` co-located 在 component 旁；E2E（第二階段）放 `e2e/`

#### Config File

- 環境變數：**所有**環境差異集中在 `.env`；禁止硬編 URL / port / namespace
- 套件 config：Laravel 用 `config/*.php`（套件 publish 後可改）；React 用 `vite.config.ts`、`tailwind.config.ts`
- 文件：`docs/decisions/`（ADR）、`docs/api/`（Scribe export）

### Format Patterns

#### API Response

- **單一資源**：直接物件，無 envelope
  ```json
  { "id": "01HX...", "email": "user@example.com", "name": "Lin" }
  ```
- **列表（pagination）**：含 meta
  ```json
  {
    "data": [...],
    "meta": { "total": 247, "page": 1, "per_page": 20, "last_page": 13 }
  }
  ```
- **錯誤**：RFC 7807 Problem Details（見 Step 4 範例）

#### JSON 欄位命名

- **API 對外**：snake_case（`access_token`、`expires_at`、`actor_role`）
- **TypeScript 型別**：camelCase（透過 axios response interceptor 轉換，或 zod schema 解碼時轉換）
- **不混用**：禁止前端有 `expires_at` 字串訪問

#### 日期時間

- **API**：**ISO 8601 UTC**（`2026-05-15T14:32:01Z`）
- **DB**：PostgreSQL `TIMESTAMP WITH TIME ZONE`，存 UTC
- **前端顯示**：`Intl.RelativeTimeFormat` 或 `Intl.DateTimeFormat` 本地化；不引入 moment / dayjs（Vite + native API 足夠）

#### 布林 / Null

- **API**：`true` / `false` / `null`（不用 `1` / `0` 或字串 `"true"`）
- **空集合**：空陣列 `[]`（不用 `null`）
- **Optional 欄位**：明確 `null` 或不出現都接受；TypeScript schema 標 `nullable` 或 `optional`

### Communication Patterns

#### Backend Event

- **Event 命名**：snake.case 動詞（`member.suspended`、`role.assigned`、`user.password_changed`）
- **Event payload**：plain associative array，含 `event_id`、`occurred_at`、業務欄位
- **Listener 註冊**：Laravel 預設 `EventServiceProvider`，但本案用 `Observer` 模式優先（model lifecycle）
- **MVP 階段**：不引入 Queue，event listener 同步執行；第二階段切 async

#### Audit Log 寫入機制（cross-cutting）

- 模式：Eloquent `Observer` + 自動取當前認證 user 作 actor
- **強制機制**：sensitive operations（停權 / 改密碼 / 改角色）的 model 註冊 `AuditableObserver`；不靠 controller 內手動 `AuditLog::create()`
- 範例：`MemberObserver::updated()` 偵測 `suspended_at` change → 寫 `audit_logs`

#### Frontend State Update

- **Server state**：透過 TanStack Query mutation；mutation 成功時 `invalidateQueries` 觸發 refetch
- **Auth state**：透過 React Context dispatch；reducer pattern（`AUTH_LOGIN`、`AUTH_LOGOUT`、`AUTH_TOKEN_REFRESHED`）
- **禁止直接 mutation**：所有 state 更新走 dispatcher / setter，不直接改物件

### Process Patterns

#### Error Handling

- **Backend**：所有業務 exception 繼承 `App\Exceptions\DomainException`；於 `bootstrap/app.php` 註冊 handler 統一轉 RFC 7807
- **Frontend**：axios interceptor 集中處理；錯誤分類：
  - 401 → 自動 refresh / forced logout
  - 403 → Toast「權限不足」+ 不跳轉
  - 422 → Form `setError`（不用 toast）
  - 5xx → Toast「服務暫時無法使用」+ 紀錄 sentry（第二階段）
- **Error boundary**：React `<ErrorBoundary>` 包裹整個 admin layout；fallback 為「敘事性」error page

#### Loading State

- **Initial page load**：路由層用 `pendingComponent` + `Skeleton`（TanStack Router）
- **Async action**：Button disabled + spinner inside button + label 改「Saving…」
- **Background refetch**：TanStack Query 自動處理，無 UI 干擾
- **Optimistic update**：`useMutation({ onMutate, onError rollback })`；用於 profile 改名等低風險場景

#### Form Validation

- **Schema**：zod 定義 schema，與 backend Laravel `FormRequest` 規則對齊（盡量）
- **時機**：onBlur 啟動驗證；submit 時必檢
- **錯誤顯示**：shadcn `FormMessage` 在欄位下方
- **Server-side validation 錯誤**：Backend 422 回 `errors: { field: [msg] }` → 前端 `setError(field, { message: msg })`

#### Authentication Flow

- **Login**：POST `/api/auth/login` → 收 access + refresh cookie → `AuthContext.dispatch(LOGIN)` 存 access in memory + user info
- **Auto refresh**：axios interceptor 處理 401（見 Step 4）
- **Logout**：POST `/api/auth/logout`（後端 blacklist refresh jti） → `AuthContext.dispatch(LOGOUT)` 清 state → `router.navigate('/login')`
- **Forced logout**（token chain 異常）：`AuthContext.dispatch(LOGOUT, { reason })` → toast → redirect with return URL

### Enforcement Guidelines

#### All AI Agents MUST

1. **檢查既有 ADR**：寫新 code 前查 `docs/decisions/` 確認決策；遇到未決議的歧異點先寫 ADR 再實作
2. **遵循 Domain Boundary**：auth 框架的 code 寫在 `app/Domain/Auth/` 與 `src/features/auth/`；範例業務寫在 `Member/` 對應位置；**禁止跨 domain 直接呼叫 Service**（透過 ServiceProvider 與 Contract 介接）
3. **使用 Policy / Gate 守門**：禁止 controller 內 `if ($user->hasRole(...))`；一律走 `$this->authorize('action', $model)`
4. **寫測試**：所有 FR 對應的 controller 至少有 Feature test 涵蓋 happy path + 1 error path
5. **保持 RFC 7807 錯誤格式**：禁止回傳 `{ "error": "..." }` 自製格式
6. **使用 ULID for user-facing IDs**：所有 API 對外 ID 必為 ULID 字串；不洩漏 auto-increment 順序

#### Pattern Enforcement

- **Linter / Formatter**：
  - Backend：`pint`（Laravel 預設 PHP-CS-Fixer wrapper）+ `larastan` lvl 5+
  - Frontend：`eslint` + `prettier` + `eslint-plugin-jsx-a11y` recommended
- **Pre-commit hook**（Husky，第二階段）：lint + type-check + 跑相關測試
- **CI check**（第二階段）：blocking PR merge 若 lint / type / test 失敗
- **MVP 階段**：手動執行 `composer pint` 與 `pnpm lint`，IDE 開 lint plugin

#### Pattern 違反時的處理

- 寫 ADR 解釋為何違反；違反必須**有意圖**而非「忘了」
- ADR 範例：`docs/decisions/0008-relax-jti-blacklist-cleanup.md`

### Pattern Examples

#### Good

```php
// ✓ Policy-based authorization
public function suspend(SuspendMemberRequest $request, User $member)
{
    $this->authorize('suspend', $member);
    $this->memberSuspender->suspend($member, $request->reason);
    return new UserResource($member->fresh());
}
```

```ts
// ✓ Server state via TanStack Query
const { data: members, isLoading } = useQuery({
  queryKey: ['members', filters],
  queryFn: () => api.get('/admin/members', { params: filters }).then(r => r.data),
  staleTime: 30_000,
})
```

#### Anti-Patterns

```php
// ❌ hasRole() 撒在 controller
public function destroy(User $member) {
    if (auth()->user()->hasRole('admin')) {  // 禁止
        $member->delete();
    }
}
```

```ts
// ❌ 直接 axios call without TanStack Query
useEffect(() => {
  axios.get('/api/members').then(r => setMembers(r.data))  // 禁止
}, [])
```

```php
// ❌ 自製錯誤格式
return response()->json(['error' => 'not found'], 404)  // 應走 RFC 7807
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-project/
├── README.md                                # 30 秒 quickstart + 踩坑清單（NFR19）
├── DESIGN.md                                # Anthropic 設計系統視覺參考
├── docker-compose.yml                       # dev / prod 共用 base
├── docker-compose.override.yml.example      # 開發者本機個別 override 範例
├── .env.example                             # 環境變數範例（fork 時複製為 .env）
├── .gitignore
├── .editorconfig
├── .gitattributes                           # 設 lf line ending（Windows 開發地雷）
├── LICENSE                                  # MIT 或自選
│
├── backend/                                 # Laravel 12 API
│   ├── app/
│   │   ├── Console/
│   │   │   └── Kernel.php
│   │   ├── Domain/                          # ★ Domain Boundary（FR38）
│   │   │   ├── Auth/                        # 框架（fork 保留）
│   │   │   │   ├── Controllers/
│   │   │   │   │   ├── AuthController.php          # FR1-8
│   │   │   │   │   ├── TokenController.php         # FR9-14
│   │   │   │   │   └── ProfileController.php       # FR15-16
│   │   │   │   ├── Services/
│   │   │   │   │   ├── TokenIssuer.php             # JWT 核發
│   │   │   │   │   ├── TokenRefresher.php          # rotation
│   │   │   │   │   ├── JwtBlacklist.php            # FR13
│   │   │   │   │   ├── EmailVerifier.php           # FR2-3
│   │   │   │   │   └── PasswordResetter.php        # FR6-7
│   │   │   │   ├── Models/
│   │   │   │   │   ├── User.php                    # 自 Laravel 預設搬入 Domain
│   │   │   │   │   ├── TokenBlacklist.php
│   │   │   │   │   ├── VerificationToken.php
│   │   │   │   │   └── PasswordResetToken.php
│   │   │   │   ├── Policies/
│   │   │   │   │   └── UserPolicy.php              # 自我資料權限
│   │   │   │   ├── Observers/
│   │   │   │   │   └── UserObserver.php            # email_verified_at 寫入
│   │   │   │   ├── Middleware/
│   │   │   │   │   └── JwtAuthenticate.php         # JWT guard middleware
│   │   │   │   ├── Requests/                       # FormRequest validation
│   │   │   │   │   ├── RegisterRequest.php
│   │   │   │   │   ├── LoginRequest.php
│   │   │   │   │   └── ChangePasswordRequest.php
│   │   │   │   ├── Resources/
│   │   │   │   │   └── UserResource.php
│   │   │   │   ├── Events/
│   │   │   │   │   ├── UserRegistered.php
│   │   │   │   │   ├── UserVerified.php
│   │   │   │   │   └── PasswordChanged.php
│   │   │   │   └── AuthServiceProvider.php
│   │   │   │
│   │   │   └── Member/                      # 範例業務（fork 可刪）
│   │   │       ├── Controllers/
│   │   │       │   ├── MemberController.php        # FR17-20
│   │   │       │   ├── RoleController.php          # FR21-22
│   │   │       │   └── AuditLogController.php      # FR26-28
│   │   │       ├── Services/
│   │   │       │   ├── MemberSuspender.php
│   │   │       │   ├── MemberPasswordResetter.php
│   │   │       │   ├── RoleAssigner.php            # FR22 + FR24 cache reset
│   │   │       │   └── AuditLogger.php             # FR26-27（cross-cutting）
│   │   │       ├── Models/
│   │   │       │   └── AuditLog.php
│   │   │       ├── Policies/
│   │   │       │   └── MemberPolicy.php            # FR23 守門
│   │   │       ├── Observers/
│   │   │       │   └── AuditableObserver.php       # FR26 強制機制
│   │   │       ├── Requests/
│   │   │       │   ├── SuspendMemberRequest.php
│   │   │       │   ├── AssignRolesRequest.php
│   │   │       │   └── ListAuditLogsRequest.php
│   │   │       ├── Resources/
│   │   │       │   ├── MemberResource.php
│   │   │       │   └── AuditLogResource.php
│   │   │       └── MemberServiceProvider.php
│   │   │
│   │   ├── Http/                            # Laravel 預設保留
│   │   │   ├── Middleware/
│   │   │   │   ├── SecurityHeaders.php             # NFR8
│   │   │   │   ├── ProblemDetailsResponse.php      # RFC 7807 統一格式
│   │   │   │   └── ForceJsonResponse.php
│   │   │   └── Resources/
│   │   │       └── Concerns/
│   │   │           └── HasUlidId.php               # 共用 trait
│   │   │
│   │   ├── Providers/
│   │   │   ├── AppServiceProvider.php
│   │   │   ├── DomainServiceProvider.php           # 自動發現 Domain/*/ServiceProvider
│   │   │   └── RouteServiceProvider.php
│   │   │
│   │   └── Exceptions/
│   │       ├── DomainException.php                 # 業務 exception base
│   │       └── Handler.php                         # 統一 RFC 7807
│   │
│   ├── bootstrap/
│   │   ├── app.php                          # middleware alias 註冊 + RateLimiter 設定
│   │   └── providers.php
│   │
│   ├── config/
│   │   ├── auth.php                         # guards: api (jwt)
│   │   ├── jwt.php                          # POSS jwt-auth config（TTL / algo / blacklist）
│   │   ├── permission.php                   # spatie config
│   │   ├── scribe.php                       # API docs config（auth.in=bearer）
│   │   └── ...
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── *_create_users_table.php
│   │   │   ├── *_create_permission_tables.php      # spatie
│   │   │   ├── *_create_token_blacklist_table.php
│   │   │   ├── *_create_audit_logs_table.php
│   │   │   ├── *_create_verification_tokens_table.php
│   │   │   └── *_create_password_reset_tokens_table.php
│   │   ├── seeders/
│   │   │   ├── DatabaseSeeder.php
│   │   │   ├── RoleSeeder.php                      # FR30: admin/editor/member 三角色
│   │   │   ├── AdminUserSeeder.php                 # FR30: 預設 admin 帳號
│   │   │   └── DemoMembersSeeder.php               # FR30: 示範會員
│   │   └── factories/
│   │       ├── UserFactory.php
│   │       └── AuditLogFactory.php
│   │
│   ├── routes/
│   │   └── api.php                          # 所有 endpoint（無 web.php）
│   │
│   ├── tests/
│   │   ├── Pest.php
│   │   ├── TestCase.php
│   │   ├── CreatesApplication.php
│   │   ├── Feature/
│   │   │   ├── Auth/
│   │   │   │   ├── RegistrationTest.php            # FR1-3 關鍵路徑
│   │   │   │   ├── LoginTest.php                   # FR4-5
│   │   │   │   ├── TokenRefreshTest.php            # FR11-14 關鍵路徑
│   │   │   │   ├── PasswordChangeTest.php
│   │   │   │   └── PasswordResetTest.php
│   │   │   └── Member/
│   │   │       ├── MemberListingTest.php           # FR17
│   │   │       ├── MemberSuspendTest.php           # FR18-19 + FR26 audit
│   │   │       ├── RoleAssignTest.php              # FR22 + FR24 cache + FR26 audit
│   │   │       ├── RbacGatingTest.php              # FR23 關鍵路徑
│   │   │       └── AuditLogTest.php                # FR28
│   │   └── Unit/
│   │       └── Domain/
│   │           ├── Auth/
│   │           │   ├── TokenIssuerTest.php
│   │           │   └── JwtBlacklistTest.php        # 關鍵路徑
│   │           └── Member/
│   │               └── AuditLoggerTest.php         # 關鍵路徑
│   │
│   ├── composer.json
│   ├── phpunit.xml -> pest.xml             # Pest config
│   ├── pint.json                            # Laravel pint formatter
│   ├── phpstan.neon                         # larastan config
│   └── .env.example
│
├── frontend/                                # React 19 SPA
│   ├── public/
│   │   ├── favicon.svg
│   │   └── robots.txt                       # Disallow: /（私有後台 NFR）
│   ├── src/
│   │   ├── main.tsx                         # 入口 + fontsource imports
│   │   ├── App.tsx                          # Root component
│   │   ├── routeTree.gen.ts                 # TanStack Router 生成
│   │   │
│   │   ├── routes/                          # TanStack Router file-based
│   │   │   ├── __root.tsx                   # AuthProvider + QueryClient + ErrorBoundary
│   │   │   ├── index.tsx                    # / → redirect
│   │   │   ├── login.tsx                    # /login
│   │   │   ├── register.tsx                 # /register
│   │   │   ├── verify.$token.tsx            # /verify/:token
│   │   │   ├── password-reset.tsx           # /password-reset
│   │   │   ├── _authenticated.tsx           # 受保護 layout
│   │   │   └── _authenticated/
│   │   │       ├── me/
│   │   │       │   ├── index.tsx            # /me
│   │   │       │   └── password.tsx
│   │   │       └── admin/
│   │   │           ├── members/
│   │   │           │   ├── index.tsx        # /admin/members
│   │   │           │   └── $id.tsx          # /admin/members/:id
│   │   │           ├── roles.tsx
│   │   │           └── audit.tsx
│   │   │
│   │   ├── features/                        # ★ Domain Boundary
│   │   │   ├── auth/                        # 框架（fork 保留）
│   │   │   │   ├── AuthContext.tsx          # ★ 中央 auth state
│   │   │   │   ├── AuthProvider.tsx
│   │   │   │   ├── authReducer.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   └── useRequireAuth.ts
│   │   │   │   ├── api/
│   │   │   │   │   ├── login.ts
│   │   │   │   │   ├── logout.ts
│   │   │   │   │   ├── refresh.ts
│   │   │   │   │   ├── register.ts
│   │   │   │   │   ├── verify.ts
│   │   │   │   │   └── passwordReset.ts
│   │   │   │   ├── schemas/                 # zod schemas
│   │   │   │   │   ├── login.ts
│   │   │   │   │   └── register.ts
│   │   │   │   └── components/
│   │   │   │       ├── LoginForm.tsx
│   │   │   │       ├── RegisterForm.tsx
│   │   │   │       └── LoginHero.tsx        # cream + Cormorant + dark navy illustration
│   │   │   │
│   │   │   └── members/                     # 範例業務（fork 可刪）
│   │   │       ├── api/
│   │   │       │   ├── listMembers.ts
│   │   │       │   ├── suspendMember.ts
│   │   │       │   ├── assignRoles.ts
│   │   │       │   └── getAuditLogs.ts
│   │   │       ├── hooks/
│   │   │       │   ├── useMembers.ts        # TanStack Query
│   │   │       │   └── useAuditLogs.ts
│   │   │       ├── schemas/
│   │   │       └── components/
│   │   │           ├── MemberTable.tsx
│   │   │           ├── MemberDetailSheet.tsx
│   │   │           ├── SuspendDialog.tsx
│   │   │           ├── AssignRolesSheet.tsx
│   │   │           ├── AuditLogTable.tsx
│   │   │           └── AuditDetailSheet.tsx  # dark navy code-window
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                          # shadcn 元件
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── ... (其餘 ~15 shadcn 元件)
│   │   │   ├── custom/                      # 自製
│   │   │   │   ├── RoleBadge.tsx
│   │   │   │   ├── PageHeading.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── CodeWindow.tsx
│   │   │   │   ├── CommandPalette.tsx
│   │   │   │   ├── ConfirmDestructive.tsx
│   │   │   │   └── TokenStatusIndicator.tsx  # dev only
│   │   │   └── layout/                      # 抄自 satnaing/shadcn-admin
│   │   │       ├── AppShell.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Topbar.tsx
│   │   │       ├── Breadcrumb.tsx
│   │   │       └── ErrorFallback.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                       # ★ axios instance + interceptors
│   │   │   ├── query-client.ts
│   │   │   ├── utils.ts                     # cn() helper, format helpers
│   │   │   └── case-transform.ts            # snake ↔ camel 轉換
│   │   │
│   │   ├── styles/
│   │   │   └── globals.css                  # CSS variables + Tailwind base
│   │   │
│   │   ├── assets/
│   │   │   └── empty-states/                # SVG line-art
│   │   │       ├── members-empty.svg
│   │   │       ├── audit-empty.svg
│   │   │       ├── search-no-results.svg
│   │   │       └── error-404.svg
│   │   │
│   │   └── vite-env.d.ts
│   │
│   ├── tests/
│   │   ├── setup.ts                         # Vitest global setup（RTL + matchers）
│   │   └── fixtures/
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   └── .env.example
│
├── docker/
│   ├── nginx/
│   │   ├── Dockerfile
│   │   ├── default.conf                     # 同網域反代 /api → php-fpm; / → vite
│   │   └── nginx.conf
│   ├── php-fpm/
│   │   ├── Dockerfile                       # PHP 8.3 + extensions（pgsql, pdo, etc.）
│   │   ├── php.ini
│   │   ├── www.conf                         # php-fpm pool 設定
│   │   └── docker-entrypoint.sh             # 首次啟動 migrate + seed
│   ├── postgres/
│   │   ├── Dockerfile                       # postgres:17-alpine + init scripts
│   │   └── init.sql                         # 預設 schema、extensions
│   └── node/
│       └── Dockerfile                       # 若需要 production build 用
│
├── bin/
│   ├── new-project.sh                       # ★ FR31-32 fork 腳本
│   ├── reset-dev.sh                         # 重置 dev 環境（drop DB + rebuild）
│   └── export-openapi.sh                    # 跑 Scribe export 到 docs/api/
│
├── docs/
│   ├── decisions/                           # ★ FR33 ADRs ≥ 5
│   │   ├── 0001-record-architecture-decisions.md
│   │   ├── 0002-jwt-over-sanctum.md
│   │   ├── 0003-self-written-docker-compose-vs-sail.md
│   │   ├── 0004-postgresql-over-mysql.md
│   │   ├── 0005-spatie-permission-package.md
│   │   ├── 0006-token-storage-strategy.md
│   │   ├── 0007-domain-boundary-pattern.md
│   │   └── 0008-rfc-7807-error-format.md
│   ├── api/
│   │   ├── openapi.json                     # FR37 Scribe export
│   │   └── README.md
│   └── README.md                            # docs 目錄總索引
│
└── _bmad-output/                            # BMad artifacts（已存在）
    └── planning-artifacts/
```

### Architectural Boundaries

#### API Boundaries（PRD endpoints 對映）

| Endpoint | Controller | Service | Domain |
|---|---|---|---|
| `POST /api/auth/register` | `AuthController@register` | `Domain\Auth\Services\TokenIssuer` + `EmailVerifier` | Auth |
| `POST /api/auth/verify/{token}` | `AuthController@verify` | `EmailVerifier` | Auth |
| `POST /api/auth/login` | `AuthController@login` | `TokenIssuer` | Auth |
| `POST /api/auth/refresh` | `TokenController@refresh` | `TokenRefresher` + `JwtBlacklist` | Auth |
| `POST /api/auth/logout` | `AuthController@logout` | `JwtBlacklist` | Auth |
| `POST /api/auth/password/reset-request` | `AuthController@requestReset` | `PasswordResetter` | Auth |
| `POST /api/auth/password/reset` | `AuthController@reset` | `PasswordResetter` | Auth |
| `GET/PATCH /api/me` | `ProfileController` | (Eloquent direct) | Auth |
| `POST /api/me/password` | `ProfileController@changePassword` | (Eloquent + hash) | Auth |
| `GET /api/admin/members` | `MemberController@index` | (Eloquent + filter) | Member |
| `PATCH /api/admin/members/{id}` | `MemberController@update` | `MemberSuspender` | Member |
| `POST /api/admin/members/{id}/roles` | `RoleController@assign` | `RoleAssigner` | Member |
| `POST /api/admin/members/{id}/password` | `MemberController@resetPassword` | `MemberPasswordResetter` | Member |
| `GET /api/admin/audit-logs` | `AuditLogController@index` | (Eloquent + filter) | Member |
| `GET /api/docs` | Scribe-generated | — | (Scribe service provider) |

#### Component Boundaries（Frontend）

- **`components/ui/`** = shadcn 元件，**不修改** upstream pattern（保持可升級）
- **`components/custom/`** = 本案自製，**只用 Anthropic token / shadcn primitives**，不依賴 `features/`
- **`components/layout/`** = 抄自 shadcn-admin 改造，依賴 `features/auth`（讀 role）但不依賴 `features/members`
- **`features/auth/`** = 提供 `AuthContext` 給整個 app；其他 features 透過 `useAuth()` 讀 user / role
- **`features/members/`** = 範例業務；**fork 時可整段刪除**，不影響 auth 框架

#### Service Boundaries（Backend）

- **跨 Domain 通訊**：禁止 `Domain\Member` 直接 `new Domain\Auth\Services\TokenIssuer()`；透過 **Service Container 注入**（DomainServiceProvider 註冊 binding）
- **Contract pattern**：未來若擴張，可在 `Domain/Auth/Contracts/` 加 interface，Member 依賴 interface 而非 concrete
- **Event 通訊**：Domain 之間用 Event / Listener 解耦（例：`UserSuspended` event → Member domain emit → 未來 Notification domain listen）

#### Data Boundaries

- **`users` 表**屬於 Auth domain（Eloquent Model 在 `Domain\Auth\Models`）
- **`audit_logs` 表**屬於 Member domain（記錄業務操作）
- **`token_blacklist` 表**屬於 Auth domain
- **spatie tables**（roles/permissions/model_has_roles）屬於 Auth domain（套件慣例）

### Requirements to Structure Mapping

| FR Range | 主要位置 |
|---|---|
| **FR1-8（Auth & Identity）** | `backend/app/Domain/Auth/` 全部 + `frontend/src/features/auth/` |
| **FR9-14（Session & Token）** | `Domain/Auth/Services/{TokenIssuer,TokenRefresher,JwtBlacklist}` + `frontend/src/lib/api.ts`（interceptor）+ `frontend/src/features/auth/AuthContext.tsx` |
| **FR15-16（Profile）** | `Domain/Auth/Controllers/ProfileController` + `frontend/src/routes/_authenticated/me/` |
| **FR17-20（Member Admin）** | `Domain/Member/Controllers/MemberController` + `frontend/src/features/members/` |
| **FR21-25（RBAC）** | `Domain/Member/Controllers/RoleController` + Spatie config + Policy/Gate + `Sidebar` 角色 badge |
| **FR26-28（Audit Log）** | `Domain/Member/Services/AuditLogger` + `Observers/AuditableObserver` + `frontend/src/features/members/components/AuditDetailSheet` |
| **FR29-30（Docker compose + seeders）** | `docker/` + `docker-compose.yml` + `database/seeders/` + `docker/php-fpm/docker-entrypoint.sh` |
| **FR31-32（bin/new-project.sh）** | `bin/new-project.sh`（bash script） |
| **FR33-34（ADR + README）** | `docs/decisions/` + `README.md` |
| **FR35-37（API Docs）** | Scribe config + `docs/api/openapi.json` + `bin/export-openapi.sh` |
| **FR38（Module boundary）** | 整個 `Domain/` 結構 + `DomainServiceProvider` 自動發現機制 |

### Integration Points

#### Internal Communication

- **Frontend ↔ Backend**：HTTP JSON via nginx 反代；axios + TanStack Query
- **Backend Domain ↔ Domain**：Laravel Service Container + Events
- **Frontend Feature ↔ Feature**：透過 `features/auth/AuthContext`（全域）；其餘 features 之間獨立
- **Backend Model ↔ DB**：Eloquent ORM；migrations 管理 schema

#### External Integrations

- **MVP 階段**：**無外部整合**（email 寫 log）
- **第二階段**：SMTP、OpenAI / Anthropic / Voyage API（RAG）、Sentry / Logtail

#### Data Flow

```
[Browser] → nginx :8080 → /api/* → php-fpm → Laravel
                                              ├→ JwtAuthenticate middleware → User
                                              ├→ Policy check
                                              ├→ Controller → Service → Eloquent → Postgres
                                              ├→ Observer → AuditLogger → audit_logs
                                              └→ JsonResource → JSON response
[Browser] ← nginx :8080 ← /* ← Vite dev / built SPA
```

### File Organization Patterns

#### Configuration Files（root）

- `docker-compose.yml`：核心 services
- `docker-compose.override.yml`：使用者本機 override（.gitignored；`docker-compose.override.yml.example` 提供範例）
- `.env.example`：所有環境變數模板（fork 時複製成 `.env`）
- `.editorconfig` + `.gitattributes`：跨平台一致性（特別防 Windows CRLF）

#### Source Organization

- **Domain-first**（backend）：按業務 domain 而非技術層（不用 `app/Services`、`app/Repositories` 平行結構）
- **Feature-first**（frontend）：按業務 feature 而非元件類型（不用 `components/`、`hooks/`、`services/` 平行結構，但 shadcn UI / layout / custom 例外）

#### Test Organization

- **Backend**：分層放（Feature / Unit / Browser future），不 co-located
- **Frontend**：co-located（`MemberTable.test.tsx` 與 `MemberTable.tsx` 同目錄），符合 Vitest 慣例

### Development Workflow Integration

#### Development Server

- `docker compose up` 啟動 nginx + php-fpm + postgres + node
- nginx 反代到 8080：`/api/*` → php-fpm（Laravel）、`/*` → node（Vite dev with HMR）
- 開發者只開 `http://localhost:8080`，前後端在同 origin

#### Build Process

- **Backend**：production build 用 `composer install --no-dev --optimize-autoloader`；無 transpile 步驟
- **Frontend**：`pnpm build`（Vite production build）→ `frontend/dist/`；prod 時 nginx 直接 serve dist 而非 reverse proxy 到 node

#### Deployment Structure

- MVP：純本機 docker-compose；不部署
- 第二階段：`docker-compose.prod.yml` override 將 node service 換為 nginx serve `frontend/dist/`

## Architecture Validation Results

### Coherence Validation ✅

#### Decision Compatibility

| 維度 | 檢查 | 結果 |
|---|---|---|
| PHP 版本 vs Laravel | PHP 8.3+ 是 Laravel 12 最低要求 | ✅ 相容 |
| Postgres 17 vs Laravel 12 | Laravel 12 PG driver 完整支援 | ✅ 相容 |
| `php-open-source-saver/jwt-auth` v2.8.2 vs Laravel 12 | 套件已正式支援 Laravel 12 | ✅ 相容 |
| `spatie/laravel-permission` vs Laravel 12 | v7.x 完整支援，middleware alias 於 `bootstrap/app.php` 註冊 | ✅ 相容 |
| Scribe vs JWT bearer | 需手動設 `auth.in=bearer`；已記入 Domain-Specific Requirements | ✅ 相容（含 caveat） |
| React 19 vs Vite | Vite 6/7 全面支援 React 19 | ✅ 相容 |
| TanStack Router vs Vite | file-based routing + Vite plugin 流暢 | ✅ 相容 |
| shadcn/ui vs Tailwind 4 | shadcn 已升級支援 Tailwind 4 | ✅ 相容 |
| Pest v3 vs Laravel 12 | Laravel 12 預設選 Pest（PRD 已驗） | ✅ 相容 |
| Vitest + RTL vs React 19 | RTL v16 支援 React 19 | ✅ 相容 |

#### Pattern Consistency

| 檢查 | 結果 |
|---|---|
| 命名 convention 跨 backend / frontend 一致（snake API、camelCase code、PascalCase Class） | ✅ |
| Domain Boundary（Auth / Member）在 backend 與 frontend 對稱 | ✅ |
| 錯誤格式 RFC 7807 統一 | ✅ |
| Auth flow 跨 backend middleware + frontend interceptor 一致 | ✅ |
| Audit log Observer 模式 vs 手動寫入：強制 Observer | ✅ |

#### Structure Alignment

| 檢查 | 結果 |
|---|---|
| `app/Domain/*/ServiceProvider` 模式支援 Auto-discovery（FR38） | ✅ |
| `frontend/src/features/*/` 與 `app/Domain/*/` 對稱 | ✅ |
| `docker-compose.yml` services 對應 nginx 反代規則 | ✅ |
| `bin/new-project.sh` 改動範圍涵蓋所有 namespace / port / DB / git remote 點 | ✅（規格層面，實作需 W0 spike 驗） |

### Requirements Coverage Validation ✅

#### Functional Requirements Coverage（38/38）

| FR Range | 架構支援 |
|---|---|
| FR1-8（Auth & Identity） | ✅ Domain/Auth Controllers + Services + Models + Resources |
| FR9-14（Session & Token） | ✅ TokenIssuer + TokenRefresher + JwtBlacklist + axios interceptor + AuthContext |
| FR15-16（Profile） | ✅ ProfileController + 前端 /me 路由 |
| FR17-20（Member Admin） | ✅ MemberController + MemberSuspender + UI dialog |
| FR21-25（RBAC） | ✅ spatie + Policy + Sidebar role badge + middleware alias |
| FR26-28（Audit Log） | ✅ AuditableObserver（強制機制）+ AuditLogger + AuditLog model + sheet UI |
| FR29-30（Docker + seeders） | ✅ docker-compose.yml + entrypoint.sh + seeders |
| FR31-32（new-project.sh） | ✅ bin/new-project.sh（具體 sed/regex 待 W0 spike） |
| FR33-34（ADR + README） | ✅ docs/decisions/ 8 篇規劃 + README quickstart |
| FR35-37（API Docs） | ✅ Scribe + OpenAPI export script |
| FR38（Module Boundary） | ✅ Domain/ 結構 + DomainServiceProvider |

**全部 38 FRs 在架構層有具體支援；無 orphan。**

#### Non-Functional Requirements Coverage（20/20）

| NFR | 架構支援 |
|---|---|
| NFR1（FCP ≤ 1.5s） | Vite bundle splitting + lazy route loading（TanStack Router 自動）|
| NFR2（bundle ≤ 250KB gzipped） | Vite tree-shaking + shadcn copy-paste 只拉用到的元件 |
| NFR3（API p95 ≤ 300ms） | Eloquent eager loading + indexes（前文 schema 已列）+ DB 連線池 |
| NFR4（staleTime ≥ 30s） | TanStack Query global default |
| NFR5（access TTL ≤ 15min） | jwt.php config `ttl=15` |
| NFR6（refresh TTL ≤ 7d + rotation） | jwt.php `refresh_ttl=10080` + TokenRefresher.rotate() |
| NFR7（bcrypt cost ≥ 12） | `config/hashing.php` 設 `bcrypt.rounds=12` |
| NFR8（security headers） | `Http/Middleware/SecurityHeaders.php` |
| NFR9（rate limits） | `bootstrap/app.php` RateLimiter::for() |
| NFR10（audit append-only） | DB trigger 或 Model::saving event 阻擋 update/delete |
| NFR11（verification token TTL ≤ 24h + 單次使用） | VerificationToken model + `expires_at` + `used_at` |
| NFR12（WCAG AA） | shadcn/Radix + axe-core CI 整合 |
| NFR13（鍵盤導航） | Radix 內建 |
| NFR14（對比度 ≥ 4.5:1） | DESIGN.md token 已驗證 |
| NFR15-16（Pest/Vitest 60%） | `pest --coverage` / `vitest run --coverage` |
| NFR17（關鍵路徑必測） | tests/Feature 與 tests/Unit 對應路徑 |
| NFR18（≥ 5 ADR） | docs/decisions/ 已規劃 8 篇 |
| NFR19（README quickstart ≤ 200 字） | README 規格約束 |
| NFR20（fork → 業務開發 ≤ 2h） | bin/new-project.sh + seeders + ADR 共同支撐 |

### Implementation Readiness Validation

#### Decision Completeness

- ✅ 所有 critical decisions 含具體版本（POSS jwt-auth v2.8.2、Postgres 17、Laravel 12、React 19、Pest v3+）
- ✅ JWT 完整規格（TTL、algo、claims、storage、rotation、blacklist 表結構）
- ✅ RBAC 完整規格（3 角色、middleware alias 位置、Policy 模式）
- ✅ RFC 7807 錯誤格式範例
- ✅ Cross-cutting concerns 10 項全部點名 + 解法

#### Structure Completeness

- ✅ 完整 monorepo 目錄樹（backend / frontend / docker / bin / docs / _bmad-output）
- ✅ Domain 分層 + 對稱 features/
- ✅ 38 FRs 全部對應到具體 file 位置
- ✅ Test 結構分層（Feature / Unit / co-located frontend test）

#### Pattern Completeness

- ✅ Naming（DB / API / Backend Code / Frontend Code）四面向 convention
- ✅ Structure（backend / frontend / test 位置）
- ✅ Format（API envelope / JSON case / 日期 / boolean）
- ✅ Communication（Event / Audit Observer / Frontend state）
- ✅ Process（Error / Loading / Validation / Auth flow）
- ✅ Good / Anti-pattern 範例

### Gap Analysis Results

#### Critical Gaps：**0**

無阻擋實作的 gap。

#### Important Gaps（需在 W0 spike 或 W1 開頭解決）

1. **`bin/new-project.sh` 具體 sed/regex 規則**——架構文件描述功能與互動 UX，但實際的「namespace 字串如何在 14 個檔案內安全替換」需具體腳本實作。W1 內完成。
2. **Frontend axios 401 並發處理**——多個 request 同時收 401 時，如何 queue 並等待單次 refresh 完成？需用 mutex 或 promise pool 實作。W0 spike 必驗。
3. **Token rotation 在 DB transaction 內**——`refresh` endpoint 需 `DB::transaction()` 包裹「核發新 token + 舊 jti 寫 blacklist」確保 atomic。架構已標示，實作需確認。
4. **Audit log append-only 強制機制**——靠 DB trigger 還是 Eloquent saving event？需在 W3 決定。預設用 Eloquent event（Model::saving 阻擋 update / delete），DB trigger 留第二階段。
5. **Windows Docker 開發實測**——W0 spike 必須驗證 named volumes 是否解決 file watcher 慢的問題。

#### Nice-to-Have Gaps（deferred）

1. **Audit log retention policy**——多久 archive / delete？MVP 不限制（純練手）；第二階段考慮 90 天後歸檔。
2. **OpenTelemetry / structured logging**——MVP 用 Laravel default log；第二階段升級。
3. **Pre-commit hook（Husky）**——MVP 手動 lint；第二階段加 hook。
4. **Storybook for custom components**——MVP 跳過；第二階段加（依時間）。
5. **多語系 i18n**——明確 MVP OUT；第二階段。

### Validation Issues Addressed

#### 已在架構文件解決的 cross-cutting concerns

10 個 cross-cutting concerns（見 Project Context Analysis）每一個都有對應的架構決策與 file 位置。摘要：

- Token rotation atomicity → `DB::transaction()` in TokenRefresher
- Spatie cache vs JWT stateless → access TTL ≤ 15min + access token 不 embed permissions
- Audit log 強制機制 → Observer pattern + AuditableObserver trait
- CORS / Cookie / CSRF → 同網域反代讓三者統一；Laravel CSRF 在 `/api/*` 關閉
- Domain Boundary → DomainServiceProvider 自動發現 + ServiceProvider per Domain
- Dev/Prod parity → nginx 反代在 dev 也跑（不只 prod）
- Fork-friendliness → 所有環境差異集中 `.env`
- Windows Docker → named volumes（非 bind mount）+ `.gitattributes` lf line ending
- Seeders auto-run → docker-entrypoint.sh 偵測首次啟動
- OpenAPI export pipeline → bin/export-openapi.sh + 第二階段 CI 整合

### Architecture Completeness Checklist

#### Requirements Analysis

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed（medium / web_app + api_backend / greenfield）
- [x] Technical constraints identified（10 cross-cutting concerns）
- [x] Cross-cutting concerns mapped

#### Architectural Decisions

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined（Domain Service Container、Events、Observer）
- [x] Performance considerations addressed（NFR1-4 對映實作）

#### Implementation Patterns

- [x] Naming conventions established（DB / API / Code 三面向）
- [x] Structure patterns defined（Domain-first backend、feature-first frontend）
- [x] Communication patterns specified（Event、Observer、TanStack Query、AuthContext）
- [x] Process patterns documented（Error / Loading / Validation / Auth flow）

#### Project Structure

- [x] Complete directory structure defined（完整目錄樹 ~150 行）
- [x] Component boundaries established（API / Component / Service / Data）
- [x] Integration points mapped（Frontend ↔ Backend、Domain ↔ Domain、Data flow）
- [x] Requirements to structure mapping complete（38 FRs 全對映）

**16/16 ✓**

### Architecture Readiness Assessment

**Overall Status:** **READY WITH MINOR GAPS** ✅

理由：16/16 checklist 全勾 + 0 Critical Gaps，但有 5 個 Important Gaps 需在 W0 spike 或 W1 開頭解決（皆為實作層細節，非架構決策缺失）。

**Confidence Level:** **High**

理由：

- 所有 38 FRs / 20 NFRs 架構支援完整
- 10 個 cross-cutting concerns 全部點名 + 解法
- Tech stack 全部相容（含具體版本）
- Patterns 覆蓋 naming / structure / format / communication / process 五面向
- 與 PRD / UX spec 完全一致，無敘事衝突

#### Key Strengths

1. **Domain Boundary 設計可 fork**——Auth 框架與 Member 範例業務嚴格分離，`bin/new-project.sh` 刪 Member 不破 Auth
2. **JWT 規格完整**——從 token 結構、儲存、rotation、撤銷、cache 都有具體實作位置
3. **Anti-pattern 顯式列出**——避免「為求快妥協」的工程紀律由架構強制
4. **與 UX spec 緊密對齊**——element-by-element 對映 PRD User Journeys 與 UX Component Strategy
5. **第二階段 AI 已預留**——pgvector、queue 入口、API versioning 在 MVP 已設計位置

#### Areas for Future Enhancement

1. CI/CD（GitHub Actions）+ pre-commit hook（第二階段）
2. OpenTelemetry / Sentry 觀測（第二階段）
3. Real-time（Laravel Reverb）integration（第二階段）
4. Multi-tenancy 模型（若擴張到 SaaS）
5. Storybook documentation（時間允許時）

### Implementation Handoff

#### AI Agent Guidelines

實作 agent 必須遵循：

1. **架構文件為 source of truth**——遇到設計歧異點，本文件優先於個人習慣
2. **遵循 Domain Boundary**——`Domain/Auth/` vs `Domain/Member/`、`features/auth/` vs `features/members/` 嚴格隔離
3. **使用 Policy / Gate 守門**——禁止 controller 內 `hasRole()`
4. **保持 RFC 7807 錯誤格式**——所有 endpoint 統一
5. **使用 ULID for user-facing IDs**——對外不洩漏 auto-increment
6. **寫測試覆蓋關鍵路徑**——FR1-3 / FR9-14 / FR21-25 / FR26-28 必有 Feature test
7. **遇到未決議的歧異點**——先寫 ADR 進 `docs/decisions/` 再實作

#### First Implementation Priority（W0 spike）

W0 必驗證：

```bash
# 1. 起 docker stack + nginx 反代
docker compose up

# 2. backend：裸 Laravel 12 + JWT POSS + spatie + Scribe
composer create-project laravel/laravel backend
# (見 Starter Template Evaluation 詳細指令)

# 3. frontend：Vite + React 19 + TanStack Router + shadcn + 抄 satnaing/shadcn-admin layout
pnpm create vite@latest frontend --template react-ts
# (見 Starter Template Evaluation 詳細指令)

# 4. 驗證 axios 401 攔截器 + JWT refresh rotation 在前端流暢運作
# 5. 驗證 Windows Docker volume 行為（bind mount 慢的話切 named volume）
# 6. ADR-001（記錄架構決策方法）+ ADR-002（JWT over Sanctum）寫入 docs/decisions/
```

完成 W0 spike → W1 開始正式 build。

