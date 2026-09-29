# Harness Engineering 도입 분석 — Harness Architecture 설계

> **작성일**: 2026-09-28
> **범위**: `/Users/170h/Developer/Figma/ui-flow-diagram` (설계만 수행, 파일 생성/수정 없음)
> **목적**: R-01~R-13 Agent Failure Risks와 INV-01~INV-10 Architecture Invariants를 실제 Harness 구조에 연결하는 최소 설계
> **전제**: 1차 분석([`01-current-architecture-analysis.md`](01-current-architecture-analysis.md)) + Invariants([`02-architecture-invariants.md`](02-architecture-invariants.md)) + Risks([`03-agent-failure-risks.md`](03-agent-failure-risks.md))
> **참고**: `../harness-starter-kit` (개념만 참조, 구성은 복사하지 않음)

---

## 설계 원칙

- **Starter Kit을 복사하지 않음** — Kit의 _개념_(AGENTS.md 진입점, `.harness/` 규칙, failure memory, 검증 게이트)만 취하고, 이 프로젝트의 현실(테스트/linter/CI 없음, Node 기반, 2샌드박스)에 맞게 재구성.
- **기존 자산 재사용** — [`GEMINI.md`](../../GEMINI.md) (UI/커넥터 규칙), [`BUG_REPORT.md`](../../BUG_REPORT.md)/[`VERIFICATION_REPORT.md`](../../VERIFICATION_REPORT.md) (회귀 기준선), [`docs/harness-analysis/`](README.md) (01/02/03)을 Harness 지식 저장소로 그대로 활용.
- **스크립트는 Node `.mjs`** — Kit은 Python이지만 이 프로젝트는 Node/TS이므로 신규 런타임 의존 없이 `fs`+정규식으로 작성.
- **자동화 가능한 것은 자동화, Figma 데스크톱이 필요한 것은 수동 체크리스트로 명시** (INV-10/R-13 대응).

> **번호 규칙**: 본 문서(04)가 시리즈에 추가됨에 따라, 아래 설계에서 계획된 신규 지식 파일은 `05-action-index.md`, `06-field-ownership.md`, `07-verification-gates.md`로 번호를 부여한다.

---

## 1. AGENTS.md의 역할과 필수 지침

**역할**: 모든 Agent(Claude/Codex/Gemini/Zoo)가 **첫째로 읽는 단일 진입점**. 프로젝트 정체성, 하드 규칙(INV), 작업별 라우팅, 금지 사항, 완료 게이트를 정의하고, 세부 지식은 하위 파일로 라우팅한다. 중복 설명을 하지 않고 "어떤 작업이면 어떤 파일을 먼저 읽으라"는 지시만 둔다.

**반드시 포함할 지침**:

1. **프로젝트 정체성** — FigJam 플러그인, 2샌드박스(Core: `src/code.ts`+`src/customConnector.ts` / UI: `src/ui/` React 18), postMessage 전용 통신, 프로토콜 단일 소스 `src/types.ts`, 빌드 체인 `build→build:ui→build:inject`.
2. **기존 규칙 가리키기** — UI/커넥터/리사이즈 작업 전 [`GEMINI.md`](../../GEMINI.md) 필수 읽기(아이콘·폰트웨이트·단자크기·useAutoResize 규칙).
3. **하드 규칙(INV-01~10) 요약 + 전문 링크** — [`02-architecture-invariants.md`](02-architecture-invariants.md) 참조.
4. **작업별 라우팅 테이블** (아래 4번 항목).
5. **금지 사항** — `code.ts`/`AppContext.tsx`/`ConnectSection.tsx` 전체 재작성 금지, `dist/`·`src/ui.html` 수동 편집 금지, 신규 하드코딩 DOM ID 금지, 신규 `dispatchEvent`/`window` 상태/DOM 클래스 상태 판독 금지, 범위 외 파일(README, 구형 아티팩트) 수정 금지(R-12).
6. **완료 게이트(INV-10)** — `typecheck`+`build:all` 필수, 프로토콜 변경 시 `check:protocol` 추가, UI/DOM 변경 시 `check:constraints` 추가, 수동 체크리스트 수행, 실행한 명령+결과 보고 의무.
7. **Failure Memory 가리키기** — 알려진 위반(`failures/0001`)과 신규 버그 기록 규칙.

