# 0002 — 採用 JWT（php-open-source-saver/jwt-auth）而非 Laravel Sanctum

- **Status**: Accepted
- **Date**: 2026-05-15
- **Deciders**: Jie（developer / solo maintainer）
- **Story**: 1.1 W0 Spike
- **Related FR/NFR**: FR9-FR14, FR23, NFR5, NFR6, NFR19；PRD Anti-Patterns（access token 禁 localStorage / sessionStorage）

## Context

bmad-project 要作為**個人後台 starter kit**，被 fork 重用。認證策略有兩條主流路：

1. **Laravel Sanctum + SPA cookie session**：Laravel 官方推薦、SameSite cookie + CSRF token、stateful、與 framework 無縫整合
2. **JWT bearer token（access in-memory + refresh httpOnly cookie + 401 silent refresh + rotation + jti blacklist）**：stateless、複雜度顯著高、需自己處理 token lifecycle 與並發 401 queue

**選 JWT 不是因為它「比較好」**——選 JWT 是因為這個 starter 的教育目標：

- **First-principles 學會 token 認證的完整面**：刻意走難路，把每個面向（access TTL / refresh rotation / blacklist / silent refresh / 並發 queue）都自己實作一次
- **可移植性**：bearer header 跨前後端不耦合於同網域 cookie，未來若拆 frontend 到別處（CDN、行動 app）較容易
- **可學習可被反向參考**：Sanctum 把太多東西藏在 framework 內，學習價值低
- **強制紀律**：access token **禁** localStorage / sessionStorage（PRD anti-pattern），逼開發者面對「token 儲存」這個本質問題，而非默默用 framework 預設

明確的反方理由（壞處）也認知：JWT 的 stateless 本性與 RBAC / Spatie permission cache 衝突（Story 3.4 處理）、refresh rotation race condition 棘手、axios 多並發 401 queue 工程複雜（Story 2.2 處理）、Logout 需自管 blacklist（Story 2.1 處理）。這些壞處全部接受。

## Decision

採用 **`php-open-source-saver/jwt-auth` v2.8.2**（Tymon JWT auth 的 maintained fork），HS256 演算法，並訂定以下參數：

### Token 規格

| 項目 | 值 | 來源 |
|---|---|---|
| 套件 | `php-open-source-saver/jwt-auth` | `composer require` |
| 版本 | `^2.8.2` | rocked at Story 1.1 W0 spike |
| 演算法 | HS256（HMAC SHA-256） | `config/jwt.php` 預設 |
| Secret | `JWT_SECRET` env var | `php artisan jwt:secret` 產生 |
| Access TTL | **15 分鐘** | NFR5 |
| Refresh TTL | **7 天** | NFR6 |
| Access 儲存位置 | **記憶體**（前端 module-level 變數 / React Context） | PRD Anti-Pattern：禁 localStorage / sessionStorage |
| Refresh 儲存位置 | **httpOnly cookie**（HttpOnly + Secure + SameSite=Lax） | FR10 |
| Refresh Rotation | 啟用，每次 refresh 換新 jti | Story 2.1 實作 |
| Revocation | jti blacklist 寫入 cache | Story 2.1 實作 |
| Guard | `auth:api` driver=`jwt` | `config/auth.php` |

### 與 Sanctum 的決裂

- W0 spike 在 `composer create-project` 後**立即** `composer remove laravel/sanctum`，明確視覺信號
- `app/Http/Controllers/AuthSpikeController.php` 是 spike-only 過渡，Story 1.2 會搬入 `app/Domain/Auth/`
- W0 階段的 `/api/auth/refresh-spike` 是 stub endpoint，Story 2.1 會被真正的 `/api/auth/refresh`（含 rotation + blacklist）取代並刪除

### Frontend 端

- access token 用 `let token: string | null = null` module-level 存 + 透過 React Context 廣播
- axios `Authorization: Bearer <token>` request interceptor
- response interceptor 偵測 401 → 呼叫 refresh → retry **單一** request（W0 概念驗證）；多並發 queue（mutex / promise pool）留 Epic 2 Story 2.2

## Consequences

### Good

