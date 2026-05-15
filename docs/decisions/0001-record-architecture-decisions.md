# 0001 — 採用 ADR（Architecture Decision Records）記錄重大架構決策

- **Status**: Accepted
- **Date**: 2026-05-15
- **Deciders**: Jie（developer / solo maintainer）
- **Story**: 1.1 W0 Spike
- **Format**: MADR-lite（Markdown Any Decision Records，輕量版）

## Context

bmad-project 是 BMAD Method 6.6.0 驅動的 Laravel 12 + React 19 + JWT 認證 monorepo，目標是輸出**可被 fork 重用的後台 starter kit**。專案技術選型刻意違反主流（不用 Sanctum 而用 JWT、不用 NextAuth 而手刻 axios interceptor、不用 cookie session 而 access in-memory + refresh httpOnly cookie），原因都不是「最佳實踐」而是 first-principles 教育意圖（PRD 已闡明）。

這類**有意違反主流**的決策若沒被記錄下來，三個月後連自己都會懷疑「我當初是不是搞錯了」、fork 此 starter 的人也會誤以為是疏忽，導致：

- 後續 PR / refactor 反覆討論已經拍板的事
- 知識斷裂時無法快速重建上下文
- AI agent（Claude Code / Codex）在沒有 ADR 的情況下會傾向「修正」這些刻意決策回主流做法

**本決策本身就是一個 ADR**，作為後續 ADR 的 meta-decision。

## Decision

採用 **MADR-lite** 格式記錄所有重大架構決策：

### 檔案位置與命名

- 全部放在 `docs/decisions/`
- 檔名：`NNNN-kebab-case-title.md`（NNNN 為 4 位數遞增序號，從 `0001` 開始）
- 永不重編號（即使 ADR 被 superseded 也保留原 NNNN）

### 最小必填段落

每份 ADR 至少需含：

1. **Front-matter / Status block**：Status / Date / Deciders / Story（可選）/ Supersedes（可選）/ Superseded-by（可選）
2. **Context**：為何此時需要做這個決策？背景脈絡是什麼？
3. **Decision**：實際決定的是什麼（明確、可驗證）
4. **Consequences**：好的、壞的、需追蹤的後果——尤其是壞的（讀者最常忽略的）

可選段落：Alternatives Considered、References。

### Status 取值

- `Proposed`：起草中、尚未拍板
- `Accepted`：已採納（預設值，commit 時即視為 Accepted）
- `Deprecated`：不再推薦但未被取代
- `Superseded by 00NN`：被另一份 ADR 取代（保留原檔，標註指向新 ADR）

### 何時寫 ADR？

寫 ADR 的判斷標準：「**若三個月後另一位開發者問『為什麼是這樣？』，光看程式碼無法回答，就要寫 ADR**」。

具體觸發點：

- 選擇 A 套件而非 B 套件（且 B 是主流預設）
- 違反框架預設行為（例如 Laravel 預設用 Sanctum，本專案改 JWT）
- 跨 epic 的橫切關注點變更（例如改變 token 儲存方式、改變 RBAC 套件）
- 任何 PRD anti-pattern 對應的「我們為什麼**不**這樣做」

**不**寫 ADR 的：

- 純 code style / 命名慣例（屬於 `project-context.md`）
- 單一 story 內可達成且不影響他人的小決策（屬於 story 的 Dev Notes）
- 套件版本 patch / minor 升級（屬於 changelog）

## Consequences

### Good

- 三個月後重看 commit 時，能快速重建決策上下文
- AI agent（Claude / Codex）讀 `docs/decisions/` 後，不會把刻意違反主流的決策當 bug「修掉」
- Fork 此 starter 的開發者看 ADR 0002 就懂「為什麼不用 Sanctum」，不需要翻整本 PRD
- BMAD `bmad-create-architecture` workflow 已預設輸出 `decisions/`，與 BMAD 流程自然契合

### Bad

- 每次重大決策多 15-30 分鐘寫 ADR 的 overhead
- 若 ADR 寫不夠精確（Context 太薄、Consequences 漏掉壞處），讀者仍會困惑——格式無法替代品質
- 早期 ADR 數量少時感覺「儀式感過重」，需要紀律持續寫

### Tracking

- 本 W0 spike 結束時應有 ADR 0001（本檔）與 0002（JWT over Sanctum）兩份
- 預期 W1-W4 期間累積至 ADR 0008 左右（refresh rotation、axios 401 並發、docker-compose 結構、Domain Boundary、Spatie cache、Scribe API docs）—— 由 Story 1.4 / 2.1 / 3.x / 4.3 觸發補寫
- 不在 `docs/decisions/` 內建 index.md，README 在最後一塊「Architecture Decisions」段落手動列出最新 5-10 份即可（避免兩處同步問題）

## Alternatives Considered

- **不寫 ADR，全靠 commit message + PRD/Architecture 文件**：commit 是 what-not-why、PRD 是橫向描述，沒有「為什麼選 A 不選 B 的脈絡」這個維度。Reject。
- **用完整 MADR（含 Decision Drivers、Options 評估表）**：對 solo developer 過重，第一份 ADR 就會卡住。Reject。
- **用 Nygard 原版**：四段（Context / Decision / Status / Consequences）夠用，但少 Date 與 Story 連結。MADR-lite 是 Nygard + 必要 metadata。Accept。

## References

- [MADR Specification](https://adr.github.io/madr/) — 完整 MADR 規範（本專案只取最小子集）
- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — ADR 原典
- `_bmad-output/planning-artifacts/architecture.md` — 本專案完整架構文件，ADR 為其決策層補充
