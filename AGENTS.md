# AGENTS.md — UI Flow Diagram 플러그인 Agent 진입점

> **이 파일은 모든 Agent(Claude/Codex/Gemini/Zoo)가 첫째로 읽는 단일 진입점이다.**
> 프로젝트 정체성, 하드 규칙(INV), 작업별 라우팅, 금지 사항, 완료 게이트를 정의하고,
> 세부 지식은 하위 파일로 라우팅한다. 중복 설명을 하지 않고 **"어떤 작업이면 어떤 파일을 먼저 읽으라"**는 지시만 둔다.

---

## 1. 프로젝트 정체성

- **Figma 플러그인** (UI Flow Diagram) — 2샌드박스 아키텍처:
  - **Core 샌드박스:** `src/code.ts` (4,993줄 모놀리스) + `src/customConnector.ts` (지오메트리 엔진)
  - **UI 샌드박스:** `src/ui/` (React 18, `src/ui.html`이 Figma UI 산출물)
- **통신:** `postMessage` / `figma.ui.postMessage` **전용**. Figma API는 Core 전용.
- **프로토콜 단일 소스:** `src/types.ts` — `PluginAction` (UI→Core, 29종) / `CoreToUIMessage` (Core→UI, 6종)
- **빌드 체인:** `build` (core→`dist/code.js`) → `build:ui` (React→`dist/ui-bundle.js`) → `build:inject` (`dist/ui.html` 인라인)

---

## 2. 기존 규칙 가리키기

- **UI/커넥터/리사이즈 작업 전** [`GEMINI.md`](./GEMINI.md) **필수 읽기** — 아이콘·폰트웨이트(450/550)·단자크기·useAutoResize·아코디언·드롭다운 격리 규칙.
- **버그 수정 전** [`BUG_REPORT.md`](./BUG_REPORT.md) + [`VERIFICATION_REPORT.md`](./VERIFICATION_REPORT.md) 참조 (회귀 기준선).

---

## 3. 하드 규칙 (INV-01~10) 요약

> 전문: [`docs/harness-analysis/02-architecture-invariants.md`](./docs/harness-analysis/02-architecture-invariants.md)

| INV        | 규칙 (요약)                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| **INV-01** | 샌드박스 격리 — Figma API는 Core 전용, `src/ui/`에서 `figma.` 사용 금지                              |
| **INV-02** | Core↔UI 통신은 message protocol 전용. `NOTIFY`는 Core `figma.notify` 경유 (UI 토스트 직접 구현 금지) |
| **INV-03** | `PluginAction`은 UI→Core 단일 계약 — union↔Core switch 3자 일치                                      |
| **INV-04** | `CoreToUIMessage`은 Core→UI 단일 계약 — union↔UI 수신 switch 일치                                    |
| **INV-05** | 폼 필드별 단일 상태 소유권 — DOM이 truth, React state는 캐시. 반쪽 수정 금지                         |
| **INV-06** | `customConnector.ts`는 Core 전용 — `src/ui/`에서 import 금지                                         |
| **INV-07** | `src/types.ts`는 프로토콜의 단일 소스 오브 트루스                                                    |
| **INV-08** | `code.ts`(4,992줄) 수정 범위 한정 — 전체 재작성 금지                                                 |
| **INV-09** | 빌드 순서 `build→build:ui→build:inject`와 산출물 `dist/ui.html`                                      |
| **INV-10** | 완료 전 검증 게이트 — `typecheck`+`build:all` 필수, 조건부 `check:*`                                 |

---

## 4. 작업별 라우팅 테이블

> 어떤 작업이면 어떤 파일을 **먼저** 읽을지. (상세: [`04-harness-architecture-design.md`](./docs/harness-analysis/04-harness-architecture-design.md) §4)

| 작업 유형                            | 먼저 읽을 파일                                                                                                                                                                                                    | 추가 실행                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **신규 액션/메시지 타입**            | [`05-action-index.md`](./docs/harness-analysis/05-action-index.md) + [`02`](./docs/harness-analysis/02-architecture-invariants.md) (INV-03/04) + [`.harness/protocol-rules.json`](./.harness/protocol-rules.json) | `npm run check:protocol`                   |
| **폼 필드 / DOM 상태 변경**          | [`06-field-ownership.md`](./docs/harness-analysis/06-field-ownership.md) + [`.harness/allowlists.json`](./.harness/allowlists.json)                                                                               | `npm run check:constraints`                |
| **`code.ts` 수정**                   | [`02`](./docs/harness-analysis/02-architecture-invariants.md) (INV-08) + [`05-action-index.md`](./docs/harness-analysis/05-action-index.md)                                                                       | diff 범위 리뷰(수동)                       |
| **UI 변경(일반)**                    | [`GEMINI.md`](./GEMINI.md) + [`07-verification-gates.md`](./docs/harness-analysis/07-verification-gates.md)                                                                                                       | `build:all` + 수동 체크                    |
| **버그 수정**                        | [`failures/`](./docs/harness-analysis/failures/) + [`BUG_REPORT.md`](./BUG_REPORT.md) + [`VERIFICATION_REPORT.md`](./VERIFICATION_REPORT.md)                                                                      | 해당 항목 회귀 검증                        |
| **커넥터/단자 작업**                 | [`GEMINI.md`](./GEMINI.md) §3/§4/§11                                                                                                                                                                              | 수동 렌더링 확인                           |
| **Figma API 사용(텍스트/변수/저장)** | [`03-agent-failure-risks.md`](./docs/harness-analysis/03-agent-failure-risks.md) (R-14~17) + [`figma-plugin-guide/api/`](./figma-plugin-guide/api/) 공식 문서                                                     | `typecheck` + 수동 Figma 확인              |
| **모든 작업 완료 전**                | [`07-verification-gates.md`](./docs/harness-analysis/07-verification-gates.md)                                                                                                                                    | `typecheck`+`build:all`+(조건부) `check:*` |

