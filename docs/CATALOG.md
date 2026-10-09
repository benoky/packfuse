# 팩별 카탈로그

> 현재 보완판의 구현 및 제한은 [MAINTENANCE.md](MAINTENANCE.md)를 참고한다. 이 문서에서 `/`는 명시 호출을 뜻하며 Codex의 호출 표기는 `$skill`이다.

P0 먼저. **팩 전체 설치의 기본은 P0만.** P1·P2는 `--item` 또는 `--priority`.

**구성:** 스킬 = `SKILL.md` + (선택) `references/` · `scripts/`(설치기가 `/` 필드만 도구별로 변환). 규칙·에이전트·훅 = 정본 하나에서 도구별 변환. 항목 메타는 `packs/<팩>/manifest.json`.

**tools:** 설치기가 이 목록으로 변환 대상을 고른다. `cursor` / `claude` / `codex`.

원천이 Superpowers면 `obra/superpowers`, Anthropic이면 `anthropics/skills`, Vercel이면 `vercel-labs/agent-skills`. 자체는 이 셋에서 역할을 정한 것. 차용은 원문 통째 복제가 아니라 절차 참고(문서 스킬은 라이선스 확인).

Command 파일 없음.

---

## Packs

| 팩              | 설치                      | 안에 있는 종류               |
| --------------- | ------------------------- | ---------------------------- |
| `general`       | 기본, **팩 전체 시 P0만** | 규칙, 스킬, 서브에이전트, 훅 |
| `git`           | 옵트인, 팩 전체 시 P0만   | 스킬만                       |
| `web-ui`        | 옵트인                    | 스킬                         |
| `react`         | 옵트인, 공식 팩 바로가기  | 스킬 래퍼                    |
| `figma`         | 옵트인, 공식 팩 바로가기  | 스킬 래퍼                    |
| `api`           | 옵트인                    | 스킬                         |
| `local-runtime` | 옵트인                    | 스킬                         |
| `security`      | 옵트인                    | 스킬                         |
| `tools`         | 옵트인                    | 스킬                         |
| `docs`          | 옵트인, 공식 설치 중계    | 스킬 원문 없음               |

---

## general — Rules

| id                | 구성                                       | P   | tools   | 역할                                                                                                                     | 원천 |
| ----------------- | ------------------------------------------ | --- | ------- | ------------------------------------------------------------------------------------------------------------------------ | ---- |
| `requirements`    | 정본 `rules/*.md` → 설치기가 도구별로 변환 | P0  | 세 도구 | 요구 누락 금지, 구현 전 이의                                                                                             | 자체 |
| `safety`          | 정본 1개                                   | P0  | 세 도구 | 시크릿, 파괴적 명령                                                                                                      | 자체 |
| `verification`    | 정본 1개                                   | P0  | 세 도구 | 테스트, UI면 동작 확인                                                                                                   | 자체 |
| `code-change`     | 정본 1개                                   | P0  | 세 도구 | 최소 diff, 생성물 미수정                                                                                                 | 자체 |
| `git`             | 정본 1개                                   | P0  | 세 도구 | 커밋/푸시/PR은 요청 시에만. `git` 팩과 별개                                                                              | 자체 |
| `skill-promotion` | 정본 1개, 짧게                             | P0  | 세 도구 | 같은 절차를 다시 지시할 때만 제안(패턴당 1회). 구현 도중에는 제안하지 않음. 놓쳐도 됨. `requires: general:propose-skill` | 자체 |

답변 언어는 공유 팩에 없다. 개인 User Rule.  
변환: Cursor `.mdc`, Claude `CLAUDE.md` 블록, Codex `AGENTS.md` 블록. 마커 `<!-- pack:general:<id> -->`.

---

## general — Skills