---

## 2. 필요한 Harness 파일 목록 (최소 10개 신규 + 2개 수정)

| #   | 파일                                                                 | 유형                                    |
| --- | -------------------------------------------------------------------- | --------------------------------------- |
| 1   | `AGENTS.md`                                                          | 신규 (루트)                             |
| 2   | `.harness/structure-rules.json`                                      | 신규                                    |
| 3   | `.harness/protocol-rules.json`                                       | 신규                                    |
| 4   | `.harness/allowlists.json`                                           | 신규                                    |
| 5   | `docs/harness-analysis/05-action-index.md`                           | 신규                                    |
| 6   | `docs/harness-analysis/06-field-ownership.md`                        | 신규                                    |
| 7   | `docs/harness-analysis/07-verification-gates.md`                     | 신규                                    |
| 8   | `docs/harness-analysis/failures/0001-protocol-union-switch-drift.md` | 신규                                    |
| 9   | `scripts/check-protocol.mjs`                                         | 신규                                    |
| 10  | `scripts/check-constraints.mjs`                                      | 신규                                    |
| —   | [`docs/harness-analysis/README.md`](README.md)                       | 수정 (인덱스 추가)                      |
| —   | [`package.json`](../../package.json)                                 | 수정 (`check:*`/`verify` 스크립트 추가) |

> 기존 [`01`](01-current-architecture-analysis.md)/[`02`](02-architecture-invariants.md)/[`03`](03-agent-failure-risks.md)은 **그대로 유지**하고(이동 없음), `docs/harness-analysis/`를 Harness 지식 저장소로 활용.

---

## 3. 각 파일의 역할

| 파일                            | 역할                                                                                                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                     | Agent 진입점. 정체성·INV 요약·라우팅·금지·완료 게이트 정의                                                                                                                                                                                          |
| `.harness/structure-rules.json` | 금지 파일 패턴(temp/backup), 무시 디렉터리, 보호 파일, 편집 금지 대상(`dist/`, `src/ui.html`) — 기계 가독 규칙                                                                                                                                      |
| `.harness/protocol-rules.json`  | 프로토콜 계약 레지스트리. 3개 표면(union/Core switch/UI 수신)의 파일 위치, 알려진 위반(`CREATE_CONNECTORS`/`CREATE_TEMPLATE`/`INIT_DONE`/`READY`/`SWITCH_TAB`/`TOAST`), no-op 액션(`UNDO`/`REDO`), `NOTIFY` 왕복 구조 — `check-protocol.mjs`가 소비 |
| `.harness/allowlists.json`      | DOM ID 레지스트리, DOM 접근 허용 파일, `dispatchEvent` 사이트+페어링 핸들러, `postMessage` 발신 파일 — `check-constraints.mjs`가 소비                                                                                                               |
| `05-action-index.md`            | 액션별 **발신 위치 인덱스**(어떤 액션이 어떤 파일/함수에서 전송되는지) + 단일 전송 함수 매핑 (R-06/R-11 대응)                                                                                                                                       |
| `06-field-ownership.md`         | 폼 필드별 **상태 소유권 맵**(어느 필드의 truth가 DOM인지/React인지, 읽기/쓰기 위치) (R-01/INV-05 대응)                                                                                                                                              |
| `07-verification-gates.md`      | 완료 게이트 정의(자동+수동) + Figma 데스크톱 수동 체크리스트 (INV-10/R-13 대응)                                                                                                                                                                     |
| `failures/0001-*.md`            | Failure memory. 현재 INV-03/04 위반(union↔switch 불일치)을 "재발하지 말아야 할 실패"로 기록 + 회귀 체크(`check-protocol.mjs`) 링크                                                                                                                  |
| `scripts/check-protocol.mjs`    | **G3 게이트**. `PluginAction` union ↔ `code.ts` switch ↔ `useFigmaMessage.ts` 수신 switch 3자 일치 검증 + `postMessage` 발신 사이트 대조 (R-08/R-09/INV-03/04)                                                                                      |
| `scripts/check-constraints.mjs` | 경계/제약 검증. `src/ui/` 내 `figma.` 0건, `customConnector` import 0건, `window.x=` 상태 할당 0건, `dispatchEvent`/`getElementById`가 allowlist 내인지 (R-02/03/04/05, INV-01/02/06)                                                               |