---

## 5. 금지 사항

- ❌ `code.ts` / `AppContext.tsx` / `ConnectSection.tsx` **전체 재작성 금지** (INV-08, R-10)
- ❌ `dist/` · `src/ui.html` **수동 편집 금지** — 빌드 산출물, `build:all`로만 재생성 (INV-09)
- ❌ **신규 하드코딩 DOM ID 금지** — `getElementById('X')`의 X는 [`.harness/allowlists.json`](./.harness/allowlists.json) `dom_id_registry`에 등록 필수 (R-02)
- ❌ **신규 `dispatchEvent` 금지** — 허용 시 `dispatch_event_sites` + 페어링 핸들러 등록 (R-05)
- ❌ **`window.X =` 가변 상태 금지** — `window._titleDebounce` 같은 전역 해킹 금지 (R-04)
- ❌ **DOM 클래스 기반 상태 판독 금지** — `querySelector`로 상태 읽기 금지 (R-03)
- ❌ **`src/ui/`에서 `figma.` 사용 / `customConnector` import 금지** (INV-01/06)
- ❌ **범위 외 파일 수정 금지** — README, 구형 아티팩트, `package-lock.json` 등 (R-12, [`.harness/structure-rules.json`](./.harness/structure-rules.json) `do_not_edit`)
- ❌ **금지 파일 패턴 생성 금지** — `temp_*`, `*_new.*`, `*_old.*`, `*_backup.*`, `*.bak`
- ❌ **폰트 미로드 상태에서 `TextNode` 폰트 의존 속성 변경 금지** — `await figma.loadFontAsync(...)` 필수 (R-14)
- ❌ **미등록 `clientStorage` 키 사용 금지** — [`.harness/allowlists.json`](./.harness/allowlists.json) `client_storage_keys`에 등록 필수 (R-15)
- ❌ **`figma.variables` feature detection 없이 호출 금지** — `'variables' in figma` guard 필수 (R-16)
- ❌ **`node.remove()` 후 해당 노드 참조 접근 금지** — 제거 전 값 캡처 (R-17)

---

## 6. 완료 게이트 (INV-10)

> 상세: [`07-verification-gates.md`](./docs/harness-analysis/07-verification-gates.md)

- **필수:** `npm run typecheck` + `npm run build:all`
- **프로토콜 변경 시:** `npm run check:protocol` 추가
- **UI/DOM 변경 시:** `npm run check:constraints` 추가
- **수동 체크리스트 수행** (Figma 데스크톱 — M1~M8)
- **실행한 명령 + 결과 보고 의무** — 게이트 미통과 시 "완료" 선언 금지 (R-13)
- **일괄 실행:** `npm run verify`

> ⚠️ **현재 상태:** `check:protocol`이 **KNOWN 10건**으로 FAIL — [`failures/0001`](./docs/harness-analysis/failures/0001-protocol-union-switch-drift.md).
> 이는 "기존 코드의 예상된 위반"이며, `NEW 위반 0`인 한 Harness는 정상 작동한다.

---

## 7. Failure Memory

- **알려진 위반:** [`docs/harness-analysis/failures/0001-protocol-union-switch-drift.md`](./docs/harness-analysis/failures/0001-protocol-union-switch-drift.md) — INV-03/04 위반 (union↔switch 불일치 10건), `check:protocol`이 KNOWN으로 감지.
- **신규 버그 기록 규칙:** 재발하지 말아야 할 실패를 `failures/NNNN-<slug>.md`로 기록하고, 회귀 체크 스크립트(`check-protocol.mjs` 등)를 링크한다.

---

## 8. Harness 파일 인덱스

| 파일                                                                                                 | 역할                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`.harness/structure-rules.json`](./.harness/structure-rules.json)                                   | 금지 파일 패턴 / 무시 디렉터리 / 보호 파일 / 편집 금지 — `check-constraints.mjs`가 소비                        |
| [`.harness/protocol-rules.json`](./.harness/protocol-rules.json)                                     | 프로토콜 계약 레지스트리 (union/switch/수신 위치, known 위반, no-op, round_trip) — `check-protocol.mjs`가 소비 |
| [`.harness/allowlists.json`](./.harness/allowlists.json)                                             | DOM ID 레지스트리 / DOM 접근 파일 / dispatchEvent / postMessage 사이트 — `check-constraints.mjs`가 소비        |
| [`scripts/check-protocol.mjs`](./scripts/check-protocol.mjs)                                         | **G3 게이트** — union↔switch↔수신 3자 일치 (R-08/09, INV-03/04)                                                |
| [`scripts/check-constraints.mjs`](./scripts/check-constraints.mjs)                                   | **G2 게이트** — 격리·DOM allowlist·dispatchEvent·window (R-02~05, INV-01/02/06)                                |
| [`docs/harness-analysis/05-action-index.md`](./docs/harness-analysis/05-action-index.md)             | 액션별 발신 위치 인덱스 (R-06/R-11)                                                                            |
| [`docs/harness-analysis/06-field-ownership.md`](./docs/harness-analysis/06-field-ownership.md)       | 폼 필드 상태 소유권 맵 (R-01/INV-05)                                                                           |
| [`docs/harness-analysis/07-verification-gates.md`](./docs/harness-analysis/07-verification-gates.md) | 완료 게이트 + 수동 체크리스트 (INV-10/R-13)                                                                    |
