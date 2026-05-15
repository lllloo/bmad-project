---
title: "Product Brief: bmad-project"
status: "complete"
created: "2026-05-15"
updated: "2026-05-15"
inputs: []
---

# Product Brief：能撐住多個 side project 的 Laravel + React + AI starter kit（暫名 bmad-project）

## Executive Summary

這不是「再寫一個後台 starter kit」，而是**一份能撐住多個 side project 的 Laravel + React + AI-ready 骨架**——把 Inertia / Sanctum / Sail 這些「省事但抽掉設計權」的便利選項全部換掉，正面處理 CORS、JWT token rotation、自寫 Docker 編排、RBAC API 設計這些**真正會出現在實際 side project 與接案場景**的核心能力。

第一階段：**MVP 是地基**，含三角色 RBAC、JWT 完整 token 流程（access + refresh rotation + 撤銷清單）、Admin / 會員雙端、Audit log、Scribe API 文件、Pest + Vitest 測試。第二階段：**AI 才是這份 starter kit 的真正 punchline**——以 RAG 為 P0、Agent / Chat / 內容輔助 / NL→SQL 為 P1–P2，把 2026 後台基本功（pgvector / MCP / LLM 整合）直接灌進骨架，下一個 side project 就用得到。

評估指標只看三件事：**side project 啟動速度、可重用性、技術深度**。

## The Problem

問題不在「我需要一個後台」，而是「**我需要一個能讓我快速起 side project 的可重用骨架**」。

現況痛點：

- **Laravel 官方四個 starter kit 全是 Inertia / Sanctum 路線** — 一鍵能跑，但把 CORS、token、refresh、前後端版本化這些核心能力全抽掉，要接純 React API 仍得從頭來。
- **shadcn-admin 之類前端樣板沒有後端** — UI 漂亮，auth / RBAC / 文件全要自己接。
- **Filament / Nova 走 Livewire / Vue Inertia** — 完全用不到 React 那邊的東西。
- **網路教學多半是「JWT + Laravel + Vue」單一段落 demo** — 看完還是要自己把零件兜回去。
- **每次起新 side project 都重新寫一次 auth、權限、Docker、文件** — 時間花在重複造輪子而非真正想做的東西（例如 AI）。

代價：每個 side project 的前 1–2 週都耗在基礎建設、永遠停在「下次再認真做完」。

## The Solution

**核心哲學**：拒絕 opinionated 黑盒，每一層都要看得穿（first principles over convenience）。

**MVP 架構**：

- **後端**：Laravel 12 + PostgreSQL
- **前端**：React 19 + Vite + TanStack Router/Query + shadcn/ui（layout 起點抄 `satnaing/shadcn-admin`）
- **認證**：`php-open-source-saver/jwt-auth` v2.8.2 — access token（短命，記憶體）+ refresh token（httpOnly cookie + rotation）+ **撤銷清單儲存在 DB（jti blacklist table），不引入 Redis**
- **權限**：`spatie/laravel-permission` 三角色（admin / editor / member） + Policy / Gate（**禁止把 `hasRole()` 撒在 controller**）
- **基礎設施**：自寫 docker-compose（nginx + php-fpm + postgres + node），**dev 與 prod 都走 nginx 反代到同一個 8080**（禁止 Vite dev server 直連，確保 dev/prod cookie 與 CORS 行為一致）
- **文件**：Scribe 產生帶 try-it-out 的 API 文件（含 JWT bearer 設定）
- **測試**：Pest（後端） + Vitest + RTL（前端）
- **模組邊界**：`app/Domain/Auth/`（框架，未來 fork 保留）與 `app/Domain/Member/`（範例業務，fork 時可刪）；前端同理分 `src/features/auth/` 與 `src/features/members/`
- **未來自我 DX**：完整 seeders（roles + admin + demo members）、`docs/decisions/` ADR、README 30 秒 quickstart + 踩坑筆記、`bin/new-project.sh` 一鍵 fork 腳本

**MVP 可驗收場景**：

1. 註冊 → email log 取驗證連結 → 驗證 → 登入
2. 登入後拿 access + refresh，access 過期能自動 refresh，登出能撤銷
3. Profile 頁可改密碼、改名
4. Admin 可列會員、停權、改密碼、指派角色
5. 三角色登入後選單與 API 權限不同
6. Audit log 記錄敏感操作（停權、改角色、改密碼）
7. Scribe try-it-out 可完整跑通 JWT 流程

