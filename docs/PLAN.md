# 개발 셋 계획

> 이 문서는 설계 목표다. 보완판의 실제 구현·적용 방법·미지원 범위는 [MAINTENANCE.md](MAINTENANCE.md)를 우선 확인한다. 계획 문구를 완료 증거로 해석하지 않는다.

## 1. 목표

스택 무관 **개발 루프**는 `general`, Git **의식(커밋·PR·태그)** 은 `git` 팩, Figma·React 등은 각자 팩. 쓰는 팩만 설치한다.

역할마다 파일 하나. 인기 스킬은 원문 통째 복제보다 절차 차용.

공개해 많이 쓰이게 하는 것이 목표다.

**포지셔닝:** Cursor·Claude Code·Codex에 같은 규칙을 한 번에 깔고, 토큰을 늘리기 전에 견적 내는 설치기. 개인은 홈에 설치해 팀 저장소 규칙을 그대로 둔다. 팀이 구성을 맞추고 싶을 때만 프로젝트에 설치하고 잠금을 커밋한다. 세 도구 모두 `SKILL.md`를 읽으므로 스킬 복사 자체는 차별점이 아니다.

**이름:** `packfuse` — pack(설치 단위) + fuse(여러 도구 경로에 맞추어 붙이다). npm `packfuse`, 저장소도 같은 이름. 전기 퓨즈가 아니다.

**범위:** 이 문서가 출시 최종본이다. 카탈로그의 모든 팩·래퍼·설치기·eval·라이선스를 한 번에 구현한다. P0는 기본 설치일 뿐, 구현을 나누는 단계가 아니다.

**언어:** README는 한 파일에 영어(위)와 한국어(아래). 스킬·규칙·에이전트 본문과 description, `templates/`는 영어.

### 1.1 차별점 (README 첫 화면)

기존 스킬 묶음(Superpowers, `anthropics/skills`)과 다중 에이전트 설치 CLI(Vercel `skills`)와 겹치지 않는 항목만 앞에 둔다.

| 차별점                   | 사용자가 얻는 것                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------- |
| 팩 관리                  | `npx packfuse`로 P0만 설치, `requires` 자동, 잠금 기반 `update`/`uninstall`, `doctor` |
| 규칙 정본 하나 → 세 도구 | `.mdc`·`CLAUDE.md`·`AGENTS.md`를 손으로 맞추지 않음                                   |
| 홈 또는 프로젝트         | `--home`은 개인만, 팀 저장소는 안 건드림. `--project`는 저장소에 설치                 |
| 설치 전 토큰 견적        | `--dry-run`, tiktoken `cl100k_base`, 도구별 추정                                      |
| 자체 개발 루프 스킬      | `fix-ci`, `blast-radius`, `resolve-merge-conflicts`, `propose-skill`                  |
| 토큰 예산                | `/token-budget`, `/handoff` (P1, 기본 설치 아님)                                      |

차용 스킬(Superpowers 등)은 “같이 쓰기 좋게 묶음”으로만 소개한다. 원조처럼 내세우지 않는다. 이미 설치돼 있으면 건너뛴다(3.1).

### 1.2 이 출시 이후

체크섬 검증, 라우팅 충돌 CI, 조직 정책 팩은 출시 후에 둔다. 출시 범위에 넣지 않는다.

공개 전에 Vercel `skills` CLI, Superpowers와 기능을 짧게 비교해 README에 넣는다. 이 설치기가 다른 점: 홈/프로젝트 선택, 규칙 정본 변환, `--dry-run` 토큰 견적, P0만 기본 설치. 우위가 없는 기능은 차별점에서 뺀다.

## 2. 원칙