- 完整實作 token 認證的所有面向（rotation、blacklist、silent refresh、並發 queue），學習價值極高
- bearer header 可移植到非同網域場景（未來行動 app / CDN 拆分）
- 與「access in-memory」紀律配合，強制每次 page reload 走 silent refresh 路徑（FR11），避免「半永久登入」這個 anti-pattern
- 認證流可以 unit-test stateless 部分，比 cookie session 容易測

### Bad

- 自己要處理：401 retry queue、token storage、rotation race condition、blacklist cache 失效——這些 Sanctum 不會碰
- access in-memory 代表 page refresh 後**一定**會有一次短暫的「未登入感」（silent refresh 期間，~100-300ms），需 UX 處理（Story 2.2 與 UX design `loading-states` pattern）
- Spatie permission cache 與 JWT stateless 性質衝突：cache 用 stateless 不會自動失效，需手動 clear（Story 3.4 處理）
- jwt-auth v2.8.2 是 Tymon 的 fork，不是 Laravel 官方背書 —— 若上游停更需自行 fork 或換套件（風險評估：fork 本身有活躍維護，2024-2025 持續釋出 minor）
- 不能用 Laravel 內建 `Auth::guard('web')` cookie 流程的所有 helper（CSRF、`remember me`、native session）

### Tracking

- W0 spike 驗證：login → bearer token → 受保護 endpoint → 過期 → 401 → refresh stub → retry 成功（單一 request）
- Story 2.1 必須補上：真 refresh rotation、jti blacklist、`/api/auth/refresh-spike` 刪除
- Story 2.2 必須補上：axios 多並發 401 queue（mutex / promise pool）
- Story 3.4 必須處理：Spatie cache 失效機制（assignRole / revokeRole / syncRoles 後清 cache）
- 若 jwt-auth 上游停更超過 6 個月或出 CVE 未修，**重新評估**並寫 ADR 0009 superseding 本決策

## Alternatives Considered

### Laravel Sanctum（SPA cookie session）

- ✅ Laravel 官方推薦、開箱整合
- ✅ stateful、無需自管 token lifecycle
- ✅ CSRF + SameSite cookie 安全模型成熟
- ❌ 教育價值低（太多東西藏在 framework 內）
- ❌ 不可移植（同網域 cookie 假設強）
- ❌ 違反本 starter「first-principles 教學」核心意圖
- **Reject**：與專案目標不符

### Laravel Passport（OAuth2 server）

- ✅ 完整 OAuth2 規格
- ✅ 適合多 client 場景
- ❌ 對 personal admin starter 過重
- ❌ 學習曲線陡，第一次摸 token 認證的人會被 OAuth 流程淹沒
- **Reject**：複雜度與目標不匹配

### Firebase Auth / Auth0（hosted IdP）

- ✅ 免自管認證
- ✅ MFA / social login 開箱
- ❌ 違反「starter kit 可被 fork 不依賴 SaaS」原則
- ❌ vendor lock-in
- ❌ 教育價值低（黑箱）
- **Reject**

### 自己手刻 JWT（不用套件）

- ✅ 完全掌控
- ❌ 安全敏感（HMAC / RS256 / jti / leeway）容易出錯
- ❌ 工程量大幅膨脹，無對應教育收益
- **Reject**：用成熟 jwt-auth 套件 + 自己處理 storage / interceptor / rotation 已是平衡點

## References

- [`php-open-source-saver/jwt-auth`](https://laravel-jwt-auth.readthedocs.io/) — 套件文件
- `_bmad-output/planning-artifacts/architecture.md` § JWT 設計（line 405-417）— 完整 JWT 規格
- `_bmad-output/planning-artifacts/architecture.md` § axios Interceptor（line 533-560）— 401 interceptor 概念碼
- `_bmad-output/planning-artifacts/prd.md` § Anti-Patterns — access token 禁 localStorage / sessionStorage
- `_bmad-output/planning-artifacts/prd.md` § Functional Requirements — FR9-FR14（認證流程）、FR23（RBAC）
- `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements — NFR5（access TTL ≤ 15min）、NFR6（refresh TTL ≤ 7d）、NFR19（密碼 bcrypt 60 字元欄位）
