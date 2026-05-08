# bmad-project

BMAD Method workspace installation for `claude-code` and `codex`.

This repository tracks the BMAD core installation, generated agent skills, and
project-level BMAD configuration.

## Requirements

- Node.js 20+
- Git
- Python 3.10+ for BMAD helper scripts

## Install Or Upgrade

Run a stable quick update from the project root:

```powershell
npx bmad-method install --yes --action quick-update --directory .
```

Run the interactive installer when adding/removing modules or tools:

```powershell
npx bmad-method install --directory .
```

Regenerate both configured tool targets without adding extra modules:

```powershell
npx bmad-method install --yes --action update --modules core --tools claude-code,codex --directory . --set core.project_name=bmad-project --set core.document_output_language=繁體中文 --set "core.output_folder={project-root}/_bmad-output" --set core.user_name=Barney --set core.communication_language=繁體中文
```

## Common Commands

Show installer options:

```powershell
npx bmad-method install --help
```

List supported IDE/tool targets:

```powershell
npx bmad-method install --list-tools
```

Resolve BMAD config:

```powershell
python _bmad\scripts\resolve_config.py --project-root (Resolve-Path .).Path
```

Team overrides belong in `_bmad/custom/config.toml`. Personal overrides belong
in `_bmad/custom/*.user.toml`, which are ignored by Git.

Claude Code skills are generated into `.claude/skills`. Codex skills are
generated into `.agents/skills`.