---

## 4. AGENTS.md에서 각 파일을 참조하는 조건 (라우팅 테이블)

| 작업 유형                   | 먼저 읽을 파일                                                                                                  | 추가 실행                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **신규 액션/메시지 타입**   | `05-action-index.md` + [`02`](02-architecture-invariants.md) (INV-03/04) + `.harness/protocol-rules.json`       | `npm run check:protocol`                   |
| **폼 필드 / DOM 상태 변경** | `06-field-ownership.md` + `.harness/allowlists.json`                                                            | `npm run check:constraints`                |
| **`code.ts` 수정**          | [`02`](02-architecture-invariants.md) (INV-08) + `05-action-index.md`                                           | diff 범위 리뷰(수동)                       |
| **UI 변경(일반)**           | [`GEMINI.md`](../../GEMINI.md) + `07-verification-gates.md`                                                     | `build:all` + 수동 체크                    |
| **버그 수정**               | `failures/` + [`BUG_REPORT.md`](../../BUG_REPORT.md) + [`VERIFICATION_REPORT.md`](../../VERIFICATION_REPORT.md) | 해당 항목 회귀 검증                        |
| **커넥터/단자 작업**        | [`GEMINI.md`](../../GEMINI.md) §3/§4/§11                                                                        | 수동 렌더링 확인                           |
| **모든 작업 완료 전**       | `07-verification-gates.md`                                                                                      | `typecheck`+`build:all`+(조건부) `check:*` |

---

## 5. R-01~R-17이 통제되는 Harness 요소

| Risk                                | 1차 통제 요소                                                            | 2차/보조                                                         |
| ----------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **R-01** React/DOM state 중복       | `06-field-ownership.md` + `allowlists.json`(dom_access_files)            | AGENTS.md 금지(반쪽 수정), `check-constraints.mjs`               |
| **R-02** `getElementById` 남용      | `allowlists.json`(dom_id_registry) + `check-constraints.mjs`             | AGENTS.md(신규 하드코딩 ID 금지)                                 |
| **R-03** `querySelector` 상태 판독  | `allowlists.json` + AGENTS.md(신규 DOM 클래스 상태 판독 금지)            | `07-verification`(useAutoResize 수동)                            |
| **R-04** `window.*` mutable state   | AGENTS.md 금지 + `check-constraints.mjs`(`window.x=` grep)               | —                                                                |
| **R-05** `dispatchEvent` 우회       | `allowlists.json`(dispatch_event_sites+페어링) + `check-constraints.mjs` | AGENTS.md 페어링 규칙                                            |
| **R-06** 여러 mutation path         | `05-action-index.md`(단일 전송 함수) + `protocol-rules.json`             | `check-protocol.mjs`(발신 사이트 수)                             |
| **R-07** protocol 우회              | `protocol-rules.json`(no_op/round_trip) + AGENTS.md                      | `05-action-index.md`                                             |
| **R-08** PluginAction↔switch 불일치 | **`check-protocol.mjs`** + `failures/0001`                               | AGENTS.md INV-03, `protocol-rules.json`(known_unhandled)         |
| **R-09** CoreToUI↔수신 불일치       | **`check-protocol.mjs`** + `failures/0001`                               | AGENTS.md INV-04, `protocol-rules.json`(known_undeclared/unsent) |
| **R-10** 대형 파일 수정 위험        | AGENTS.md 금지(전체 재작성 불가) + INV-08                                | `07-verification`(diff 리뷰)                                     |
| **R-11** 불필요한 전체 재분석       | **`05-action-index.md`**                                                 | —                                                                |
| **R-12** 범위 외 파일 수정          | AGENTS.md 범위 규율 + `structure-rules.json`(do_not_edit)                | —                                                                |
| **R-13** 검증 없이 완료             | **`07-verification-gates.md`** + `package.json` `verify`                 | AGENTS.md 완료 게이트                                            |
| **R-14** 폰트 미로드 텍스트 변경    | AGENTS.md 금지 + `03-agent-failure-risks.md`                             | 공식 문서: `figma-plugin-guide/api/typings-and-errors.md`        |
| **R-15** clientStorage 키 무분별    | `allowlists.json`(client_storage_keys) + AGENTS.md                       | 공식 문서: `figma-plugin-guide/api/figma-clientStorage.md`       |
| **R-16** variables API 미검증       | AGENTS.md 금지 + `03-agent-failure-risks.md`                             | 공식 문서: `figma-plugin-guide/api/figma-variables.md`           |
| **R-17** 제거된 노드 접근           | AGENTS.md 금지 + `03-agent-failure-risks.md`                             | 공식 문서: `figma-plugin-guide/api/typings-and-errors.md`        |

