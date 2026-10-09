# Packfuse 보완판 적용 안내

이 보완판은 업로드한 `src.zip`의 파일을 기준으로 작성했다. 실제 GitHub 최신 버전이나 원래 저장소의 루트 파일은 제공되지 않았다. 커밋·푸시·배포는 수행하지 않았다.

## 적용

1. 현재 프로젝트를 백업하거나 별도 작업 디렉터리에서 비교한다.
2. `src/`, `packs/`, `evals/`, `docs/`의 변경을 기존 프로젝트에 반영한다.
3. 루트 `package.json`은 기존 배포 메타데이터를 유지한다. 검증 스크립트(`typecheck`, `test`, `validate`)와 `yaml` 범위, Node `>=20.6`만 병합했다. 패키지·CLI 버전은 `1.0.0`이다. `private`는 설정하지 않는다.
4. 다음 명령으로 확인한다. Node.js 20.6 이상을 사용한다.

```bash
npm ci
npm run validate
npm run typecheck
npm test
npm run build
node dist/cli.js install --project --tool cursor --dry-run
```

원본 팩 구성, 항목 이름, 우선순위, 도구 선택 범위를 유지하고 패키지·CLI·팩 항목 버전은 `1.0.0`으로 둔다. 47개 스킬 본문은 영어이며 사용 조건, 제외 조건, 절차, 완료 기준을 포함한다.

## 설치 상태와 기존 버전 호환

- 기존 `paths`·`items`를 유지하고 `installations["pack:id"]`에 도구별 버전, 소유 파일, 공유 블록, 훅 정보를 기록한다.
- 기존 평면 state는 정확한 목적지와 소유 마커를 기준으로 마이그레이션한다. 예전 형식이 기록하지 않은 사용자 추가 파일은 삭제하지 않는다.
- 동일 이름의 외부 스킬은 덮어쓰지 않고 external로 기록한다. 삭제 시 해당 외부 스킬은 그대로 둔다.
- 관리되지 않는 규칙·에이전트 파일과 충돌하면 전체 변경을 쓰기 전에 중단한다.
- 스킬 삭제는 기록된 파일만 제거한다. 남아 있는 사용자 파일 때문에 비어 있지 않은 폴더는 보존한다.
- 공유 `AGENTS.md`·`CLAUDE.md`는 해당 마커 블록과 그 블록의 종료 개행만 제거한다. 블록 밖의 사용자 텍스트·들여쓰기·빈 줄·후행 공백은 유지한다.
- 훅은 정확히 일치하는 등록 명령과 소유 스크립트만 제거하며, 사용자 설정 및 다른 훅을 보존한다.
- 남아 있는 항목이 의존하는 항목의 삭제는 거부한다. 같은 도구에서 함께 제거하는 경우는 가능하다.
- update는 각 도구의 기존 설치 항목과 버전을 사용한다. 다른 도구에만 설치한 팩을 새로 확산하지 않는다.
- 상위 경로가 파일인 경우 쓰기 전에 거부하고 기존 파일 권한을 재작성 및 복구 시 보존한다. 롤백 도중 복구 하나가 실패해도 다른 파일 복구는 계속하며, 원래 오류와 복구 실패 경로를 함께 보고한다. 일반적인 파일 쓰기 실패에는 롤백을 시도한다. 프로세스 강제 종료·전원 중단·동시 CLI 실행까지 원자적으로 보장하지는 않는다. 같은 범위에 여러 변경 명령을 동시에 실행하지 않는다.

```bash
node dist/cli.js update --project --tool claude --dry-run
node dist/cli.js uninstall --project --tool cursor --pack general --item git --dry-run
node dist/cli.js doctor --project --tool codex
```

`install`의 잠금 복원은 선택 항목을 현재 배포본의 카탈로그로 복원한다. 과거 버전의 원문을 네트워크에서 가져오는 버전 저장소는 아니다. 기존 state가 사라졌다면 소유권을 임의로 추정해 파일을 덮어쓰지 않는다.

## 도구 변환과 토큰 견적