| id                               | 구성                                                          | 호출          | P   | tools   | 역할                                                                                                    | 원천                                         |
| -------------------------------- | ------------------------------------------------------------- | ------------- | --- | ------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `brainstorming`                  | SKILL.md, references(질문 예시)                               | 자동 또는 `/` | P0  | 세 도구 | 구현 전 질문·대안·설계 확인                                                                             | Superpowers `brainstorming`                  |
| `writing-plans`                  | SKILL.md, references(태스크 템플릿)                           | 자동 또는 `/` | P0  | 세 도구 | 작은 태스크·검증 단위로 계획                                                                            | Superpowers `writing-plans`                  |
| `implement-change`               | SKILL.md                                                      | 자동          | P0  | 세 도구 | 탐색→최소 변경→검증                                                                                     | 자체. Superpowers `executing-plans` 요지     |
| `test-driven-development`        | SKILL.md, references(안티패턴)                                | 자동          | P0  | 세 도구 | 실패 테스트→최소 구현→통과                                                                              | Superpowers `test-driven-development`        |
| `systematic-debugging`           | SKILL.md                                                      | 자동          | P0  | 세 도구 | 재현→가설→수정→재검증                                                                                   | Superpowers `systematic-debugging`           |
| `fix-ci`                         | SKILL.md                                                      | 자동          | P0  | 세 도구 | 실패한 체크만, 로그 근거                                                                                | 자체                                         |
| `safe-refactor`                  | SKILL.md                                                      | 자동          | P1  | 세 도구 | 동작 유지 리팩터                                                                                        | 자체                                         |
| `verification-before-completion` | SKILL.md                                                      | 자동          | P0  | 세 도구 | 끝내기 전 테스트·동작 확인                                                                              | Superpowers `verification-before-completion` |
| `requesting-code-review`         | SKILL.md, references(체크리스트)                              | `/`           | P0  | 세 도구 | 버그·회귀·계약 위주 리뷰. 체크리스트는 `reviewer`와 공유                                                | Superpowers `requesting-code-review`         |
| `receiving-code-review`          | SKILL.md                                                      | `/`           | P1  | 세 도구 | 리뷰 피드백 반영                                                                                        | Superpowers `receiving-code-review`          |
| `docs-from-code`                 | SKILL.md                                                      | `/`           | P1  | 세 도구 | 코드를 정본으로 문서화                                                                                  | 자체                                         |
| `onboard-repo`                   | SKILL.md                                                      | `/`           | P1  | 세 도구 | `AGENTS.md` 초안 제안                                                                                   | 자체                                         |
| `propose-skill`                  | SKILL.md, `references/promotion-criteria.md`                  | `/`           | P0  | 세 도구 | 규칙이 가리키거나 사용자가 `/`로 열 때만 초안. 파일은 안 씀                                             | 자체                                         |
| `token-budget`                   | SKILL.md, `scripts/`(집계)                                    | `/`           | P1  | 세 도구 | 보이는 규칙·스킬·기록의 토큰 비중과 절약 제안. 파일은 안 씀. 숨은 프롬프트·과금 토큰은 대상이 아님      | 자체                                         |
| `handoff`                        | SKILL.md                                                      | `/`           | P1  | 세 도구 | 목표·결정·파일·다음 작업·제약만 담은 인수인계. 새 채팅에 붙여 넣음. 원문·폐기한 안은 제외. 파일은 안 씀 | 자체                                         |
| `blast-radius`                   | SKILL.md                                                      | `/`           | P0  | 세 도구 | 작은 diff가 깨뜨릴 곳                                                                                   | 커뮤니티(Cursor 마켓 `blast-radius` 역할)    |
| `resolve-merge-conflicts`        | SKILL.md                                                      | 자동          | P0  | 세 도구 | 의미 유지하며 충돌 해결. Git 팩 아님                                                                    | 자체                                         |
| `update-deps`                    | SKILL.md                                                      | `/`           | P1  | 세 도구 | 의존성 하나씩 올리고 테스트                                                                             | 자체 (Cursor 학습 `/update-deps` 패턴)       |
| `author-ci`                      | SKILL.md                                                      | `/`           | P1  | 세 도구 | 이 레포 러너에 워크플로 추가                                                                            | 자체                                         |
| `flaky-test`                     | SKILL.md                                                      | 자동          | P1  | 세 도구 | 흔들림 재현·격리                                                                                        | 자체                                         |
| `reproduce-minimal`              | SKILL.md                                                      | `/`           | P1  | 세 도구 | 버그를 최소 재현으로                                                                                    | 자체                                         |
| `explain-codebase`               | SKILL.md                                                      | `/`           | P1  | 세 도구 | 모듈 지도. `onboard-repo`보다 깊게                                                                      | 자체                                         |
| `subagent-driven-development`    | SKILL.md. `requires: general:reviewer, general:writing-plans` | `/`만         | P2  | 세 도구 | 계획 태스크마다 새 구현+리뷰 서브에이전트                                                               | Superpowers `subagent-driven-development`    |
| `adr`                            | SKILL.md, references(템플릿)                                  | `/`           | P2  | 세 도구 | 아키텍처 결정 기록                                                                                      | 자체                                         |
| `incident-lite`                  | SKILL.md                                                      | `/`           | P2  | 세 도구 | 증상·영향·롤백 여부                                                                                     | 자체                                         |

`/`만인 항목은 Cursor `disable-model-invocation: true`, Codex `agents/openai.yaml`의 `policy.allow_implicit_invocation: false`.