1. Always-on 규칙은 짧게. 긴 절차는 스킬.
2. 스킬 3단: description → `SKILL.md` → `references/` / `scripts/`.
3. `/`만 켤 스킬은 `disable-model-invocation: true`. Command 파일 없음.
4. **분류 폴더 ≠ 설치 단위.** 한 skills 루트에 전 팩을 넣지 않는다.
5. Git **안전 규칙**은 `general`. Git **워크플로 스킬**은 `git` 팩.
6. 사용자가 같은 절차를 다시 지시할 때만 승격 **제안만** (한 패턴당 한 번). 구현 도중에는 제안하지 않음. 확인 전 파일 금지. 감시 스킬을 매 턴 열지 않는다.
7. Cursor 내장(`/create-skill`, `/review`, Explore/Bash/Browser)과 겹치면 만들지 않는다. 커스텀 탐색 에이전트 이름은 `code-explorer`다.
8. 설치는 **도구 × 위치(홈\|프로젝트) × (팩 전체 | 항목 하나)** 이다. 팩 전체의 기본은 **P0만**. P1·P2는 `--item` 또는 `--priority`로만.
9. 규칙 정본은 팩 안 마크다운 하나. `.mdc`와 `CLAUDE.md`/`AGENTS.md` 블록은 설치기가 생성한다.
10. 공유 팩에 답변 언어(한국어 등)를 넣지 않는다. 개인 User Rule.
11. Anthropic 문서 스킬(`pdf`, `docx`, `pptx`, `xlsx`)은 원문을 복사하지 않는다. `docs` 팩은 빈 스킬이 아니라, 그 팩을 고를 때만 공식 설치 명령을 실행하는 중계다.

## 3. 디렉터리 (구현 시)

```
packs/
  index.json
  general/          # manifest.json, rules/, skills/, agents/, hooks/
  git/
  web-ui/
  react/
  figma/
  api/
  local-runtime/
  security/
  tools/
  docs/             # 스킬 원문 없음. 공식 설치 중계
templates/
```

플러그인 하나 = 팩 하나. 그전에는 쓸 팩만 복사·링크.

## 3.1 설치 모델 (도구 × 위치 × 팩 × 항목)

사용자는 다음을 고른다.

1. 도구: `cursor` | `claude` | `codex`
2. 위치: **홈** (`--home`) | **프로젝트** (`--project`). `--scope home|project`와 같다. 둘 다 없으면 TTY에서 고르고, TTY가 아니면 오류
3. 범위: 팩 전체 | 팩 안 항목 하나 (`kind`+`id`)

개인은 `--home`으로 팀 저장소 파일·규칙을 건드리지 않는다. 저장소에 이 팩을 넣고 싶을 때만 `--project`.

도구 결정 순서:

1. `--tool`
2. 그 범위 `state.json`에 이미 기록된 도구들 (전부 대상)
3. 마커(`.cursor` / `.claude` / `.codex` 또는 홈의 대응 폴더)가 하나뿐이면 그 도구
4. 그 외에는 TTY에서 묻고, TTY가 없으면 오류

`--pack`/`--item`이 없으면 그 범위의 잠금을 **복원**한다(잠금이 없으면 `general` P0). `--pack`/`--item`이 있으면 잠금에 **추가**한다.

설치기는 `packs/<팩>/manifest.json`의 항목별 `tools` 필드로 필터한다. 선택한 도구에 없는 종류는 건너뛴다.

| 종류  | Cursor 프로젝트       | Cursor 홈                                        | Claude 프로젝트                                    | Claude 홈                 | Codex 프로젝트                                               | Codex 홈                 |
| ----- | --------------------- | ------------------------------------------------ | -------------------------------------------------- | ------------------------- | ------------------------------------------------------------ | ------------------------ |
| skill | `.cursor/skills/`     | `~/.cursor/skills/`                              | `.claude/skills/`                                  | `~/.claude/skills/`       | `.agents/skills/`                                            | `~/.agents/skills/`      |
| rule  | `.cursor/rules/*.mdc` | 설치하지 않음. User Rules 붙여 넣기 블록만 출력  | `CLAUDE.md` 블록. `globs` 규칙은 `.claude/rules`로 | `~/.claude/CLAUDE.md`     | `AGENTS.md` 블록                                             | `~/.codex/AGENTS.md`     |
| agent | `.cursor/agents/*.md` | `~/.cursor/agents/`                              | `.claude/agents/*.md`                              | `~/.claude/agents/`       | `.codex/agents/*.toml`                                       | `~/.codex/agents/*.toml` |
| hook  | `.cursor/hooks.json`  | `~/.cursor/hooks.json` (Cloud Agent에서는 안 돔) | `.claude/settings.json`                            | `~/.claude/settings.json` | Codex 훅 이벤트에 매핑. 대응 없으면 건너뛰고 `doctor`에 알림 | 같음                     |