**Email**：MVP 僅寫 log；真實 SMTP 留到第二階段（但 token 生成、過期、單次使用要做到位）。
**Deploy**：純本機 `docker compose up`，含 seeders auto-run。

## What Makes This Different

**反 opinionated、追求 first principles** —— 三個被多數人選的便利選項，全部刻意拒絕：

- **獨立 SPA 而非 Inertia** — 保留 CORS、token、refresh、版本化、跨服務 API 設計權與實作經驗
- **JWT 而非 Sanctum** — 強迫面對無狀態認證全套設計（token 儲存、rotation、撤銷、CSRF/XSS 防護）
- **自寫 docker-compose 而非 Sail** — 看穿 nginx fastcgi、php-fpm pool、postgres volume 每層
- **PostgreSQL 而非 MySQL** — 配合第二階段 pgvector
- **AI-first foundation** — pgvector schema 預留、queue 入口、token cost 觀測點在 MVP 階段就思考定位，避免第二階段大改

## Who This Serves

**主要使用者**：開發者本人。

- **短期**（一個月內）：本地 demo MVP，每個技術點親手實作一次。
- **中期**（半年內）：日後 side project / 接案 / AI PoC，`bin/new-project.sh` 一鍵起新專案，**2 小時內進入業務開發**。
- **長期**（一年以上）：作為個人「全棧 + AI 履歷」的程式碼樣本，可在面試、提案直接秀 repo。

**次要使用者**：將來基於此骨架 fork 的具體業務的終端使用者 — 不在本 brief 設計範圍。

## Capacity Assumptions

**每週投入時數**：**不設限**（隨興，依生活節奏調整）。
含意：W1–W4 時間軸是目標而非死線；但 W3 末的 stop-loss 仍生效，避免無限延期。

## Weekly Milestones（W0–W4）

| 週 | 交付物 |
|---|---|
| **W0**（半天–1 天） | **技術 spike**：驗證 `satnaing/shadcn-admin` + TanStack Router + JWT refresh 攔截器能整合運作；docker-compose nginx 反代到 Vite HMR + Laravel API；ADR-001 寫下決策 |
| **W1** | docker-compose 完整跑通（nginx + php-fpm + postgres + node + 同網域反代）、`bin/new-project.sh` 雛形、Laravel + Postgres 連線、基礎 JWT 登入登出、shadcn admin layout 拉起 |
| **W2** | JWT access + refresh rotation、撤銷清單（DB jti blacklist）、Profile、密碼重設（log）、前端 401 攔截器自動 refresh + queue 重試 |
| **W3** | RBAC 三角色 + Policy、Admin 端會員管理、Audit log；**末尾決策點 → 見 Stop-Loss** |
| **W4** | Scribe 文件 + JWT try-it-out、Pest + Vitest 補測、Seeders、ADR 補齊、README quickstart |

### Stop-Loss（W3 末強制決策點）

若 W3 末驗收場景**未完成 5/7**：

- **自動砍** Audit log + Scribe 到第二階段
- **保留** auth / RBAC / Docker / 雙端 / 三角色作為 MVP 收斂版本
- **重構 timebox**：W4 留給重構與測試的時間最多 3 天，超時直接進第二階段

## Success Criteria

### 技術完成度（必達）

- 三角色 RBAC + JWT refresh rotation + Audit log 完整可運作
- **關鍵路徑必測清單**（覆蓋率輔助指標）：
  - `auth/register → verify → login` 流程
  - `refresh rotation + 撤銷` 流程
  - `RBAC middleware + Policy` 守門
  - `Audit log` 寫入正確性
- 60% Pest / Vitest 覆蓋率作為**輔助**目標（line coverage，排除 Migrations/Console/路由生成檔）
- Scribe try-it-out 可跑通 JWT
- `docker compose up` 一鍵啟動 + seeders auto-run
- `bin/new-project.sh` 能在 < 5 分鐘內把這份 starter clone 成新專案骨架

### Side Project Readiness（個人 ROI — 可被驗證的 artifact）

- `docs/decisions/` 內 ≥ 5 篇 ADR（每篇 200–400 字），至少含：JWT vs Sanctum、自寫 compose vs Sail、PostgreSQL vs MySQL、RBAC 套件選擇、token 儲存策略
- README 內附「踩過的坑」清單

### 可重用性

