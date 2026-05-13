# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案性質

BMAD Method v6.6.0 工作區安裝，目標 IDE：`claude-code` 與 `codex`。

**這裡沒有應用程式程式碼，也沒有 build / test / lint。** 所有「動作」都是：跑 BMAD installer、或在對話裡叫 `bmad-*` skill 走產品開發流程，產出寫進 `_bmad-output/` 與 `docs/`。

`AGENTS.md` 是 `CLAUDE.md` 的 symlink，Codex 與 Claude Code 共用同一份指示。

## 常用命令

PowerShell，從專案根目錄執行：

```powershell
# 穩定快速更新（最常用）
npx bmad-method install --yes --action quick-update --directory .

# 互動式安裝：新增/移除 module 或 tool
npx bmad-method install --directory .

# 重新產生 module 與 tool target（保留專案設定）
npx bmad-method install --yes --action update --modules core,bmm --tools claude-code,codex --directory .

# 解析合併後的最終 BMAD 設定（base + custom）
python _bmad\scripts\resolve_config.py --project-root (Resolve-Path .).Path

# 解析單一 skill 的 customization 合併結果
python _bmad\scripts\resolve_customization.py --project-root (Resolve-Path .).Path --skill <skill-name>
```

需求：Node.js 20+、Python 3.10+、Git。

## 工作流程（高層架構）

已安裝模組：`core`（通用能力）、`bmm`（Agile-AI 產品開發）。BMad Method 五階段，每階段都對應一組 `bmad-*` skill：

1. **分析** — `bmad-brainstorming`、`bmad-market-research`、`bmad-domain-research`、`bmad-technical-research`
2. **規劃** — `bmad-create-prd`、`bmad-validate-prd`、`bmad-edit-prd`、`bmad-create-ux-design`
3. **解法設計** — `bmad-create-architecture`、`bmad-create-epics-and-stories`、`bmad-check-implementation-readiness`
4. **實作** — `bmad-sprint-planning`、`bmad-create-story`、`bmad-dev-story`、`bmad-code-review`
5. **回顧** — `bmad-retrospective`、`bmad-correct-course`

不確定下一步時叫 `bmad-help`。Agent 人格化 skill（`bmad-agent-pm` John、`bmad-agent-architect` Winston、`bmad-agent-dev` Amelia 等）是另一條入口，用「找 PM」「找架構師」對話。

產出落點（由 `_bmad/config.toml [modules.bmm]` 控制）：

- PRD / UX / Architecture / Epic / Story 規劃 → `_bmad-output/planning-artifacts/`
- Sprint / Story / Review / Retrospective 實作 → `_bmad-output/implementation-artifacts/`
- 長期 project knowledge → `docs/`

## Installer-managed 不要動

下次 install / update 會覆寫：

- `_bmad/config.toml`、`_bmad/config.user.toml`、`_bmad/_config/*`
- `_bmad/core/**`、`_bmad/bmm/**`
- `.claude/skills/**`、`.agents/skills/**`（都是從 `_bmad/` 編譯出的產出物，分別給 Claude Code / Codex）

## 客製化

要改 BMAD 行為，動 `_bmad/custom/`。設定採 TOML deep-merge：表格深合併、有 key 的 entry 依 key 合併，會疊在 installer 產生的 base config 之上。

- `_bmad/custom/config.toml` — 團隊層，進 git
- `_bmad/custom/config.user.toml` — 個人層，gitignored
- `_bmad/custom/<skill-name>.toml` / `<skill-name>.user.toml` — 單一 skill override

範例：在 `custom/config.toml` 加 `[agents.bmad-agent-pm]` 區塊覆寫 description，或加新 agent。

預設輸出語言為**繁體中文**（`core.document_output_language`、`core.communication_language` 都是 `繁體中文`）。