Cursor 홈 규칙은 Customize → User Rules라 파일이 아니다. Codex 에이전트는 마크다운이 아니라 TOML(`name`, `description`, `developer_instructions`)이다. 변환기가 `.md` 정본을 `.toml`로 만든다.

홈 경로와 형식은 위 표를 따른다. Cursor 홈 규칙은 설치하지 않고 붙여 넣을 블록만 출력한다.

홈에 설치한 훅은 그 사용자의 모든 저장소에서 돈다. `--dry-run` 출력과 README에 표시한다.

스킬·에이전트·훅은 정본 하나에서 **도구별로 변환**한다. 스킬은 본문은 같고 명시 호출 설정을 도구에 맞게 넣는다. Codex는 `$skill` 호출과 `agents/openai.yaml` 정책을 사용한다. 에이전트는 Cursor·Claude `.md`, Codex `.toml`. 변환기는 `converters/cursor`, `converters/claude`, `converters/codex`.

Claude always-on 규칙은 `CLAUDE.md` 블록, `globs` 규칙은 `.claude/rules`로 변환한다. `--dry-run` 견적은 도구별로 따로 보여 준다.

목표는 **설치 격리**다. 고른 도구·위치의 경로에만 쓴다.

명시 호출: Cursor `disable-model-invocation: true`, Codex `agents/openai.yaml`의 `policy.allow_implicit_invocation: false`, Claude는 슬래시 스킬. 정본 manifest는 `invoke: slash`를 가지며 설치기가 도구별 필드로 바꾼다.

벤더 공식 팩(Vercel, Figma)은 원문 대신 공식 스킬에 위임하는 래퍼다. 현재 보완판은 공식 설치 안내를 제공하며 자동 명령 실행은 지원하지 않는다.

예:

- `install --home --tool claude --pack general` → 홈의 `.claude/`와 `CLAUDE.md`에 P0 규칙 블록과 P0 스킬만. 에이전트는 P1이라 없음. `.mdc`·Cursor 훅 없음. 프로젝트는 그대로.
- `install --project --tool cursor --pack git --item commit-by-theme` → 프로젝트에 그 스킬 폴더만.
- `install --project --tool cursor --pack general --priority p1` → P0에 P1을 더함.

팩 전체 설치는 P0만. `--item`은 `requires`에 적힌 항목을 함께 설치한다. 고른 도구에 없는 항목은 건너뛰고 목록으로 알린다.

잠금은 위치마다 둔다. 프로젝트 `state.json`은 `.gitignore`.

| 파일         | 내용                                                                         | 위치                                                                    |
| ------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `lock.json`  | 팩, id, 버전, 우선순위                                                       | 홈 `~/.packfuse/` 또는 프로젝트 `.packfuse/`. 프로젝트 잠금 커밋은 선택 |
| `state.json` | 도구별 설치 경로. `{ "cursor": { "paths": [] }, "claude": { "paths": [] } }` | 같은 범위. 커밋하지 않음                                                |

`uninstall --tool`은 그 범위 `state.json`에서 해당 도구의 경로와 마커 블록만 지운다. 다른 도구 항목은 남긴다. 다른 항목이 `requires`로 쓰면 거부. 잠금에서 항목을 지우는 것은 `state.json`의 어느 도구에도 그 항목이 남지 않을 때만이다.

