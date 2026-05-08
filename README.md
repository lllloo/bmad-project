# bmad-project

BMAD Method workspace installation for `claude-code`.

This repository tracks the BMAD core installation, generated Claude skills, and
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
