# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## 專案性質

BMAD Method 工作區安裝（v6.6.0），目標 IDE：`claude-code` 與 `codex`。**沒有應用程式程式碼，也沒有 build/test/lint。** 常用操作全部是 BMAD installer。

## 常用命令

PowerShell，從專案根目錄執行：

```powershell
# 穩定快速更新
npx bmad-method install --yes --action quick-update --directory .

# 互動式安裝（新增/移除 module 或 tool）
npx bmad-method install --directory .

# 解析合併後的 BMAD 設定
python _bmad\scripts\resolve_config.py --project-root (Resolve-Path .).Path
```

需求：Node.js 20+、Python 3.11+。

## 不要動的檔案

這些由 installer 管理，手改會在下次安裝時被覆寫：

- `_bmad/config.toml`、`_bmad/config.user.toml`、`_bmad/_config/*`
- `_bmad/core/**`、`_bmad/bmm/**`
- `.claude/skills/**`、`.agents/skills/**`（兩者都是從 `_bmad/` 編譯出的產出物）

## 客製化

要改 BMAD 行為，動 `_bmad/custom/` 底下：

- `config.toml` — 團隊層，進 git
- `config.user.toml` — 個人層，gitignored
- `<skill-name>.toml` / `<skill-name>.user.toml` — 單一 skill override

設定預設輸出語言為**繁體中文**。