| 명령                                   | 동작                                                                                                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `install --home` / `install --project` | 위 규칙대로 변환·삽입. `--dry-run`은 파일 목록과 추정 토큰(규칙 본문 + 자동 스킬 description, tiktoken `cl100k_base`)만 출력                                                                                                                        |
| `uninstall`                            | `--tool`이 없으면 거부한다. `--all`일 때만 그 범위의 모든 도구를 지운다. 지정 도구의 `state.json` 경로와 `<!-- pack:<팩>:<id> -->` 블록만 제거. 어느 도구에도 남지 않으면 잠금에서도 제거                                                           |
| `update`                               | 그 범위 잠금 버전과 manifest 버전이 다른 항목만 교체. `--tool`이 없으면 `state.json`에 기록된 모든 도구, 있으면 그 도구만                                                                                                                           |
| `list`                                 | 설치된 항목과 사용 가능한 항목                                                                                                                                                                                                                      |
| `doctor`                               | 홈과 프로젝트, 도구별 `state.json`을 함께 본다. 같은 스킬이 둘 다 있으면 중복으로 보고. 잠금과 `state.json` 불일치, 빠진 `requires`. 자동 P0 이름이 어디에도 없으면 "루프 스킬 부족". 다른 곳(Superpowers 등)에 이미 있으면 "이미 설치됨, 건너뜀"만 |

사용자 문장·기존 훅 항목은 유지하고, 우리 훅만 병합·제거한다. 잠금에 없는 같은 이름 스킬이 이미 있으면 덮어쓰지 않고 건너뛴다.

벤더 래퍼의 `uninstall`은 래퍼만 지운다. 공식 팩은 사용자가 공식 명령으로 지운다.

설치기는 Node CLI(`npx packfuse`)로 만든다. macOS·Linux·Windows 공통이고, 훅 스크립트도 Node로 쓴다.

npm은 **패키지 버전 하나**에 설치기와 카탈로그의 모든 팩을 넣는다.

### 라우팅 (자동 스킬)

한 요청에 자동 본문이 여럿 열리지 않게, 각 `description`에 When not을 둔다.

| 요청                    | 켠다                                                                                               | 켜지 않는다                      |
| ----------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------- |
| 오타·한 파일            | `implement-change`                                                                                 | `brainstorming`, `writing-plans` |
| 동작이 있는 버그        | 실패 테스트가 있으면 `test-driven-development`, 원인이 없으면 `systematic-debugging`. 둘 중 하나만 | 계획 전체                        |
| 새 기능·설계가 애매     | `brainstorming` → `writing-plans` → `implement-change`                                             | SDD                              |
| 독립 태스크가 많은 계획 | `/subagent-driven-development`                                                                     | 메인에서 전부 구현               |

P0 자동 스킬은 팩당 8개 이하. description은 무엇을/언제/언제 아닌지만, 500자 이하(Codex 한도).

### 이름

- 스킬 `name` = 폴더명. 팩 사이에서도 유일.
- 래퍼는 위임 대상과 이름을 다르게 한다. 예: `react-best-practices` → 공식 `vercel-react-best-practices`. 이름이 같으면 자기 자신을 다시 부르지 않는다.
- 차용 스킬은 원본 이름 유지. 같은 이름이 이미 설치돼 있으면 건너뛴다(위 설치 규칙).

### 규칙 정본

```
packs/general/rules/git.md    # 정본. 짧은 문장만
```

설치기가 Cursor는 `.mdc`, Claude는 `CLAUDE.md`, Codex는 `AGENTS.md`에 같은 문장을 넣는다. 블록 시작·끝 마커로 갱신한다.

### manifest

팩마다 `packs/<팩>/manifest.json`, 루트 `packs/index.json`이 팩 목록과 팩 버전을 가진다.

| 필드       | 값                                         |
| ---------- | ------------------------------------------ |
| `id`       | 팩 안 유일                                 |
| `kind`     | `skill` \| `rule` \| `agent` \| `hook`     |
| `priority` | `p0` \| `p1` \| `p2` (규칙 포함 모든 항목) |
| `tools`    | `cursor` `claude` `codex` 중 일부          |
| `invoke`   | `auto` \| `slash` (스킬만)                 |
| `requires` | `<팩>:<id>` 목록                           |
| `version`  | semver                                     |
| `source`   | `self` 또는 원천 저장소·라이선스           |
| `vendor`   | 래퍼면 공식 설치 명령                      |

### 검증 (CI)

- 스킬 `name`과 폴더명 일치, 전 팩에서 유일
- description 500자 이하, 자동 P0 팩당 8개 이하
- manifest 스키마, `requires` 대상 존재, 순환 없음
- 도구별 설치 결과 스냅샷(`cursor`/`claude`/`codex` 각각 설치 후 파일 목록 비교)