자동 P0: `brainstorming`, `writing-plans`, `implement-change`, `test-driven-development`, `systematic-debugging`, `fix-ci`, `verification-before-completion`, `resolve-merge-conflicts` (8개, 상한 8).

---

## git — Skills

| id                               | 구성     | 호출 | P   | tools   | 역할                                | 원천                                         |
| -------------------------------- | -------- | ---- | --- | ------- | ----------------------------------- | -------------------------------------------- |
| `commit-by-theme`                | SKILL.md | `/`  | P0  | 세 도구 | 주제별 커밋                         | 자체                                         |
| `finishing-a-development-branch` | SKILL.md | `/`  | P0  | 세 도구 | 테스트 후 머지/PR/정리              | Superpowers `finishing-a-development-branch` |
| `git-bisect`                     | SKILL.md | `/`  | P1  | 세 도구 | 회귀 커밋 탐색                      | 자체                                         |
| `using-git-worktrees`            | SKILL.md | `/`  | P1  | 세 도구 | worktree로 브랜치 격리              | Superpowers `using-git-worktrees`            |
| `cut-release`                    | SKILL.md | `/`  | P1  | 세 도구 | 버전·changelog·태그. 배포 계정 없음 | 자체                                         |

---

## general — Subagents

| id                     | 구성                      | P   | tools   | 역할                                                      | 원천   |
| ---------------------- | ------------------------- | --- | ------- | --------------------------------------------------------- | ------ |
| Explore, Bash, Browser | 없음                      | —   | —       | Cursor 내장. 설치 대상 아님                               | Cursor |
| `code-explorer`        | `agents/code-explorer.md` | P1  | 세 도구 | 읽기 위주 코드 탐색. 내장 Explore와 겹쳐 기본 설치에 없음 | 자체   |
| `reviewer`             | `agents/reviewer.md`      | P1  | 세 도구 | 별 창에서 결함 목록                                       | 자체   |
| `verifier`             | `agents/verifier.md`      | P1  | 세 도구 | 테스트·빌드·화면 확인                                     | 자체   |

에이전트는 정본 마크다운 하나에서 변환한다. Cursor·Claude는 `.md`, Codex는 `.toml`.

---

## general — Hooks

| id                     | 구성                      | P   | tools                                                       | 역할                                                   | 원천 |
| ---------------------- | ------------------------- | --- | ----------------------------------------------------------- | ------------------------------------------------------ | ---- |
| `afterFileEdit`        | 훅 정의 + format 스크립트 | P1  | cursor. Claude·Codex는 파일 편집 후 훅이 있으면 매핑        | 프로젝트가 명시 설정한 로컬 포맷터로 편집 파일만 처리  | 자체 |
| `beforeShellExecution` | 훅 정의 + deny 스크립트   | P1  | cursor, claude. Codex는 셸/PreToolUse에 매핑, 없으면 건너뜀 | 강제 push·디스크 파괴 차단                             | 자체 |
| `sessionEnd`           | 훅 정의                   | P2  | cursor. Claude·Codex Stop/session 훅이 있으면 매핑          | 대화 중 승격 제안을 놓친 경우 `/propose-skill` 한 줄만 | 자체 |

`tools`에 없는 도구로 설치하면 건너뛴다. 도구가 같은 시점의 훅을 지원하는 것이 확인되면 `tools`를 늘린다. 홈에 설치하면 그 사용자의 모든 저장소에 적용된다.

---

## web-ui — Skills

| id                      | 구성                         | 호출 | P   | tools   | 역할                                            | 원천                           |
| ----------------------- | ---------------------------- | ---- | --- | ------- | ----------------------------------------------- | ------------------------------ |
| `frontend-design`       | SKILL.md (절차 차용)         | 자동 | P0  | 세 도구 | 웹 UI, 흔한 AI 룩 회피                          | Anthropic `frontend-design`    |
| `webapp-testing`        | SKILL.md, scripts(선택)      | `/`  | P0  | 세 도구 | 로컬 웹 브라우저 검증. Playwright 계열과 하나만 | Anthropic `webapp-testing`     |
| `web-design-guidelines` | 래퍼 SKILL.md 또는 공식 설치 | `/`  | P1  | 세 도구 | 접근성·UX 감사                                  | Vercel `web-design-guidelines` |

---

## react — Skills

