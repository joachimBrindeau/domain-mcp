# DX Tooling - Bulletproof Local-First Developer Experience

## Goal

Replace scattered tooling with a fast, automated, local-first DX stack that catches issues before they reach the repo.

## Tools

### Added

| Tool | Purpose | Runs at |
|------|---------|---------|
| Biome | Lint + format (replaces ESLint + Prettier) | Pre-commit |
| Lefthook | Git hooks with parallel execution | Pre-commit, pre-push |
| Gitleaks | Secret scanning | Pre-commit |
| Knip | Dead code and unused dependency detection | Pre-commit |
| publint | Package.json validation for npm | Pre-push |
| Renovate | Automated dependency updates | Weekly (GitHub) |

### Removed

| Tool | Replaced by |
|------|-------------|
| eslint | Biome |
| @typescript-eslint/parser | Biome |
| @typescript-eslint/eslint-plugin | Biome |
| eslint-config-prettier | Biome |
| prettier | Biome |
| eslint.config.js | biome.json |

## Local Flow

```
git commit -> Lefthook pre-commit (parallel):
  ├── Biome check --write (format + lint + autofix)
  ├── tsc --noEmit (type check)
  ├── Gitleaks protect --staged (secret scan)
  └── Knip (dead code check)

git push -> Lefthook pre-push (parallel):
  ├── Vitest run (full test suite)
  └── publint (package validation)
```

## Config Files

### lefthook.yml

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,js,json}"
      run: biome check --write {staged_files} && git add {staged_files}
    typecheck:
      run: tsc --noEmit
    gitleaks:
      run: gitleaks protect --staged --no-banner
    knip:
      run: knip --no-progress

pre-push:
  parallel: true
  commands:
    test:
      run: vitest run
    publint:
      run: publint
```

### biome.json

Migrate from current ESLint + Prettier config. Use `biome migrate` to auto-convert.

### .gitleaks.toml

```toml
[extend]
useDefault = true

[allowlist]
paths = [
  "node_modules",
  ".env.example"
]
```

### renovate.json

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":automergeMinor",
    ":semanticCommits",
    "group:allNonMajor"
  ],
  "schedule": ["before 9am on monday"],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"]
  }
}
```

## Implementation Steps

1. Install Biome, migrate config, remove ESLint + Prettier
2. Install Lefthook, create `lefthook.yml`
3. Install Gitleaks (brew), add `.gitleaks.toml`
4. Install Knip + publint
5. Add `renovate.json` to repo
6. Update CI workflow to match local tooling
7. Update package.json scripts