### 라이선스

루트 `LICENSE`, `THIRD_PARTY_NOTICES.md`. 차용 항목은 원천·라이선스·차용 범위를 적는다. Superpowers(MIT)는 고지 포함. Anthropic 스킬은 항목별 라이선스를 확인한 뒤 차용 범위를 정한다.

## 4. Git 분리

| 위치                                     | 항목                                                                                                            | 이유                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `general` 규칙 `git`                     | 커밋/푸시/PR은 요청 있을 때만                                                                                   | `git` 팩 없이도 실수 커밋 방지          |
| `general` 스킬 `resolve-merge-conflicts` | 구현 중 충돌                                                                                                    | Git 의식이 아니라 변경을 끝나게 하는 일 |
| `git` 팩                                 | P0: `commit-by-theme`, `finishing-a-development-branch`. P1: `git-bisect`, `using-git-worktrees`, `cut-release` | Agent에게 저장소 작업을 맡길 때만 설치  |

기본 설치는 구현·테스트. Git 팩을 깐 뒤 `/`로 커밋·PR.

## 5. 팩별 요약

### `general`

규칙: `requirements`, `safety`, `verification`, `code-change`, `git`, `skill-promotion`. 답변 언어는 없음.

스킬: 위 카탈로그. SDD는 P2이고 리뷰 지시는 `reviewer` 정본을 가리킨다.

서브에이전트: `code-explorer`, `reviewer`, `verifier` 모두 P1. 기본 설치에 없음. `code-explorer`는 내장 Explore와 역할이 겹친다 (내장 Explore/Bash/Browser는 유지).  
훅: `afterFileEdit`, `beforeShellExecution`, `sessionEnd`(P2, 제안 안내만).

### `git`

P0: `commit-by-theme`, `finishing-a-development-branch`. P1: `git-bisect`, `using-git-worktrees`, `cut-release`. 모두 `/` 명시.

### `web-ui`

`frontend-design`(Anthropic), `webapp-testing`(Anthropic), `web-design-guidelines`(Vercel, P1).

### `react`

`react-best-practices`(Vercel 공식 설치 우선).

### `figma`

`figma-design-to-code` 래퍼(공식 Figma).

### `api`

`api-design`, `openapi-schema`, `db-migration`, `query-and-index`.

### `local-runtime`

`dev-containers`, `docker-compose-dev`.

### `security`

`security-pass`. Trail of Bits 전량은 아님.

### `tools`

`mcp-builder`(Anthropic, MCP 만들 때만).

### `docs`

스킬 파일 없음. `install --pack docs`가 `npx skills add https://github.com/anthropics/skills`로 `pdf`, `docx`, `pptx`, `xlsx`만 설치한다. `--dry-run`은 명령만 출력한다. `uninstall`은 그 공식 스킬을 지우지 않는다. 기본 `general` 설치에는 포함되지 않는다.

### 앱 템플릿

`templates/AGENTS.md`, `templates/00-core.mdc`는 **영어**. 앱 명령·경로만. 안전·최소 diff·Git 요청 제한은 `general` 규칙에만 둔다.

## 6. 승격

백그라운드 감시 프로세스는 없다. always-on 규칙이 이 대화만 보고, 조건이 맞으면 한 줄로 제안한다.

| 구성                              | 역할                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| 규칙 `skill-promotion` (P0, 짧게) | 아래 신호일 때만 제안. 구현 도중·비슷한 말로는 제안하지 않음. 놓쳐도 됨. 스킬 본문은 열지 않음 |
| `/propose-skill`                  | 사용자가 초안을 원할 때만. 스킬·규칙 초안. 파일은 안 씀                                        |
| Cursor `sessionEnd` (P2)          | 대화 중 제안을 놓친 경우 `/propose-skill` 한 줄 안내. P2라 기본 설치에 없음                    |

신호:

