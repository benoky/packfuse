# Packfuse

[![npm](https://img.shields.io/npm/v/packfuse.svg)](https://www.npmjs.com/package/packfuse)

Skills and rules for working with Cursor, Claude Code, and Codex. Install the workflows you need for planning changes, fixing bugs, reviewing code, and checking the result.

[English](#english) · [한국어](#한국어)

## English

- [What is Packfuse?](#what-is-packfuse)
- [Install with npm](#install-with-npm)
- [Install from a plugin marketplace](#install-from-a-plugin-marketplace)
- [Use your first skill](#use-your-first-skill)
- [Add the packs you need](#add-the-packs-you-need)
- [Update or remove](#update-or-remove)
- [If something is missing](#if-something-is-missing)
- [Credits](#credits)

### What is Packfuse?

Packfuse is a collection of coding workflows you can add to your AI coding tool. It gives the agent instructions for tasks such as reproducing a bug before fixing it, reviewing a diff for regressions, or checking a change before calling it complete.

The collection is organized into **packs**. Start with `general` for everyday coding, then add packs for Git, APIs, web interfaces, or security as you need them. You can also install a single skill.

The same packs and skills work in Cursor, Claude Code, and Codex. You choose the tool when you install. The instructions stay the same; each tool has its own way to invoke a skill. Agents and hooks, when you add them, are for Cursor and Claude Code.

- **Skills** describe how to handle a particular task. Some can be selected by the agent when relevant; others are invoked explicitly.
- **Rules** provide ongoing guidance about requirements, change scope, Git actions, and verification.
- **Agents and hooks** are optional additions. The default npm installation does not include them.

Packfuse works inside your existing coding tool. It does not require a separate account or API key. Your tool's model access, permissions, and any external service connections still apply.

### Install with npm

You need **Node.js 20.6 or later** and a supported coding tool. Run the command in the project where you want to use Packfuse. You do not need to clone or build Packfuse.

Choose one command for your tool:

```bash
# Cursor
npx packfuse@latest install --project --tool cursor

# Claude Code
npx packfuse@latest install --project --tool claude

# Codex
npx packfuse@latest install --project --tool codex
```

On a first installation, each command adds the `general` default set: **six rules and eleven skills**. It includes planning, implementation, debugging, CI fixes, merge-conflict resolution, code review, and verification. Open the configured project in your tool and start a new session to use the installed skills.

To see the planned installation before writing files, add `--dry-run`:

```bash
npx packfuse@latest install --project --tool cursor --dry-run
```

For personal use across projects, replace `--project` with `--home`:

```bash
npx packfuse@latest install --home --tool claude
```

Choose a project installation for instructions specific to one repository; choose a home installation for your own reusable setup. Avoid installing the same skills in both locations unless you intend to manage two copies.

You can target a directory without changing your terminal's location:

```bash
npx packfuse@latest install --project --tool cursor --cwd "C:\Project\my-app"
```

If you prefer a global CLI, run `npm install -g packfuse`. You can then use `packfuse` instead of `npx packfuse@latest` in these examples.

### Install from a plugin marketplace

If Packfuse is available in your tool's configured marketplace, install it there instead of running the npm installer for the same skills. Marketplace availability and the contents of each plugin bundle can differ; check the listing for the packs it includes. If no Packfuse listing is available, use npm above.

| Tool        | Installation                                                                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor      | Open **Customize** in the sidebar, search for Packfuse, open its details, then choose **Install** and a project or user scope.                                                                                                      |
| Claude Code | Enter `/plugin`, find Packfuse in **Discover**, and choose the installation scope. For a separate marketplace, first add the source supplied by its publisher. Follow the activation or reload instructions in the install summary. |
| Codex CLI   | Enter `/plugins`, find Packfuse in a configured marketplace, and install it. Start a new session after installation.                                                                                                                |

See the official [Cursor plugin guide](https://cursor.com/docs/plugins), [Claude Code plugin guide](https://code.claude.com/docs/en/plugins/install), and [Codex plugin guide](https://learn.chatgpt.com/docs/plugins) for the host's installation options.

For marketplace installations, use the host's plugin manager to enable, update, or remove the plugin. The npm commands below manage CLI installations.

### Use your first skill

After installing `general`, ask your agent to work on a real task. Include the relevant files, error output, or expected behavior:

```text
The login test fails after the session expires. Reproduce the failure,
find its cause, and verify the fix with the relevant tests.
```

The debugging workflow is available for a request like this. Automatic selection depends on the tool and the request; you can name the skill when you want to be explicit.

To request a review, type `/` in Cursor or Claude Code and select `requesting-code-review`. For an npm installation, you can enter:

```text
/requesting-code-review Review the current diff for bugs and missing tests.
```

In Codex CLI, use:

```text
$requesting-code-review Review the current diff for bugs and missing tests.
```

For a marketplace installation, select the command shown by the host. Claude Code plugin commands use `/plugin-name:skill-name`, so their names can differ from the npm examples. Use the plugin or skill picker on surfaces with different invocation controls.

A few useful starting points:

| Task                                    | Skill                    | Availability with npm |
| --------------------------------------- | ------------------------ | --------------------- |
| Clarify a feature before coding         | `brainstorming`          | Default `general`     |
| Find the cause of a failure             | `systematic-debugging`   | Default `general`     |
| Fix a failing CI job                    | `fix-ci`                 | Default `general`     |
| Review a change                         | `requesting-code-review` | Default `general`     |
| Examine the impact of a proposed change | `blast-radius`           | Default `general`     |
| Prepare context for the next session    | `handoff`                | Add separately        |
| Group changes into commits              | `commit-by-theme`        | Add from `git`        |

For Git workflows, state the action you want the agent to take. Installing a Git skill does not itself authorize a commit, push, or release.

### Add the packs you need

These commands are for **npm installations**. Run them from the target project, or add `--cwd`.

Install the saved set, a whole pack, more of that pack, or one skill.

| What you choose                       | Option                              | What is installed                                            |
| ------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| First install, or the saved selection | no `--pack`                         | The lock, or `general` P0 if there is none                   |
| A pack                                | `--pack api`                        | That pack's P0. `docs` installs the official document skills |
| More of that pack                     | `--pack … --priority p1` or `p2`    | P0 plus that tier                                            |
| One skill                             | `--pack git --item commit-by-theme` | That item and anything it requires                           |

```bash
# Add the API pack's default skills.
npx packfuse@latest install --project --tool cursor --pack api

# Add one Git skill to your personal Claude Code setup.
npx packfuse@latest install --home --tool claude --pack git --item commit-by-theme

# Add handoff to your Codex project setup.
npx packfuse@latest install --project --tool codex --pack general --item handoff
```

| Pack            | Use it for                                                           |
| --------------- | -------------------------------------------------------------------- |
| `general`       | Planning, implementation, debugging, review, and verification        |
| `git`           | Commits, branch completion, bisect, worktrees, and releases          |
| `api`           | API design, database migrations, OpenAPI schemas, and query analysis |
| `web-ui`        | Frontend implementation, browser checks, and interface review        |
| `security`      | Authorization, secrets, and input-boundary review                    |
| `local-runtime` | Dev containers and Docker Compose workflows                          |
| `tools`         | MCP server development                                               |
| `react`         | Vercel React and Next performance guidance                           |
| `figma`         | Turn a supplied Figma design into code                               |
| `docs`          | Official Anthropic PDF, Word, spreadsheet, and slide skills          |

`--priority` does not apply to a lock restore or to `--item`. `general` P1 also includes agents and hooks for Cursor and Claude Code.

`local-runtime` and `tools` have no P0 items. Select an item or include P1:

```bash
npx packfuse@latest install --project --tool cursor --pack local-runtime --priority p1
```

`docs` has no Packfuse skills. This installs the official `pdf`, `docx`, `pptx`, and `xlsx` skills:

```bash
npx packfuse@latest install --project --tool cursor --pack docs
```

`--dry-run` prints that installer command and does not run it. `uninstall` does not remove those official skills.

The `react` and `figma` packs keep a short local skill and do not bundle the vendor implementations. Packfuse prints a setup hint when one is recorded; it does not run those external installers. Configure Figma access and other service connections in your coding tool.

To browse the catalog and recorded installation:

```bash
npx packfuse@latest list --project
```

### Update or remove

For an npm installation, run:

```bash
# Update the project's Cursor items using the latest npm release's catalog.
npx packfuse@latest update --project --tool cursor

# Remove one skill.
npx packfuse@latest uninstall --project --tool codex --pack general --item handoff

# Remove the Git pack from your personal Claude Code setup.
npx packfuse@latest uninstall --home --tool claude --pack git

# Remove all Packfuse-managed items for all tools in this project.
npx packfuse@latest uninstall --project --all
```

Use the same location and tool as the original installation. Updates use the catalog included in the CLI release you run. If you installed the CLI globally, run `npm install -g packfuse@latest` before `packfuse update`.

Removing the global npm package with `npm uninstall -g packfuse` removes the CLI, not the skills already installed in your coding tools. Remove those with `packfuse uninstall` first if you no longer want them.

For a marketplace installation, return to the host's plugin manager. `packfuse uninstall` does not remove a marketplace plugin.

### If something is missing

| Problem                                            | What to check                                                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A skill does not appear                            | Start a new session in the configured project. For npm, check that `--tool` and `--home`/`--project` match your intended setup. For a plugin, check that it is enabled. |
| `handoff` or another extra skill is missing        | It may be outside the default set. Install it with `--pack` and `--item`; for plugins, check the bundle's contents.                                                     |
| Installing `tools` or `local-runtime` adds nothing | These packs have no P0 items. Select an item or add `--priority p1`.                                                                                                    |
| Document skills are missing                        | Install the `docs` pack. It runs the skills CLI for `pdf`, `docx`, `pptx`, and `xlsx`.                                                                                  |
| Cursor home rules are not active                   | A home installation prints rules for you to paste into Cursor's **User Rules**. Complete that step, or use a project installation.                                      |
| A vendor skill or service is unavailable           | Follow the setup hint and connect the required tool or service separately.                                                                                              |
| You see a file conflict                            | Inspect the existing definition before replacing it. Keep your own custom skills separate from Packfuse-managed copies.                                                 |

For an npm installation, run a diagnostic in the affected location:

```bash
npx packfuse@latest doctor --project --tool cursor
```

### Credits

Some workflows draw on [Superpowers](https://github.com/obra/superpowers) and Anthropic skills. Sources and third-party notices are documented in [the catalog](docs/CATALOG.md) and `THIRD_PARTY_NOTICES.md`.

---

## 한국어

- [Packfuse는 무엇인가요?](#packfuse는-무엇인가요)
- [npm으로 설치하기](#npm으로-설치하기)
- [플러그인 마켓에서 설치하기](#플러그인-마켓에서-설치하기)
- [설치 후 처음 사용하기](#설치-후-처음-사용하기)
- [필요한 팩과 스킬 추가하기](#필요한-팩과-스킬-추가하기)
- [업데이트와 삭제](#업데이트와-삭제)
- [스킬이 보이지 않거나 동작하지 않을 때](#스킬이-보이지-않거나-동작하지-않을-때)
- [출처](#출처)

### Packfuse는 무엇인가요?

Packfuse는 Cursor, Claude Code, Codex에서 쓰는 개발 작업용 스킬과 규칙 모음입니다. 버그를 재현하고 원인을 찾는 절차, 변경된 코드를 리뷰하는 기준, 작업을 마치기 전에 결과를 확인하는 방법 등을 코딩 에이전트에 추가합니다.

작업 종류별로 **팩**을 골라 설치할 수 있습니다. 일상적인 개발에는 `general`로 시작하고, 필요할 때 Git·API·웹 UI·보안 팩을 추가하면 됩니다. 스킬 하나만 설치할 수도 있습니다.

같은 팩과 스킬을 Cursor, Claude Code, Codex 중 어디에나 설치할 수 있습니다. 설치할 때 도구를 고르면 됩니다. 스킬 내용은 같고, 호출 방법만 도구마다 다릅니다. 에이전트와 훅을 추가하면 Cursor와 Claude Code에서 씁니다.

- **스킬**은 특정 작업을 수행하는 절차입니다. 요청에 따라 에이전트가 선택하는 스킬과 사용자가 직접 호출하는 스킬이 있습니다.
- **규칙**은 요구사항, 변경 범위, Git 작업, 검증 등에 계속 적용되는 지침입니다.
- **에이전트와 훅**은 선택 항목입니다. npm 기본 설치에는 포함되지 않습니다.

설치한 스킬은 사용 중인 코딩 도구 안에서 실행됩니다. Packfuse용 계정이나 API 키는 필요하지 않으며, 모델 이용 권한과 외부 서비스 연결은 해당 도구의 설정을 따릅니다.

### npm으로 설치하기

**Node.js 20.6 이상**과 사용할 코딩 도구가 필요합니다. Packfuse를 적용할 프로젝트의 터미널에서 실행하세요. Packfuse 저장소를 복제하거나 빌드할 필요는 없습니다.

사용하는 도구에 맞는 명령 하나를 선택합니다.

```bash
# Cursor
npx packfuse@latest install --project --tool cursor

# Claude Code
npx packfuse@latest install --project --tool claude

# Codex
npx packfuse@latest install --project --tool codex
```

처음 설치하면 `general`의 기본 구성인 **규칙 6개와 스킬 11개**가 들어갑니다. 계획, 구현, 디버깅, CI 오류 수정, 병합 충돌 해결, 코드 리뷰, 검증을 위한 항목입니다. 설치한 프로젝트를 코딩 도구에서 열고 새 세션을 시작하세요.

파일을 쓰기 전에 설치 내용을 확인하려면 `--dry-run`을 붙입니다.

```bash
npx packfuse@latest install --project --tool cursor --dry-run
```

여러 프로젝트에서 개인 설정으로 쓰려면 `--project` 대신 `--home`을 사용합니다.

```bash
npx packfuse@latest install --home --tool claude
```

한 저장소에 적용할 설정은 프로젝트에, 여러 저장소에서 사용할 개인 설정은 홈에 설치하면 됩니다. 같은 스킬을 두 곳에 설치하면 관리할 사본도 두 개가 됩니다.

현재 터미널 위치와 다른 프로젝트에 설치하려면 경로를 지정합니다.

```bash
npx packfuse@latest install --project --tool cursor --cwd "C:\Project\my-app"
```

전역 CLI를 쓰고 싶다면 `npm install -g packfuse`로 설치하세요. 이후 예시의 `npx packfuse@latest`를 `packfuse`로 바꿔 실행할 수 있습니다.

### 플러그인 마켓에서 설치하기

사용하는 도구의 마켓에 Packfuse가 있다면 그곳에서 설치할 수 있습니다. 같은 스킬을 npm과 마켓 양쪽으로 설치할 필요는 없습니다. 마켓별 제공 여부와 플러그인에 포함된 팩은 다를 수 있으므로 상세 페이지를 확인하세요. 항목이 없다면 위의 npm 설치 방법을 사용하면 됩니다.

| 도구        | 설치 방법                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor      | 사이드바의 **Customize**에서 Packfuse를 검색합니다. 상세 화면에서 **Install**을 선택하고 프로젝트 또는 사용자 범위를 고릅니다.                                                                          |
| Claude Code | `/plugin`을 입력하고 **Discover**에서 Packfuse를 찾아 설치 범위를 선택합니다. 별도 마켓에서 제공된다면 배포자가 안내한 마켓 소스를 먼저 추가하세요. 설치 결과에 표시된 활성화·새로고침 안내를 따릅니다. |
| Codex CLI   | `/plugins`를 입력하고 등록된 마켓에서 Packfuse를 찾아 설치합니다. 설치 후 새 세션을 시작합니다.                                                                                                         |

도구별 설치 옵션은 공식 [Cursor 플러그인 안내](https://cursor.com/docs/plugins), [Claude Code 플러그인 안내](https://code.claude.com/docs/en/plugins/install), [Codex 플러그인 안내](https://learn.chatgpt.com/docs/plugins)를 참고하세요.

마켓으로 설치한 플러그인은 해당 도구의 플러그인 관리자에서 활성화·업데이트·삭제합니다. 아래 CLI 명령은 npm으로 설치한 구성을 관리할 때 사용합니다.

### 설치 후 처음 사용하기

`general`을 설치했다면 평소처럼 작업을 요청하면 됩니다. 대상 파일, 오류 메시지, 기대하는 동작을 함께 주면 스킬이 다룰 범위가 분명해집니다.

```text
세션이 만료된 뒤 로그인 테스트가 실패해.
실패를 재현하고 원인을 찾은 다음, 관련 테스트로 수정 결과를 확인해줘.
```

이런 요청에는 디버깅 스킬을 활용할 수 있습니다. 자동 선택 여부는 도구와 요청에 따라 달라집니다. 특정 스킬을 쓰고 싶다면 이름을 지정하세요.

코드 리뷰를 요청하려면 Cursor나 Claude Code에서 `/`를 입력하고 `requesting-code-review`를 선택합니다. npm 설치 기준으로 다음과 같이 입력할 수 있습니다.

```text
/requesting-code-review 현재 diff에서 버그와 빠진 테스트를 검토해줘.
```

Codex CLI에서는 다음과 같이 호출합니다.

```text
$requesting-code-review 현재 diff에서 버그와 빠진 테스트를 검토해줘.
```

마켓 설치는 도구에 표시되는 명령을 선택하세요. Claude Code 플러그인 스킬은 `/플러그인명:스킬명` 형태이므로 npm 설치 예시와 이름이 다를 수 있습니다. 호출 방식이 다른 화면에서는 플러그인·스킬 선택 메뉴를 사용하면 됩니다.

| 하고 싶은 작업             | 스킬                     | npm 설치 기준       |
| -------------------------- | ------------------------ | ------------------- |
| 구현 전에 요구사항 정리    | `brainstorming`          | `general` 기본 구성 |
| 오류 원인 추적             | `systematic-debugging`   | `general` 기본 구성 |
| 실패하는 CI 수정           | `fix-ci`                 | `general` 기본 구성 |
| 변경 코드 리뷰             | `requesting-code-review` | `general` 기본 구성 |
| 변경 영향 범위 확인        | `blast-radius`           | `general` 기본 구성 |
| 다음 세션에 넘길 맥락 정리 | `handoff`                | 별도 추가           |
| 변경 사항을 주제별로 커밋  | `commit-by-theme`        | `git`에서 추가      |

Git 스킬을 사용할 때는 수행할 동작을 명시하세요. 스킬을 설치하는 것만으로 커밋·푸시·릴리스를 허용한 것으로 간주하지 않습니다.

### 필요한 팩과 스킬 추가하기

다음은 **npm 설치용** 명령입니다. 대상 프로젝트에서 실행하거나 `--cwd`로 경로를 지정하세요.

저장된 선택, 팩 전체, 그 팩의 상위 등급, 스킬 하나 중 하나로 설치합니다.

| 고르는 방법                 | 옵션                                | 들어가는 것                                |
| --------------------------- | ----------------------------------- | ------------------------------------------ |
| 처음 설치, 또는 저장된 선택 | `--pack` 없음                       | 잠금이 있으면 그 선택, 없으면 `general` P0 |
| 팩                          | `--pack api`                        | 그 팩의 P0. `docs`는 공식 문서 스킬        |
| 그 팩을 더 넓게             | `--pack … --priority p1` 또는 `p2`  | P0에 해당 등급까지                         |
| 스킬 하나                   | `--pack git --item commit-by-theme` | 그 항목과 의존 항목                        |

```bash
# API 팩의 기본 스킬 추가
npx packfuse@latest install --project --tool cursor --pack api

# 개인 Claude Code 설정에 커밋 스킬 하나 추가
npx packfuse@latest install --home --tool claude --pack git --item commit-by-theme

# Codex 프로젝트 설정에 handoff 추가
npx packfuse@latest install --project --tool codex --pack general --item handoff
```

| 팩              | 주요 용도                                            |
| --------------- | ---------------------------------------------------- |
| `general`       | 계획, 구현, 디버깅, 리뷰, 검증                       |
| `git`           | 커밋, 브랜치 마무리, bisect, worktree, 릴리스        |
| `api`           | API 설계, DB 마이그레이션, OpenAPI 스키마, 쿼리 분석 |
| `web-ui`        | 프런트엔드 구현, 브라우저 검증, 인터페이스 리뷰      |
| `security`      | 인가, 비밀정보, 입력 경계 검토                       |
| `local-runtime` | 개발 컨테이너와 Docker Compose 작업                  |
| `tools`         | MCP 서버 개발                                        |
| `react`         | Vercel React·Next 성능 가이드                        |
| `figma`         | 제공된 Figma 시안을 코드로 구현                      |
| `docs`          | 공식 Anthropic PDF·Word·스프레드시트·슬라이드 스킬   |

`--priority`는 잠금 복원과 `--item`에는 적용되지 않습니다. `general` P1에는 Cursor·Claude Code용 에이전트와 훅도 들어갑니다.

`local-runtime`, `tools`에는 P0 항목이 없습니다. 항목을 직접 선택하거나 P1을 포함해야 합니다.

```bash
npx packfuse@latest install --project --tool cursor --pack local-runtime --priority p1
```

`docs`에는 Packfuse 스킬이 없습니다. 다음 명령이 공식 `pdf`, `docx`, `pptx`, `xlsx`를 설치합니다.

```bash
npx packfuse@latest install --project --tool cursor --pack docs
```

`--dry-run`은 그 설치 명령만 출력하고 실행하지 않습니다. `uninstall`은 그 공식 스킬을 지우지 않습니다.

`react`와 `figma`는 짧은 로컬 스킬만 두고 벤더 구현을 포함하지 않습니다. 설치 힌트가 있으면 출력하며, 그 외부 설치기는 실행하지 않습니다. Figma 등 서비스 연결은 코딩 도구에서 별도로 설정하세요.

전체 항목과 기록된 설치 구성을 확인하려면 다음 명령을 실행합니다.

```bash
npx packfuse@latest list --project
```

### 업데이트와 삭제

npm으로 설치했다면 다음 명령을 사용합니다.

```bash
# 최신 npm 배포본의 카탈로그로 Cursor 프로젝트 항목 업데이트
npx packfuse@latest update --project --tool cursor

# 스킬 하나 삭제
npx packfuse@latest uninstall --project --tool codex --pack general --item handoff

# 개인 Claude Code 설정에서 Git 팩 삭제
npx packfuse@latest uninstall --home --tool claude --pack git

# 이 프로젝트에서 모든 도구의 Packfuse 관리 항목 삭제
npx packfuse@latest uninstall --project --all
```

처음 설치한 위치와 도구를 지정하세요. 업데이트에는 실행 중인 CLI 배포본의 카탈로그가 사용됩니다. 전역 CLI를 쓴다면 `npm install -g packfuse@latest`로 CLI를 갱신한 뒤 `packfuse update`를 실행합니다.

`npm uninstall -g packfuse`는 CLI만 삭제합니다. 코딩 도구에 설치한 스킬도 제거하려면 먼저 `packfuse uninstall`을 실행하세요.

마켓으로 설치했다면 해당 도구의 플러그인 관리자에서 관리합니다. `packfuse uninstall`로 마켓 플러그인을 삭제할 수는 없습니다.

### 스킬이 보이지 않거나 동작하지 않을 때

| 상황                                           | 확인할 내용                                                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 설치한 스킬이 목록에 없음                      | 설치한 프로젝트에서 새 세션을 시작하세요. npm 설치는 도구·홈·프로젝트 선택을, 마켓 설치는 플러그인 활성화 상태를 확인합니다. |
| `handoff` 등 추가 스킬이 없음                  | 기본 구성 밖의 항목일 수 있습니다. npm은 `--pack`과 `--item`으로 추가하고, 마켓은 플러그인의 포함 항목을 확인하세요.         |
| `tools`, `local-runtime` 설치 결과가 비어 있음 | P0 항목이 없는 팩입니다. 항목을 선택하거나 `--priority p1`을 붙이세요.                                                       |
| 문서 스킬이 없음                               | `docs` 팩을 설치하세요. `pdf`, `docx`, `pptx`, `xlsx`를 skills CLI로 설치합니다.                                             |
| Cursor 홈 규칙이 적용되지 않음                 | 홈 설치 시 출력된 규칙을 Cursor의 **User Rules**에 붙여 넣어야 합니다. 해당 단계를 완료하거나 프로젝트 설치를 사용하세요.    |
| 외부 공식 스킬이나 서비스가 없음               | 설정 힌트를 따라 필요한 도구·서비스를 별도로 연결하세요.                                                                     |
| 기존 파일과 충돌함                             | 기존 정의를 확인한 뒤 처리하세요. 직접 만든 스킬은 Packfuse가 관리하는 사본과 별도로 두는 편이 좋습니다.                     |

npm 설치를 진단하려면 문제가 생긴 위치에서 실행하세요.

```bash
npx packfuse@latest doctor --project --tool cursor
```

### 출처

일부 워크플로는 [Superpowers](https://github.com/obra/superpowers)와 Anthropic 스킬을 참고했습니다. 항목별 출처와 제3자 고지는 [카탈로그](docs/CATALOG.md)와 `THIRD_PARTY_NOTICES.md`에 정리되어 있습니다.