---

## 6. INV-01~INV-10이 강제되는 Harness 요소

| Invariant                         | 강제 요소                                                                        | 방식        |
| --------------------------------- | -------------------------------------------------------------------------------- | ----------- |
| **INV-01** 샌드박스 격리          | `check-constraints.mjs`(`src/ui/` 내 `figma.` 0건)                               | 자동        |
| **INV-02** postMessage 전용       | `check-constraints.mjs`(발신 사이트 대조) + AGENTS.md                            | 자동+규칙   |
| **INV-03** PluginAction 단일 계약 | **`check-protocol.mjs`** + `failures/0001` + AGENTS.md 3자 규칙                  | 자동+규칙   |
| **INV-04** CoreToUI 단일 계약     | **`check-protocol.mjs`** + `failures/0001` + AGENTS.md                           | 자동+규칙   |
| **INV-05** 폼 필드 단일 소유권    | `06-field-ownership.md` + `allowlists.json` + AGENTS.md                          | 규칙+수동   |
| **INV-06** customConnector 격리   | `check-constraints.mjs`(`src/ui/` 내 import 0건)                                 | 자동        |
| **INV-07** types.ts 단일 소스     | AGENTS.md 규칙 + 수동 리뷰                                                       | 규칙        |
| **INV-08** code.ts 수정 범위      | AGENTS.md 규칙 + 수동 diff 리뷰                                                  | 규칙        |
| **INV-09** 빌드 순서/산출물       | AGENTS.md + `07-verification`(`build:all` 게이트)                                | 자동(build) |
| **INV-10** 완료 전 검증 게이트    | **`07-verification-gates.md`** + `package.json` `verify` + AGENTS.md §완료게이트 | 자동+수동   |

---

## 7. 자동 검증 vs 수동 검증

**자동 검증 (스크립트/명령)**

- `npm run typecheck` (기존) — 컴파일 타임 타입 안전성
- `npm run build:all` (기존) — core+UI+인라인 순서 (INV-09)
- `npm run check:protocol` (신규) — union↔switch↔수신 3자 일치 (INV-03/04, R-08/09)
- `npm run check:constraints` (신규) — 샌드박스 격리·DOM allowlist·dispatchEvent·window 상태 (INV-01/02/06, R-02/03/04/05)
- 구조 체크 — 금지 파일 패턴 (R-12, `check-constraints.mjs`에 포함)

**수동 검증 (Figma 데스크톱 필수)**

- 폼 필드 동기화 시나리오 (INV-05/R-01) — 노드 선택 시 폼 값 복원 확인
- `useAutoResize`/`RESIZE_WINDOW` 흐름 (R-03) — 창 높이 진동/울찔 확인
- 커넥터 렌더링 ([`GEMINI.md`](../../GEMINI.md) §3/§4) — 단자 크기, SQUARE 면 채움
- 배타적 아코디언 ([`GEMINI.md`](../../GEMINI.md) §7) — 3사 상호 배타 + flicker 차단
- 드롭다운/팝오버 격리 ([`GEMINI.md`](../../GEMINI.md) §6) — 레이아웃 시프트, click-outside
- `NOTIFY` 토스트 왕복 (R-07) — 이중 알림 없음
- `INIT` 핸드셰이크 — 마운트 시 응답 확인
- [`BUG_REPORT.md`](../../BUG_REPORT.md) CONFIRMED 항목 회귀 체크

---

## 8. `.harness/` 디렉토리에 필요한 구성

