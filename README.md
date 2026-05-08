# bmad-project

這是 BMAD Method 工作區安裝，用來提供 `claude-code` 與 `codex` 的 agent skills 與 workflow 設定。

此 repository 追蹤 BMAD installer 產生的模組、skills、manifest，以及專案層級設定。這裡沒有應用程式程式碼，也沒有 build / test / lint 流程。

## 目前狀態

- BMAD 版本：`6.6.0`
- 已設定工具：`claude-code`、`codex`
- 對話語言：繁體中文
- 文件輸出語言：繁體中文
- 主要輸出目錄：`_bmad-output`

## 已安裝模組

- `core`：BMAD Core，提供基礎設定、help、brainstorming、review、distill、shard、customize 等通用能力。
- `bmm`：BMad Method Agile-AI Driven-Development，提供 PRD、Architecture、Epic / Story、Sprint、Dev Story、Code Review 等產品開發流程。

## 主要工作流程

BMad Method 的常用流程：

1. 分析：`bmad-brainstorming`、`bmad-market-research`、`bmad-domain-research`、`bmad-technical-research`
2. 規劃：`bmad-create-prd`、`bmad-validate-prd`、`bmad-edit-prd`、`bmad-create-ux-design`
3. 解法設計：`bmad-create-architecture`、`bmad-create-epics-and-stories`、`bmad-check-implementation-readiness`
4. 實作：`bmad-sprint-planning`、`bmad-create-story`、`bmad-dev-story`、`bmad-code-review`

不確定下一步時，先用 `bmad-help`。

## 目錄結構

- `_bmad/`：BMAD installer 管理的主要安裝內容。
- `_bmad/bmm/`：BMad Method module 來源。
- `_bmad/core/`：BMAD Core module 來源。
- `_bmad/_config/`：installer 產生的 manifest 與 catalog。
- `_bmad/custom/`：客製化設定與 override，這裡才是手動調整 BMAD 行為的地方。
- `.agents/skills/`：產生給 Codex 使用的 skills。
- `.claude/skills/`：產生給 Claude Code 使用的 skills。
- `_bmad-output/planning-artifacts/`：PRD、UX、Architecture、Epic / Story 等規劃產出。
- `_bmad-output/implementation-artifacts/`：Sprint、Story、Review、Retrospective 等實作產出。
- `docs/`：長期 project knowledge。

## 需求

- Node.js 20+
- Git
- Python 3.10+，用於 BMAD helper scripts

## 安裝或更新

從專案根目錄執行穩定快速更新：

```powershell
npx bmad-method install --yes --action quick-update --directory .
```

新增或移除 module / tool 時，使用互動式 installer：

```powershell
npx bmad-method install --directory .
```

重新產生目前設定的 module 與 tool target：

```powershell
npx bmad-method install --yes --action update --modules core,bmm --tools claude-code,codex --directory . --set core.project_name=bmad-project --set core.document_output_language=繁體中文 --set "core.output_folder={project-root}/_bmad-output" --set core.user_name=Barney --set core.communication_language=繁體中文
```

## 常用指令

顯示 installer 選項：

```powershell
npx bmad-method install --help
```

列出支援的 IDE / tool target：

```powershell
npx bmad-method install --list-tools
```

解析 BMAD 設定：

```powershell
python _bmad\scripts\resolve_config.py --project-root (Resolve-Path .).Path
```

## 客製化

不要直接修改 installer-managed 檔案，因為下次 install / update 會被覆寫。要改 BMAD 行為，放在 `_bmad/custom/`：

- `_bmad/custom/config.toml`：團隊層級設定，進 Git。
- `_bmad/custom/config.user.toml`：個人層級設定，通常不進 Git。
- `_bmad/custom/<skill-name>.toml`：單一 skill 的團隊 override。
- `_bmad/custom/<skill-name>.user.toml`：單一 skill 的個人 override。

## 不要手改

以下內容由 installer 管理：

- `_bmad/config.toml`
- `_bmad/config.user.toml`
- `_bmad/_config/*`
- `_bmad/core/**`
- `_bmad/bmm/**`
- `.agents/skills/**`
- `.claude/skills/**`
