# Packfuse

- **English**
  - [What it is](#what-it-is)
  - [Why use it](#why-use-it)
  - [Install](#install)
  - [Packs](#packs)
  - [Docs](#docs)
- **한국어**
  - [소개](#소개)
  - [무엇이 다른가](#무엇이-다른가)
  - [설치](#설치)
  - [팩](#팩)
  - [문서](#문서)

---

## What it is

**Packfuse** (*pack* + *fuse*): fuse skill packs onto Cursor, Claude Code, and Codex. Choose **user home** (leaves the team repo unchanged) or **this project**. Default install is P0 only. Update or remove at any time.

This repository ships the **packfuse** CLI and every pack in the catalog. Default install is P0 only.

Compared with Vercel `skills` and Superpowers: home vs project, one rule source converted to `.mdc` / `CLAUDE.md` / `AGENTS.md`, and a token estimate (`--dry-run`) before anything is written.

## Why use it

| Feature | What you get |
| --- | --- |
| One rule source → three tools | Each rule is written once and converted to `.mdc`, `CLAUDE.md`, and `AGENTS.md` |
| Home or project | `--home` is personal only. `--project` writes into the repo. You choose |
| Pack management | P0 only by default, dependencies resolved, `update`, `uninstall`, `doctor` |
| Optional lock | Home: `~/.packfuse/lock.json`. Project: `.packfuse/lock.json` (commit if you want teammates to share the set) |
| Token estimate before install | `install --dry-run` shows estimated tokens (tiktoken `cl100k_base`) for always-on rules and auto skill descriptions, per tool |
| Own dev-loop skills | `fix-ci`, `blast-radius`, `resolve-merge-conflicts`. Suggests turning a repeated procedure into a skill (`propose-skill`, never writes files) |
| Token budget (P1, not in default install) | `/token-budget`, `/handoff`. Never writes files |

Results are published as a reproducible comparison against no packs, with the command, model, and date.

## Install

```bash
npx packfuse install --home                         # your user config only
npx packfuse install --project                      # this repository
npx packfuse install --home --tool claude --pack git
npx packfuse install --project --tool cursor --pack general --item fix-ci
npx packfuse install --home --dry-run               # files and token estimate, write nothing
```

`--home` and `--project` (same as `--scope home|project`) pick the location. If you omit both, the CLI asks. If there is no TTY, pass one of them.

Without `--pack` / `--item`, the CLI restores the lock file in that location (or installs `general` P0 if there is none). With `--pack` / `--item`, it adds to the lock. Restore and `update` apply to every tool already installed in that location unless you pass `--tool`.

Files go only into the chosen tool and location. `--home --tool claude` writes only Claude user files. The project stays as it is. Hooks installed with `--home` apply to every repository you open.

## Packs

| Pack | Default | Contents |
| --- | --- | --- |
| `general` | Yes (P0) | Dev loop, Git safety rule, conflict resolution, skill suggestions |
| `git` | Opt-in (P0) | `/commit-by-theme`, `/finishing-a-development-branch`. P1: bisect, worktrees, releases |
| `api` | Opt-in | API, schema, DB migrations |
| `web-ui` | Opt-in | UI and browser checks |
| `security` | Opt-in | Security pass |
| `local-runtime` | Opt-in | Dev containers, compose |
| `tools` | Opt-in | MCP server building |

Official-pack shortcuts: `react` (Vercel), `figma` (Figma), `docs` (Anthropic document skills). They call the official installers and do not copy vendor content.

Borrowed skills (Superpowers and others) are credited in [docs/CATALOG.md](docs/CATALOG.md) and `THIRD_PARTY_NOTICES.md`. You can use this alongside Superpowers: skills with the same name are skipped.

## Docs

| Document | Contents |
| --- | --- |
| [docs/PLAN.md](docs/PLAN.md) | Final product plan (Korean) |
| [docs/CATALOG.md](docs/CATALOG.md) | Every rule, skill, subagent, and hook with its source (Korean) |
| [templates/](templates/) | App repository `AGENTS.md` and core rule skeletons (English) |

---

## 소개

**Packfuse** (*pack* + *fuse*): 스킬 팩을 Cursor, Claude Code, Codex 경로에 맞추어 붙입니다. **사용자 홈**(팀 저장소는 그대로) 또는 **이 프로젝트**를 고릅니다. 기본은 P0만입니다. 언제든 업데이트·제거할 수 있습니다.

설치기와 카탈로그의 모든 팩이 이 저장소에 있습니다. 기본 설치는 P0만입니다.

Vercel `skills`·Superpowers와 다른 점: 홈/프로젝트 선택, 규칙 정본을 `.mdc` / `CLAUDE.md` / `AGENTS.md`로 변환, 쓰기 전 `--dry-run` 토큰 견적.

## 무엇이 다른가

| 차별점 | 내용 |
| --- | --- |
| 규칙 정본 하나 → 세 도구 | 규칙을 한 번 쓰면 `.mdc`, `CLAUDE.md`, `AGENTS.md`로 변환 |
| 홈 또는 프로젝트 | `--home`은 개인만. `--project`는 저장소에 설치. 사용자가 고름 |
| 팩 관리 | 기본은 P0만, 의존 항목 자동 설치, `update`·`uninstall`·`doctor` |
| 잠금 (선택) | 홈: `~/.packfuse/lock.json`. 프로젝트: `.packfuse/lock.json`(맞추고 싶을 때만 커밋) |
| 설치 전 토큰 견적 | `install --dry-run`이 always-on 규칙과 자동 스킬 설명의 추정 토큰(tiktoken `cl100k_base`)을 도구별로 표시 |
| 자체 개발 루프 스킬 | `fix-ci`, `blast-radius`, `resolve-merge-conflicts`. 같은 절차를 다시 시키면 스킬화를 제안(`propose-skill`, 파일은 안 씀) |
| 토큰 예산 (P1, 기본 설치 아님) | `/token-budget`, `/handoff`. 파일은 바꾸지 않음 |

효과는 팩 없이 돌린 결과와 비교해, 실행 명령·모델·날짜와 함께 재현 가능한 형태로 공개합니다.

## 설치

```bash
npx packfuse install --home                         # 사용자 설정만
npx packfuse install --project                      # 이 저장소
npx packfuse install --home --tool claude --pack git
npx packfuse install --project --tool cursor --pack general --item fix-ci
npx packfuse install --home --dry-run               # 파일과 토큰만, 쓰지 않음
```

`--home`과 `--project`(`--scope home|project`와 같음)로 위치를 고릅니다. 둘 다 없으면 CLI가 묻습니다. TTY가 없으면 하나를 반드시 넘깁니다.

`--pack` / `--item` 없이 실행하면 그 위치의 잠금 파일을 복원합니다(없으면 `general` P0). `--pack` / `--item`을 주면 잠금에 추가합니다. 복원과 `update`는 `--tool`을 주지 않으면 그 위치에 이미 설치한 도구 전부에 적용됩니다.

고른 도구와 위치의 경로에만 씁니다. `--home --tool claude`는 클로드 사용자 파일만 건드리고 프로젝트는 그대로입니다. `--home`으로 설치한 훅은 여는 모든 저장소에 적용됩니다.

## 팩

| 팩 | 기본 | 내용 |
| --- | --- | --- |
| `general` | 예 (P0) | 개발 루프, Git 안전 규칙, 충돌 해결, 스킬화 제안 |
| `git` | 옵트인 (P0) | `/commit-by-theme`, `/finishing-a-development-branch`. P1: bisect, worktree, 릴리스 |
| `api` | 옵트인 | API, 스키마, DB 마이그레이션 |
| `web-ui` | 옵트인 | UI, 브라우저 검증 |
| `security` | 옵트인 | 보안 점검 |
| `local-runtime` | 옵트인 | 데브컨테이너, compose |
| `tools` | 옵트인 | MCP 서버 제작 |

공식 팩 바로가기: `react`(Vercel), `figma`(Figma), `docs`(Anthropic 문서 스킬). 공식 설치를 호출하며 벤더 원문은 복사하지 않습니다.

차용한 스킬(Superpowers 등)은 [docs/CATALOG.md](docs/CATALOG.md)와 `THIRD_PARTY_NOTICES.md`에 원천을 밝힙니다. Superpowers와 함께 써도 됩니다. 이름이 같은 스킬은 건너뜁니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/PLAN.md](docs/PLAN.md) | 출시 최종 계획 |
| [docs/CATALOG.md](docs/CATALOG.md) | 팩별 규칙·스킬·서브에이전트·훅과 원천 |
| [templates/](templates/) | 앱 저장소 `AGENTS.md` · 핵심 규칙 뼈대 (영어) |