```
.harness/
├── structure-rules.json    # 금지 파일 패턴 + 무시 디렉터리 + 보호/편집금지 파일
├── protocol-rules.json     # 프로토콜 3표면 위치 + 알려진 위반 + no-op/왕복 계약
└── allowlists.json         # DOM ID 레지스트리 + DOM 접근 파일 + dispatchEvent + postMessage 사이트
```

**`structure-rules.json`** (안)

```json
{
  "forbidden_patterns": [
    "**/temp_*",
    "**/*_new.*",
    "**/*_old.*",
    "**/*_backup.*",
    "**/*.bak"
  ],
  "ignored_directories": [
    ".git",
    "node_modules",
    "dist",
    ".agents",
    "harness-starter-kit"
  ],
  "protected_files": [
    "src/types.ts",
    "src/code.ts",
    "src/customConnector.ts",
    "src/ui/context/AppContext.tsx"
  ],
  "do_not_edit": ["dist/**", "src/ui.html", "package-lock.json"]
}
```

**`protocol-rules.json`** (안)

```json
{
  "protocol_source": "src/types.ts",
  "ui_to_core": {
    "union": "PluginAction",
    "core_switch_file": "src/code.ts",
    "known_unhandled": ["CREATE_CONNECTORS", "CREATE_TEMPLATE"]
  },
  "core_to_ui": {
    "union": "CoreToUIMessage",
    "ui_receive_file": "src/ui/hooks/useFigmaMessage.ts",
    "known_undeclared": ["INIT_DONE", "READY", "SWITCH_TAB"],
    "known_unsent": ["TOAST"]
  },
  "no_op_actions": ["UNDO", "REDO"],
  "round_trip": {
    "NOTIFY": "UI→Core→figma.notify (UI 토스트 컴포넌트 직접 구현 금지)"
  }
}
```

**`allowlists.json`** (안)

```json
{
  "dom_id_registry": [
    "node-title-input",
    "input-size-w",
    "input-size-h",
    "input-size-radius",
    "select-size-mode",
    "...(79매치 전량)"
  ],
  "dom_access_files": [
    "src/ui/hooks/useFigmaMessage.ts",
    "src/ui/context/AppContext.tsx",
    "src/ui/components/connection/ConnectSection.tsx",
    "..."
  ],
  "dispatch_event_sites": [
    {
      "file": "src/ui/components/appearance/SizeSection.tsx",
      "target": "select-size-mode",
      "paired_handler": "select-size-mode onChange"
    }
  ],
  "post_message_ui_to_core_files": [
    "src/ui/context/AppContext.tsx",
    "src/ui/App.tsx",
    "src/ui/components/node/PhaseSection.tsx",
    "src/ui/hooks/useAutoResize.ts",
    "..."
  ],
  "post_message_core_to_ui": { "file": "src/code.ts", "function": "postToUI" }
}
```

> 라인 번호가 아닌 **파일+ID+함수** 기준으로 등록하여, 코드 이동 시에도 allowlist가 깨지지 않도록 설계.

---

## 9. 현재 프로젝트에 불필요한 Starter Kit 구성

| 불필요 구성                                                                                                                                                                                   | 제외 이유                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `agent-skills/` (harness/adopt/doctor/refresh/review/update + 플러그인 어댑터)                                                                                                                | Kit 자체 워크플로우용 메타 도구. 타깃 프로젝트에 불필요                     |
| `commands/` (harness-adopt/doctor/update/refresh/review)                                                                                                                                      | `/harness ...` 메타 커맨드. 이 프로젝트는 해당 워크플로우 미사용            |
| `docs/theory/`, `docs/decisions/`, `docs/conventions/`, `docs/domain/`                                                                                                                        | 이론/ADR/컨벤션/도메인 — `GEMINI.md`가 컨벤션 대체, ADR은 필요 시 추후 추가 |
| `docs/checklists/`, `docs/examples/`, `docs/scoring/`, `docs/templates/`, `docs/prompts/`                                                                                                     | Kit의 adoption/dogfood/평가 메타 문서                                       |
| `docs/validation.md`, `evaluation.md`, `profiles.md`, `adoption-workflow.md`, `component-map.md`, `agent-skills-package.md`                                                                   | Kit 운영 문서                                                               |
| `scripts/apply_harness.py`, `check_agent_skills_package.py`, `check_docs_drift.py`, `check_effectiveness_plan.py`, `check_failure_memory.py`, `check_decision_memory.py`, `harness_doctor.py` | Kit 메타 스크립트 (Python). 이 프로젝트는 Node                              |
| `.harness/decision-memory-rules.json`                                                                                                                                                         | ADR(`docs/decisions/`) 도입 시에만 필요 — 현재 불필요                       |
| `.harness/source.json`                                                                                                                                                                        | Kit 소스 추적용. Kit을 의존으로 삼지 않으므로 불필요                        |
| `benchmarks/`, `.github/workflows/harness-check.yml`, `templates/profiles/*`                                                                                                                  | 벤치마크/CI/프로파일 — CI 없음, 불필요                                      |
| **Python 툴체인 전체**                                                                                                                                                                        | 프로젝트가 Node/TS이므로 `.mjs` 스크립트로 대체                             |