- Cursor/Claude의 명시 호출 스킬은 `disable-model-invocation: true`를 사용한다.
- Codex는 `SKILL.md`의 임의 필드 대신 `agents/openai.yaml`의 `policy.allow_implicit_invocation`에 기록한다.
- Claude의 경로 제한 규칙은 `paths` YAML frontmatter를 생성한다. Codex에는 본문에 적용 경로를 명시한다.
- Cursor 홈 규칙은 붙여 넣기 안내와 manual 상태를 제공한다. 사용자 UI에 실제 붙여 넣었는지는 자동 검증하지 않는다.
- dry-run은 실제 파일을 쓰지 않고 예정 경로를 출력한다. 도구별 선택된 자동 스킬 description과 무조건 적용 규칙의 토큰을 추정한다. 명시 호출 스킬 본문이나 호스트의 숨은 프롬프트는 포함하지 않는다.
- 공식 형식 근거: https://learn.chatgpt.com/docs/build-skills , https://learn.chatgpt.com/docs/agent-configuration/subagents , https://code.claude.com/docs/en/hooks , https://cursor.com/docs/hooks . 실제 앱에서의 로딩 여부는 앱 버전별 통합 검증이 추가로 필요하다.

## 훅 설정

훅은 P1/P2 선택 설치이며, 홈 설치는 여러 저장소에 적용된다. 실행 명령에는 Node 실행 파일과 인용된 스크립트 경로를 사용한다.

`beforeShellExecution`은 Cursor와 Claude 입력에서 명령을 추출하고 각 도구의 JSON 거부 형식으로 응답한다. 일반 Claude 명령에는 허용 결정을 강제로 반환하지 않아 기본 권한 흐름을 유지한다. 정규식 검사는 흔한 위험 명령을 잡는 보조 장치이며 셸 문법 전체를 해석하는 보안 경계가 아니다.

`afterFileEdit`은 프로젝트가 다음과 같이 명시적으로 설정한 로컬 Node 포맷터만 실행한다. 편집한 파일 하나를 전달하며 자동 패키지 다운로드나 저장소 전체 포맷팅을 하지 않는다.

```json
{
    "packfuse": {
        "format": {
            "script": "node_modules/prettier/bin/prettier.cjs",
            "args": ["--write", "{file}"]
        }
    }
}
```

`script`는 프로젝트 안에 실제 설치된 포맷터 실행 파일 경로로 바꾼다. 해당 경로가 없는 경우 오류가 출력된다. 설정이 없으면 아무것도 실행하지 않는다. 루트 밖 경로, 생성 폴더, 심볼릭 링크로 루트 밖을 가리키는 파일을 포맷하지 않는다. 제한 시간은 30초다.

`sessionEnd`는 transcript를 검사하거나 파일을 생성하지 않는 선택적 안내다. 실제 반복 패턴을 감지했다고 주장하지 않는다. Codex 훅은 현재 카탈로그에서 지원 대상이 아니며 임의 형식으로 설치하지 않는다.

## 벤더 래퍼

React·Figma 래퍼는 원문을 번들하지 않는다. 공식 스킬이 있으면 위임하고, 없으면 공식 출처 및 설치 필요 사항을 안내한다. manifest의 `vendor`는 수동 설치 힌트이며 임의 셸 명령으로 자동 실행하지 않는다. 설치 명령의 네트워크 접근, 라이선스, 지원 도구와 실제 설치 경로를 사용자가 검토해야 한다.

`web-design-guidelines`는 공식 스킬과 이름이 같으므로 재귀 위임을 하지 않도록 명시했다. 공식 버전이 이미 설치되어 있으면 설치기가 보존한다. `vendor` 힌트는 자동 실행하지 않는다.

`docs` 팩만 예외다. 스킬 원문이 없고, `--pack docs`일 때 skills CLI로 Anthropic `pdf`, `docx`, `pptx`, `xlsx`를 설치한다. 기본 설치와 `update`는 이 명령을 실행하지 않는다. `--dry-run`은 명령만 출력한다.

## 평가와 검증 범위

- 테스트는 임시 홈 및 프로젝트를 사용한다. 실제 사용자 홈에 팩을 설치하지 않는다.
- 설치기 테스트: 3개 도구 × 2개 범위, dry-run 무변경, 멱등성, 소유권, 공유 파일, 레거시 마이그레이션, 의존성, 훅 보존, 도구별 업데이트, 진단 및 포맷터.
- `evals/`는 7개 과제의 준비·채점·결과 출력을 제공한다. 모델 호출은 별도로 실행해야 한다.
- 채점기 self-test와 실제 AI 비교 결과를 구분한다. 모델명·토큰·테스트 선행 여부를 추정해 채우지 않는다.
- Windows/macOS 실기기, Cursor/Claude/Codex 실제 앱, 실제 AI 모델 비교, 원본 저장소 CI·npm 배포는 이번 검증 범위 밖이다.
- 체크섬 정책, 크래시 복구 저널, 동시 변경 잠금, 과거 버전 원문 다운로드는 구현하지 않았다.