- 第一次拿這份 starter 起新專案，**2 小時內進入業務開發**（`bin/new-project.sh` + seeders + ADR 共同支撐這個承諾）

## Anti-Patterns I Refuse

刻意先寫下「**不可以做什麼**」，作為工程紀律：

- ❌ JWT access token 存在 localStorage（XSS 反模式）
- ❌ `hasRole()` 撒在 controller 各處而非用 Policy / Gate
- ❌ dev 環境跳過 nginx 反代直連 Vite（破壞 dev/prod parity）
- ❌ 為了衝 60% 覆蓋率而排擠核心功能時間
- ❌ 為了「全部都做」而做不完 MVP（最大風險）
- ❌ 「先放 localStorage 之後再改」這種妥協

## Scope

### MVP IN

- 三角色 RBAC + Policy / Gate
- JWT access + refresh rotation + DB jti blacklist
- 會員端：註冊、Email log 驗證、登入、登出、密碼重設、Profile
- Admin 端：會員列表、停權、改密碼、指派角色
- Audit log（停權、改角色、改密碼）
- Scribe 文件 + JWT try-it-out
- 自寫 docker-compose（dev 也走 nginx 反代）
- Pest + Vitest 關鍵路徑必測 + 60% 輔助覆蓋率
- `app/Domain/Auth/`（框架）與 `app/Domain/Member/`（範例業務）邊界分離；前端同理
- Seeders（RoleSeeder + AdminUserSeeder + DemoMembersSeeder，docker entrypoint 自動跑）
- ADR ≥ 5 篇（`docs/decisions/`）
- README 30 秒 quickstart + 踩坑清單
- `bin/new-project.sh` 一鍵 fork 腳本

### MVP OUT（明確排除以鎖 scope）

- 任何 AI 功能（保留第二階段）
- 真實 SMTP 寄送
- 線上 deploy
- CI/CD（GitHub Actions）
- Queue / Job（Horizon、Reverb）
- 前端 i18n、Redis 快取
- E2E（Playwright）
- 任何業務功能（CMS、訂單、billing 等）

### 第二階段 — AI 後台（MVP 之後）

優先序明確：

| 優先 | 模組 | 理由 |
|---|---|---|
| **P0** | **RAG（pgvector）** | MVP 已預留 PostgreSQL，pgvector 入口最近；RAG 是 2026 後台最具備案最廣的 AI 能力 |
| **P1** | Agent / Tool use（function calling + MCP server） | 可與 Claude Code / Codex 形成 dogfooding 閉環，但工作量大需獨立 sprint |
| **P1** | LLM Chat 介面 | 相對 RAG 與 Agent 較簡單但完整 |
| **P2** | 內容輔助（改文案、摘要、翻譯） | 業務性強，等實際需求出現再做 |
| **P2** | NL → SQL 資料分析 | 風險高、要做 guardrail，留到最後 |

第二階段同時引入：上線部署、E2E、CI/CD、Queue、Real-time。

## Vision

兩到三年後，這份 starter kit 演化成**個人版的 Laravel + React + AI 應用平台骨架**：

- 任何想做的 side project 或接案，**fork 一次即得**完整 auth、RBAC、AI 整合、容器化、文件、測試
- 變成個人接案、PoC、hackathon 的底氣
- 公開 repo 後可能小範圍社群參考使用 — 不與官方 starter 競爭，定位是「**獨立 SPA + JWT + AI-ready** 這條冷門路線」的範本

## Major Risks

1. **Scope creep — 最大風險**：MVP 已含 auth + RBAC + audit + 文件 + 測試 + 自寫 compose + DX 配套（seeders / ADR / new-project.sh）。**Stop-Loss 機制（W3 末決策點）是不可妥協的安全閥**。
2. **Windows 開發環境 Docker 行為**：volume / line ending / file watcher 與 Linux 不一致可能吃掉數天 debug；W0 spike 必須把這項當第一優先驗證。
3. **TanStack Router + JWT refresh 攔截器組合複雜度**：401 自動 refresh + queue 重試是經典坑；W0 spike 必須驗證可行性，否則 W2 會卡死。
4. **`spatie/laravel-permission` 在 JWT 無狀態場景下的 cache invalidation**：改角色後舊 token 內權限不會即時失效；需顯式設計 cache reset 或縮短 access token 壽命。
5. **JWT token 儲存設計零妥協**：access 記憶體、refresh httpOnly cookie + rotation 是必須；任何「先 localStorage 之後再改」都不可接受。