| id                     | 구성                              | 호출 | P   | tools   | 역할                 | 원천                                                              |
| ---------------------- | --------------------------------- | ---- | --- | ------- | -------------------- | ----------------------------------------------------------------- |
| `react-best-practices` | 래퍼 SKILL.md + 공식 팩 설치 명령 | 자동 | P0  | 세 도구 | React/Next 성능·패턴 | Vercel `vercel-react-best-practices` (`vercel-labs/agent-skills`) |

우리 저장소에 벤더 원문을 복제하지 않는다. 설치기는 공식 설치 힌트를 출력하며, 외부 설치 명령을 자동 실행하지 않는다.

---

## figma — Skills

| id                     | 구성                        | 호출 | P   | tools   | 역할           | 원천                     |
| ---------------------- | --------------------------- | ---- | --- | ------- | -------------- | ------------------------ |
| `figma-design-to-code` | 래퍼 SKILL.md (시크릿 없음) | `/`  | P0  | 세 도구 | 시안→코드 순서 | Figma 공식 스킬/플러그인 |

MCP·토큰은 사용자가 해당 도구 Customize에서 연결한다.

---

## api — Skills

| id                | 구성     | 호출 | P   | tools   | 역할                                 | 원천 |
| ----------------- | -------- | ---- | --- | ------- | ------------------------------------ | ---- |
| `api-design`      | SKILL.md | 자동 | P0  | 세 도구 | 경계, 에러 형식, 하위호환            | 자체 |
| `openapi-schema`  | SKILL.md | `/`  | P1  | 세 도구 | 스키마를 정본으로                    | 자체 |
| `db-migration`    | SKILL.md | 자동 | P0  | 세 도구 | 업/다운, 백필, 제자리 타입 변경 금지 | 자체 |
| `query-and-index` | SKILL.md | 자동 | P1  | 세 도구 | N+1, 인덱스, 트랜잭션                | 자체 |

---

## local-runtime — Skills

| id                   | 구성     | 호출 | P   | tools   | 역할                  | 원천                                      |
| -------------------- | -------- | ---- | --- | ------- | --------------------- | ----------------------------------------- |
| `dev-containers`     | SKILL.md | `/`  | P1  | 세 도구 | 재현 가능한 로컬 환경 | 자체 (ToB `devcontainer-setup` 참고 가능) |
| `docker-compose-dev` | SKILL.md | `/`  | P1  | 세 도구 | 로컬 서비스 구성      | 자체                                      |

---

## security — Skills

| id              | 구성                             | 호출 | P   | tools   | 역할                           | 원천                            |
| --------------- | -------------------------------- | ---- | --- | ------- | ------------------------------ | ------------------------------- |
| `security-pass` | SKILL.md, references(체크리스트) | `/`  | P0  | 세 도구 | 인증·비밀·주입. 공격 절차 없음 | 자체. Trail of Bits 전량과 별개 |

---

## tools — Skills

| id            | 구성                            | 호출 | P   | tools   | 역할               | 원천                    |
| ------------- | ------------------------------- | ---- | --- | ------- | ------------------ | ----------------------- |
| `mcp-builder` | SKILL.md, references(TS/Python) | `/`  | P1  | 세 도구 | MCP 서버 설계·구현 | Anthropic `mcp-builder` |

---

## docs — 중계

스킬 항목 없음. `install --home|--project --tool <tool> --pack docs`가 공식 스킬만 설치한다. `--dry-run`은 명령을 출력하고 실행하지 않는다.

`npx --yes skills add https://github.com/anthropics/skills -y -a <cursor|claude-code|codex> --skill pdf --skill docx --skill pptx --skill xlsx`

홈이면 `-g`가 붙는다. packfuse `uninstall`은 이 공식 스킬을 지우지 않는다. 기본 `general` 설치와 `update`는 이 명령을 실행하지 않는다.

---

## app 템플릿 (팩 아님)

| id            | 구성                     | tools   | 역할                            | 원천 |
| ------------- | ------------------------ | ------- | ------------------------------- | ---- |
| `AGENTS.md`   | 마크다운 템플릿          | 세 도구 | 앱 명령·구조                    | 자체 |
| `00-core.mdc` | always. 명령·정본 경로만 | cursor  | 앱 명령. general 규칙 반복 금지 | 자체 |

앱 템플릿 자동 복사는 현재 구현에 없다. 실제 명령·경로가 확인된 프로젝트별 파일을 별도로 작성하며 팩 스킬 트리와 섞지 않는다.

---

## 빼 둔 것

- Command 파일
- Cursor 내장 스킬·내장 서브에이전트 재구현
- Stripe/Sentry 등 벤더 본체
- 모든 팩을 단일 skills 루트에 합치기
- 한 프로젝트에서 여러 도구를 섞어 쓸 때의 격리