---

## 10. 최종 권장 디렉토리 구조

```
ui-flow-diagram/
├── AGENTS.md                          # [신규] Agent 진입점 (정체성·INV·라우팅·금지·완료게이트)
├── GEMINI.md                          # [기존] UI/커넥터 규칙 — AGENTS.md가 참조
├── BUG_REPORT.md                      # [기존] 회귀 기준선
├── VERIFICATION_REPORT.md             # [기존] 검증 기준선
├── .harness/
│   ├── structure-rules.json           # [신규] 구조 규칙 (금지/보호/편집금지)
│   ├── protocol-rules.json            # [신규] 프로토콜 계약 레지스트리
│   └── allowlists.json                # [신규] DOM/postMessage allowlist
├── docs/
│   └── harness-analysis/              # [기존 디렉터리 = Harness 지식 저장소]
│       ├── README.md                  # [수정] 05/06/07 + failures/ 인덱스 추가
│       ├── 01-current-architecture-analysis.md   # [기존] Baseline
│       ├── 02-architecture-invariants.md         # [기존] INV-01~10
│       ├── 03-agent-failure-risks.md             # [기존] R-01~13
│       ├── 04-harness-architecture-design.md     # [본 문서] Harness 설계
│       ├── 05-action-index.md                    # [신규] 액션→발신위치 인덱스
│       ├── 06-field-ownership.md                 # [신규] 폼 필드 소유권 맵
│       ├── 07-verification-gates.md              # [신규] 검증 게이트 + 수동 체크리스트
│       └── failures/
│           └── 0001-protocol-union-switch-drift.md  # [신규] INV-03/04 위반 failure memory
├── scripts/
│   ├── build-ui.mjs                   # [기존]
│   ├── check-protocol.mjs             # [신규] G3: union↔switch↔수신 일치 (R-08/09, INV-03/04)
│   └── check-constraints.mjs          # [신규] 격리·DOM allowlist·dispatchEvent·window (R-02~05, INV-01/02/06)
└── package.json                       # [수정] check:protocol / check:constraints / verify 스크립트 추가
```

**`package.json` 추가 스크립트 (안)**

```json
"check:protocol": "node scripts/check-protocol.mjs",
"check:constraints": "node scripts/check-constraints.mjs",
"verify": "npm run typecheck && npm run build:all && npm run check:protocol && npm run check:constraints"
```

---

## 도입 우선순위 (참고)

1. **1순위** — `check-protocol.mjs` + `failures/0001` + `protocol-rules.json` (현재 **실제 위반**인 INV-03/04를 자동 감지)
2. **2순위** — `AGENTS.md` + `05-action-index.md` + `06-field-ownership.md` + `allowlists.json` (R-01/06/11/12 통제)
3. **3순위** — `check-constraints.mjs` + `07-verification-gates.md` + `structure-rules.json` (격리/빌드/완료 게이트)

---

## 결론

이 설계는 R-01~R-13과 INV-01~INV-10을 모두 특정 Harness 파일/스크립트/규칙에 매핑하며, Starter Kit의 메타 구성(agent-skills, commands, Python 스크립트, ADR/벤치마크/CI)은 전부 제외하고 이 프로젝트의 Node/2샌드박스 현실에 맞는 **최소 10개 신규 파일 + 2개 수정**으로 구성된다.