| 신호                                    | 제안                      |
| --------------------------------------- | ------------------------- |
| 사용자가 같은 절차를 다시 지시함 (≈3회) | 스킬 초안                 |
| 매번 같은 검사·체크리스트               | `/` 전용 스킬             |
| 긴 절차가 always-on 규칙에 있음         | 규칙은 한 줄, 절차는 스킬 |
| `/token-budget`이 같은 파일을 반복 지적 | 그 파일을 줄이자고 제안   |

제안 문장: 무엇을, 왜(횟수·동작), 스킬인지 규칙인지, `/propose-skill`로 초안을 볼지. 같은 패턴은 한 대화에서 한 번만. 숨은 프롬프트·다른 채팅은 대상이 아님. 파일은 사용자가 만들라고 한 뒤에만.

## 7. 효과 측정 (eval)

차별점을 말로만 두지 않는다. `evals/`에 작은 과제 저장소와 과제를 둔다.

| 과제               | 보는 것                                   |
| ------------------ | ----------------------------------------- |
| 실패하는 CI 고치기 | 실패 체크만 고쳤는지, 관련 없는 diff 크기 |
| 버그 재현·수정     | 재현 테스트를 먼저 썼는지, 재발 여부      |
| 머지 충돌 해결     | 양쪽 의도 보존, 테스트 통과               |
| 작은 기능 추가     | 최소 diff, 완료 전 검증 실행 여부         |

팩 없음 / `general` P0를 **모델 하나**, 과제당 **3회** 돌려 성공률, diff 줄 수, 토큰을 표로 남긴다. `api`·`web-ui`·`security`는 팩마다 과제 하나씩 더한다. 성공 여부는 스크립트가 판정한다. 결과가 나쁜 스킬은 공개 전에 고치거나 뺀다. 표본이 작으므로 “효과 증명”이 아니라 “재현 가능한 비교”로 소개하고, 누구나 다시 돌릴 명령(`npm run eval`)과 모델·날짜를 함께 공개한다. README에는 이 표와 짧은 녹화 GIF 하나를 둔다.

## 8. 공개·확산

- README: 최상단 언어별 목차, 영어 본문, 한국어 본문. `npx packfuse`. 팩 목록 전부. 래퍼는 아래쪽.
- 배포: npm `packfuse` 한 버전(설치기+전 팩). GitHub 릴리스. Cursor·Claude 플러그인 마켓도 이 출시에 등록한다.
- 노출: `awesome-cursor`·`awesome-claude-code`류 목록, Cursor 포럼, 각 도구 커뮤니티에 eval 결과와 함께 소개.
- 기여: `CONTRIBUTING.md`, 이슈 템플릿(스킬 제안 / 설치 버그).
- 버전: 제품 semver 하나. `CHANGELOG.md`. 도구 형식이 바뀌면 해당 변환기만 고친다.

## 9. 구현 순서 (한 출시)

문서 확인은 끝났다. 코드는 아래 순서로 한 번에 넣는다.

1. 설치기: `--home`/`--project`, 변환기(Cursor `.mdc`·User Rules 블록, Claude `CLAUDE.md`+`.claude/rules`, Codex `AGENTS.md`+에이전트 TOML, 훅 세 도구), 잠금 `.packfuse/`, `--dry-run`, `uninstall`/`update`/`list`/`doctor`.
2. `general` 전부(P0·P1·P2 규칙·스킬·에이전트·훅). `LICENSE`, `THIRD_PARTY_NOTICES.md`, 검증 CI.
3. `git`, `api`, `web-ui`, `security`, `local-runtime`, `tools`.
4. 래퍼 `react`, `figma`. Vercel·Figma는 원문 없이 공식 설치 안내 및 설치된 스킬 위임. 라이선스 확인 후 `THIRD_PARTY_NOTICES.md`에 적는다.
5. eval, README, `CONTRIBUTING.md`, npm 배포, 플러그인 마켓.

## 10. 유지 비용

가장 큰 비용은 세 도구의 형식 변경 추적이다.

- 도구별 변환기 모듈 분리(3.1).
- CI 설치 스냅샷이 형식 변경으로 결과가 바뀌면 실패하게 한다.
- 각 도구 변경 기록을 릴리스마다 확인하고, 바뀐 도구의 변환기만 패치 버전으로 낸다.
