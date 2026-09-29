# Harness Engineering 도입 분석 — Agent Failure Risks

> **작성일**: 2026-09-28
> **범위**: `/Users/170h/Developer/Figma/ui-flow-diagram` (분석만 수행, 파일 수정 없음)
> **목적**: Harness 도입 시 Agent가 실제로 범할 수 있는 실패 모드 13개 정의 (R-01~R-13)
> **전제**: 1차 분석([`01-current-architecture-analysis.md`](01-current-architecture-analysis.md))의 Baseline + 실제 코드 재확인 기반
> **참고**: [`02-architecture-invariants.md`](02-architecture-invariants.md) (해당 리스크를 제약으로 전환한 Invariant)

---

## 개요

본 문서는 현재 코드베이스에서 **실제로 확인된** 구조적 취약점 13개를 Agent Failure Risks로 정의한다. 각 Risk는:

- **Risk** — 어떤 실패가 발생하는지
- **실제 근거** — 코드 위치 (파일:라인)
- **Agent가 할 수 있는 실수** — 구체적 실패 시나리오
- **Harness 제약** — Harness에서 걸어야 할 규칙/게이트

> ⚠️ R-04(`window.*` mutable state)는 **현재 코드에서 위반이 확인되지 않은** 항목이다. 추측하지 않기 위해 "확인되지 않음"으로 명시하고, 사전 차단 제약만 제안한다.
> ⚠️ R-08 / R-09는 **현재 코드에서 실제 불일치가 존재**하는 항목이다.

---

1차 분석 결과를 기반으로 **Harness에 들어갈 Agent Failure Risks와 Architecture Invariants만 분석하라.**

파일을 수정하거나 생성하지 마라.
소스 코드를 수정하지 마라.
BUG_REPORT의 버그를 수정하지 마라.
C-01을 다시 작업하거나 검증하지 마라.

1차 분석 결과를 기반으로 Harness에 들어갈 Agent Failure Risks와 Architecture Invariants를 분석했습니다. 파일 수정 없이 실제 코드 확인(파일 읽기, regex 검색, wc -l)에 기반합니다.

# Agent Failure Risks

## R-01. React state와 DOM state 중복

- **Risk**: 같은 폼 값이 React state(`uiState`/`lastNodeConfig`)와 DOM(`input.value`, `checkbox.checked`)에 동시에 존재하며, 어느 쪽이 source of truth인지 불분명.
- **실제 근거**:
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:52) — `SELECTION_CHANGED` 수신 시 `document.getElementById('node-title-input')` 등 10여 개 DOM 요소를 직접 쓰면서, 동시에 `setLastNodeConfig()`/`setUIState()` 호출 (L52-154).
  - [`AppContext.tsx`](src/ui/context/AppContext.tsx:505) — `applyCurrentNodeState`가 payload를 조립할 때 DOM 값(`titleEl.value`, `descToggleEl.checked`, `wEl.value`)을 1차 소스로 읽고, DOM이 없으면 `lastNodeConfigRef`로 폴백 (L505-557).
  - [`AppContext.tsx`](src/ui/context/AppContext.tsx:516) — `document.querySelector('#node-type-icons .type-icon-btn.active')`의 `dataset.type`을 노드 타입 판정 소스로 사용 (L516-518, L869).
  - [`AppContext.tsx`](src/ui/context/AppContext.tsx:947) — `statusToggleEl?.checked`(DOM)가 `true`일 때만 `SET_STATUS` 전송. DOM 상태가 프로토콜 전송의 게이트.
- **Agent가 할 수 있는 실수**: React state만 갱신하고 DOM을 놓치거나(또는 그 반대), "state가 있으니 DOM 읽기 제거"로 리팩토링했다가 `applyCurrentNodeState`가 빈 payload를 보내는 회귀 발생. `isDifferentNode` 가드(L59)를 무시하고 무조건 덮어쓰는 로직 추가 시 사용자 입력 소실.
- **Harness 제약**: 폼 필드별 "단일 소유권" 맵을 강제하고, DOM 직접 접근(`getElementById`/`querySelector`)이 허용되는 위치를 allowlist로 제한. 신규 코드는 기존 `ref`+DOM 패턴을 복제하지 못하도록 lint 규칙.

## R-02. `document.getElementById` 남용

- **Risk**: ID 문자열이 10개 파일에 하드코딩되어, ID 변경 시 컴파일 에러 없이 런타임에만 실패.
- **실제 근거**: 검색 결과 **79개 매치**. 주요 위치: [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:52), [`AppContext.tsx`](src/ui/context/AppContext.tsx:748) (L748-755, L819-828, L856-876), [`ConnectSection.tsx`](src/ui/components/connection/ConnectSection.tsx:197) (L197-618, L897-1299), [`TypeSection.tsx`](src/ui/components/node/TypeSection.tsx:113), [`SizeSection.tsx`](src/ui/components/appearance/SizeSection.tsx:123), [`FigmaDesignPickerModal.tsx`](src/ui/components/modals/FigmaDesignPickerModal.tsx:56), [`DescriptionSection.tsx`](src/ui/components/node/DescriptionSection.tsx:86), [`ConnectionPanel.tsx`](src/ui/components/connection/ConnectionPanel.tsx:20), [`StepBadgesSection.tsx`](src/ui/components/appearance/StepBadgesSection.tsx:295), [`App.tsx`](src/ui/App.tsx:198), [`useAutoResize.ts`](src/ui/hooks/useAutoResize.ts:70).
- **Agent가 할 수 있는 실수**: `input-size-w` 같은 ID를 "더 의미 있는 이름"으로 리네임하면 5개 이상의 읽기/쓰기 위치 중 일부만 수정되어 값이 `250`/`90` 디폴트로 침묵 폴백. `as HTMLInputElement | null` 캐스트 때문에 타입 체크도 못 잡음.
- **Harness 제약**: ID 문자열 리터럴을 중앙 상수 모듈로 강제(신규 하드코딩 차단), 또는 `getElementById` 호출 수를 회귀 게이트로 모니터링.

## R-03. `querySelector` 기반 상태 판독

- **Risk**: CSS 셀렉터 + 클래스(`.active`)로 UI 상태를 판정하는 비선형 경로.
- **실제 근거**:
  - [`AppContext.tsx`](src/ui/context/AppContext.tsx:516) — `#node-type-icons .type-icon-btn.active`의 `dataset.type`을 노드 타입 소스로 사용 (L516-518, L869).
  - [`ConnectSection.tsx`](src/ui/components/connection/ConnectSection.tsx:489) — `.line-style-btn`의 `classList`/`onclick` 속성으로 라인 스타일 판정 (L489-492), `.anchor-handle[data-node]`의 `.active` 토글 (L507-508).
  - [`useAutoResize.ts`](src/ui/hooks/useAutoResize.ts:7) — `.tab-panel[style*="display: block"]` 인라인 스타일 문자열 매칭으로 활성 탭 판정 (L7-14).
- **Agent가 할 수 있는 실수**: `active` 클래스를 `data-active` 속성으로 바꾸거나, 인라인 `style`을 CSS 클래스로 바꾸는 리팩토링 시 `useAutoResize`의 높이 계산과 타입 판정이 침묵 실패. `onclick` 속성 문자열 파싱(L492)은 특히 취약.
- **Harness 제약**: "DOM 클래스/인라인 스타일을 상태 소스로 읽는" 패턴을 신규 코드에 금지. `useAutoResize`의 판정 로직 변경 시 반드시 `RESIZE_WINDOW` 흐름을 수동 검증.

## R-04. `window.*` mutable state

- **Risk**: 전역 mutable 상태에 의한 샌드박스 간/컴포넌트 간 암묵적 결합.
- **실제 근거**: **확인되지 않음.** `window.` 사용은 `setTimeout`/`addEventListener`/`removeEventListener`/`location.search`/`innerHeight`/`innerWidth`/`ResizeObserver`로 한정 ([`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:180), [`ColorWheelField.tsx`](src/ui/components/shared/ColorWheelField.tsx:299), [`SizeModal.tsx`](src/ui/components/modals/SizeModal.tsx:91)). `window.x = ...` 형태의 전역 상태 할당은 검색 결과 0건.
- **Agent가 할 수 있는 실수**: (현재 근거 없음 — 추측 생략) 다만 `window` 전역에 상태 저장하는 신규 코드가 들어오면 이 불변이 깨지므로, "window에 상태 할당 금지"를 사전 제약으로 두는 것만 권장.
- **Harness 제약**: `window.<identifier> =` 패턴을 lint 금지 규칙으로 사전 차단(현행 위반 없음).

## R-05. `dispatchEvent`

- **Risk**: DOM 이벤트로 React/핸들러를 우회 트리거하는 암묵적 결합.
- **실제 근거**: [`SizeSection.tsx`](src/ui/components/appearance/SizeSection.tsx:279) — `hiddenInput.value = mode; hiddenInput.dispatchEvent(new Event('change'))` (L276-280). `select-size-mode` 히든 인풋의 `change` 핸들러가 실제 로직을 소유.
- **Agent가 할 수 있는 실수**: `change` 핸들러를 리팩토링/이동하면 `setSizeMode` 경로만 침묵 실패. `dispatchEvent`가 유일한 트리거인 줄 모르고 핸들러를 "불필요한 코드"로 삭제.
- **Harness 제약**: `dispatchEvent` 호출 위치를 allowlist로 고정하고, 해당 인풋의 `onChange` 핸들러와 함께 수정하도록 페어링 규칙.

## R-06. 동일 상태에 대한 여러 mutation path

- **Risk**: 같은 값/동작을 갱신하는 경로가 2개 이상이라, 한 경로만 수정하면 경로 간 불일치.
- **실제 근거**:
  - `input-size-w/h/radius` 값: 최소 5개 쓰기 경로 — [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:93) (L93-95, L136-138), [`AppContext.tsx`](src/ui/context/AppContext.tsx:614) (L614-619, L634-637, L1032-1033), [`SizeSection.tsx`](src/ui/components/appearance/SizeSection.tsx:227) (L227-230), [`FigmaDesignPickerModal.tsx`](src/ui/components/modals/FigmaDesignPickerModal.tsx:56) (L56-58).
  - `SET_PHASE` 전송: [`PhaseSection.tsx`](src/ui/components/node/PhaseSection.tsx:74)와 [`App.tsx`](src/ui/App.tsx:239) (L239, L263) 두 곳에서 각각 `parent.postMessage`.
  - `RESIZE_WINDOW` 전송: [`useAutoResize.ts`](src/ui/hooks/useAutoResize.ts:76)와 [`AppContext.tsx`](src/ui/context/AppContext.tsx:452) (L442-457) — **동일한 auto-resize 로직이 두 구현으로 중복 존재** (두 곳 다 `getPluginIdealHeight` + 35ms debounce + `lastResizeHeightRef` 유사 패턴).
  - `SET_STATUS` 전송: [`AppContext.tsx`](src/ui/context/AppContext.tsx:698) (L698)와 [`AppContext.tsx`](src/ui/context/AppContext.tsx:948) (L948, DOM `checked` 게이트).
- **Agent가 할 수 있는 실수**: "auto-resize는 useAutoResize 훅이 담당"이라 판단하고 `AppContext.autoResizeWindow`만 수정(또는 그 반대) → 한쪽 debounce/threshold만 변경되어 창 높이 진동. `SET_PHASE` 중 한 경로만 payload 필드 추가 → 탭별 동작 차이.
- **Harness 제약**: 액션별 "단일 전송 함수" 매핑표(어떤 액션은 어떤 함수에서만 전송)를 문서화하고, 동일 액션의 `parent.postMessage` 호출 지점 수를 정적 체크로 회귀 모니터링.

## R-07. Core/UI protocol 우회

- **Risk**: 정의된 message protocol을 거치지 않는(또는 이름과 실제 동작이 다른) 통신 경로.
- **실제 근거**:
  - [`AppContext.tsx`](src/ui/context/AppContext.tsx:436) — `showToast`가 `NOTIFY`를 Core로 보내고, Core의 [`notify()`](src/code.ts:525)가 `figma.notify`로 재전송. 즉 UI 토스트는 **Figma 네이티브 노티**로 렌더링되는 왕복 구조.
  - [`code.ts`](src/code.ts:4782) — `UNDO`/`REDO` 액션은 실제 undo/redo를 수행하지 않고 "키보드 단축키를 쓰세요"라는 `notify`만 전송 (L4782-4787). 액션 이름과 실제 동작 불일치.
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:24) — 수신측 `event.data?.pluginMessage`는 타입 미강제, `event.origin` 검증 없음.
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:183) — `?nodes=2` 개발 모드 파라미터로 `INIT` 핸드셰이크를 건너뜀 (L183-188).
- **Agent가 할 수 있는 실수**: `UNDO` case에 실제 `figma.undo()`를 "보완"하는 것(플러그인 API에 undo가 없어 컴파일은 되지만 동작 의도와 다름), `NOTIFY` 왕복을 모르고 UI에 토스트 컴포넌트를 직접 구현해 이중 알림, `origin` 없는 수신 핸들러에 신규 메시지 타입을 추가하며 타입 안전성 없이 확장.
- **Harness 제약**: "UI→Core→UI 왕복" 구조(`NOTIFY`)를 인지한 수정만 허용, `UNDO`/`REDO`는 no-op 계약으로 문서화, 수신측에 타입 가드 추가를 강제.

## R-08. PluginAction과 실제 switch 처리 불일치

- **Risk**: union에 선언된 액션이 Core switch에서 처리되지 않아 침묵 무시.
- **실제 근거**:
  - [`types.ts`](src/types.ts:287) — `CREATE_CONNECTORS` (L287), [`types.ts`](src/types.ts:296) — `CREATE_TEMPLATE` (L296)는 union에 존재.
  - [`code.ts`](src/code.ts:4710) — switch (L4710-4802)에 두 액션 모두 **없음**, `default` case도 없음.
- **Agent가 할 수 있는 실수**: "union에 있으니 동작한다"고 가정하고 UI에서 `CREATE_CONNECTORS`를 전송하는 코드를 추가(실제로는 아무 일도 안 일어남), 또는 switch에 case를 추가할 때 payload 필드(`label`, `lineStyle`)를 union과 다르게 해석.
- **Harness 제약**: union ↔ switch 3자 일치성 정적 검증 스크립트(1차 분석 G3 게이트)를 필수 게이트로, `default` case 부재를 신규 액션 추가 시 체크 항목으로.

## R-09. CoreToUIMessage와 실제 수신 처리 불일치

- **Risk**: 역방향으로도 union과 수신 switch가 불일치 — union에 없는 타입을 처리하고, union에 있는 타입을 무시.
- **실제 근거**:
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:158) — `INIT_DONE`, `READY` (L158-162), `SWITCH_TAB` (L169-172)를 처리하는데, 이 3종은 [`CoreToUIMessage`](src/types.ts:379) union (L379-415)에 **없음**.
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:174) — `default: break` (L174-175)로 `STATUS_LIST_UPDATED`, `UI3_VARIABLES_EXTRACTED`, `SETTINGS_LOADED`, `TOAST`를 **무시**.
  - Core는 실제로 `STATUS_LIST_UPDATED` ([`code.ts`](src/code.ts:3878)), `SETTINGS_LOADED` ([`code.ts`](src/code.ts:4568)), `UI3_VARIABLES_EXTRACTED` ([`code.ts`](src/code.ts:4693)), `DESIGN_FRAMES_LOADED` ([`code.ts`](src/code.ts:4764))를 `postToUI`로 전송. `TOAST`는 union에 있으나 **전송하는 곳이 없음** — Core는 `figma.notify` 사용 ([`code.ts`](src/code.ts:525)).
- **Agent가 할 수 있는 실수**: `SETTINGS_LOADED` 수신 case를 "union에 있으니 이미 처리 중"이라 가정(실제로는 `default`로 버려짐), `TOAST` case를 추가해 UI 토스트를 구현하지만 Core가 보내지 않아 죽은 코드가 됨, `SWITCH_TAB`을 union에 "추가"하면서 Core에서 보내는 코드가 없어 또 다른 죽은 분기 생성.
- **Harness 제약**: `CoreToUIMessage` union ↔ `useFigmaMessage.ts` switch 일치성 검증 + "전송되는 메시지"와 "수신되는 메시지"를 별도 목록으로 대조하는 게이트.

## R-10. 대형 파일 수정 위험

- **Risk**: 단일 파일에 로직이 집중되어, 국부 수정이 파일 전체를 재분석/재작성하게 만듦.
- **실제 근거** (`wc -l` 확인):
  - [`src/code.ts`](src/code.ts:1) — **4,992줄**. 메시지 라우터가 파일 말미 ([`code.ts`](src/code.ts:4709)), `documentchange` 핸들러 L4807-4986, 초기화 L4988-4992.
  - [`src/ui/styles.css`](src/ui/styles.css:1) — **4,369줄**.
  - [`src/ui/components/connection/ConnectSection.tsx`](src/ui/components/connection/ConnectSection.tsx:1) — **1,396줄** (DOM 접근 40여 곳 포함).
  - [`src/customConnector.ts`](src/customConnector.ts:1) — **1,418줄**.
  - [`src/ui/context/AppContext.tsx`](src/ui/context/AppContext.tsx:1) — **1,194줄** (전역 상태 + 모든 메시지 전송 함수 + DOM 조작).
- **Agent가 할 수 있는 실수**: `code.ts`의 한 함수 수정을 위해 5,000줄을 컨텍스트에 올리고, 요약/재작성 과정에서 `documentchange` 핸들러(L4807-4986)의 5개 서브로직(커넥터 추적, 기즈모 차단, 텍스트 스타일 보정, status 뱃지 잠금, 커넥터 설정 동기화) 중 하나를 누락. `AppContext.tsx`의 `useCallback` 의존성 배열을 "정리"하다 스탈린 클로저 발생.
- **Harness 제약**: `code.ts`/`AppContext.tsx` 수정 시 diff 범위 제한(변경 라인 수 상한), "파일 전체 재작성" 금지, 함수 단위 anchor 기반 수정만 허용.

## R-11. 불필요한 전체 프로젝트 재분석

- **Risk**: 액션 1개 추가에 3개 파일(`types.ts` union + `code.ts` switch + `useFigmaMessage.ts` 수신) 동시 수정이 필요하고, `AppContext.tsx`가 모든 전송 함수를 포함하므로, 변경 영향도를 파악하려면 사실상 전체 UI 트리 분석 필요.
- **실제 근거**:
  - [`types.ts`](src/types.ts:280) — `PluginAction` union (L280-327, 약 30종).
  - [`code.ts`](src/code.ts:4709) — switch 라우터 (L4710-4802).
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:27) — 수신 switch (L27-176).
  - [`AppContext.tsx`](src/ui/context/AppContext.tsx:574) — `UPDATE_FLOW_NODE` (L574-595), `SET_STATUS` (L698, L948), `SET_ELEVATION`/`ADD_STEP_BADGES` 등 (L709-735), `UPDATE_CONNECTOR_PROPERTIES` (L780-782, L840-841), `CREATE_FLOW_NODE` (L931-953) — **전송 함수가 10개 이상 한 파일에 집중**.
- **Agent가 할 수 있는 실수**: "이 액션은 어디에서 보내지?"를 찾기 위해 모든 컴포넌트를 순차 탐색(시간/토큰 낭비), 또는 `App.tsx` L239의 `SET_PHASE`를 모르고 `PhaseSection.tsx`만 수정.
- **Harness 제약**: 액션별 "발신 위치 인덱스" 문서(어떤 액션은 어떤 파일/함수에서 전송)를 harness에 포함시켜 탐색 비용 제거.

## R-12. 작업 범위를 벗어난 파일 수정

- **Risk**: 구형 문서/아티팩트가 혼재되어, "정리" 명목으로 범위 외 파일 수정 유도.
- **실제 근거**:
  - 1차 분석 문서([`01-current-architecture-analysis.md`](docs/harness-analysis/01-current-architecture-analysis.md:123))에 따르면 `README.md`는 `src/ui.html` 기반 **구 구조 설명이 남아 있음**.
  - 워크스페이스에 [`src/ui.html`](src/ui.html:1)이 존재(현재 빌드 파이프라인은 [`scripts/build-ui.mjs`](scripts/build-ui.mjs:19)가 `dist/ui.html`을 생성 — `src/ui.html`은 빌드 산출물이 아님).
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:183) — `?nodes=2` 개발 테스트용 죽은 분기 (L184-186, 본문이 빈 블록).
- **Agent가 할 수 있는 실수**: 버그 수정 작업 중 "README가 실제 코드와 다르면 정리"하여 `README.md`/`src/ui.html`을 수정(작업 범위 이탈), 죽은 분기 삭제가 `INIT` 핸드셰이크에 영향을 줄 수 있음을 모르고 삭제.
- **Harness 제약**: 작업별 허용 파일 목록(allowlist)을 harness에 명시, 문서/구형 아티팩트 수정은 별도 작업으로 분리.

## R-13. 검증 없이 작업 완료 처리

- **Risk**: 검증 수단이 typecheck/build뿐이고, 프로토콜 불일치는 typecheck가 잡지 못함.
- **실제 근거**:
  - [`package.json`](package.json:6) — 스크립트: `build`(core만), `build:ui`, `build:inject`, `build:all`, `typecheck`(`tsc --noEmit`). devDependencies에 **테스트 프레임워크/linter 없음** (L17-24).
  - [`useFigmaMessage.ts`](src/ui/hooks/useFigmaMessage.ts:24) — `event.data?.pluginMessage`가 `any` 접근이라, R-08/R-09의 양방향 불일치가 **typecheck를 통과** (실제로 현재 불일치가 존재하는 것이 증거).
  - [`package.json`](package.json:7) — `npm run build`는 **core만** 빌드. UI 변경 후 `build:ui`/`build:inject`를 실행하지 않으면 `dist/ui.html`이 구버전으로 남음.
- **Agent가 할 수 있는 실수**: UI 수정 후 `npm run build`만 실행하고 "빌드 성공"으로 완료 처리(실제로는 UI 번들이 재생성 안 됨), typecheck 통과를 "프로토콜 일치"로 오인, `build:inject` 순서를 무시하고 `dist/ui.html`을 수동 편집.
- **Harness 제약**: 완료 게이트를 `npm run typecheck` + `npm run build:all`로 고정, "빌드 성공"의 정의를 `build:all` 전체 성공으로 명시, 프로토콜 일치성 정적 체크(R-08/R-09 대응)를 게이트에 추가.

---

## R-14. 폰트 미로드 상태에서 텍스트 노드 변경 (Figma 공식 규칙)

- **Risk**: `TextNode.characters` / `fontSize` / `fontFamily` 등 폰트 의존 속성을 `figma.loadFontAsync` 없이 변경하면 런타임 에러(`Error: Missing font ... (not loaded)`) 발생.
- **실제 근거**:
  - [`src/code.ts`](src/code.ts:1) — `figma.loadFontAsync`를 광범위하게 사용(텍스트 생성/변경 전 로딩 패턴).
  - [`src/customConnector.ts`](src/customConnector.ts:812) — 커넥터 라벨 텍스트 생성 시 `loadFontAsync` 후 `createText`.
  - 공식 문서: [`figma-plugin-guide/api/typings-and-errors.md`](figma-plugin-guide/api/typings-and-errors.md:93) — `Error: Missing font ... (not loaded)` 항목, [`figma-plugin-guide/api/nodes/TextNode.md`](figma-plugin-guide/api/nodes/TextNode.md:37) — 폰트 속성 변경 전 로딩 필수.
- **Agent가 할 수 있는 실수**: `characters`/`fontSize`/`fontFamily`/`fontStyle`을 직접 대입하는 코드를 추가할 때 `await figma.loadFontAsync(...)`를 생략, `setRange*` 메서드도 폰트 로딩이 필요함을 모르고 호출.
- **Harness 제약**: Core에서 `TextNode`의 폰트 의존 속성(`characters`, `fontSize`, `fontFamily`, `fontStyle`, `letterSpacing`, `lineHeight`, `textCase`, `textDecoration`)을 읽기/쓰기하기 전 반드시 `await figma.loadFontAsync({ family, style })`을 수행. `figma.loadFontAsync`는 **Core 전용** (INV-01).

## R-15. `clientStorage` 키 무분별 사용 (Figma 공식 규칙)

- **Risk**: `figma.clientStorage`는 플러그인당 영속 저장소(1MB 제한)로, 키가 충돌하거나 미등록 키가 생기면 데이터 오염/상호 덮어쓰기 발생.
- **실제 근거**:
  - [`src/code.ts`](src/code.ts:4565) — `figma.clientStorage`로 `figma_token`, `figma_file_url` 저장/읽기.
  - 공식 문서: [`figma-plugin-guide/api/figma-clientStorage.md`](figma-plugin-guide/api/figma-clientStorage.md:14) — `setAsync`/`getAsync`/`deleteAsync`/`keysAsync` API.
- **Agent가 할 수 있는 실수**: 신규 기능을 위해 임의의 키(`"settings"`, `"state"` 등)로 `setAsync`를 추가해 기존 `figma_token`/`figma_file_url`과 충돌, 키 명명 규칙 없이 키를 proliferation 시킴.
- **Harness 제약**: `figma.clientStorage` 사용 키는 [`.harness/allowlists.json`](.harness/allowlists.json) `client_storage_keys`에 등록 필수. 신규 키 추가 시 allowlist 등록 + Core 전용 사용 (INV-01).

## R-16. `figma.variables` API 미검증 호출 (Figma 공식 규칙)

- **Risk**: `figma.variables`는 Figma 버전/권한에 따라 존재하지 않을 수 있음. feature detection 없이 호출하면 `TypeError: Cannot read properties of undefined` 발생.
- **실제 근거**:
  - [`src/code.ts`](src/code.ts:4585) — `'variables' in figma` feature detection 후 `figma.variables` 사용 (정확한 패턴).
  - 공식 문서: [`figma-plugin-guide/api/figma-variables.md`](figma-plugin-guide/api/figma-variables.md:11) — VariablesAPI 개요.
- **Agent가 할 수 있는 실수**: `figma.variables.getLocalVariables()`를 feature detection 없이 직접 호출, `figma.variables`가 `undefined`인 환경에서 크래시.
- **Harness 제약**: `figma.variables` 접근 전 반드시 `'variables' in figma` 또는 `figma.variables !== undefined` guard 필수. Core 전용 (INV-01).

## R-17. 제거된 노드 접근 (Figma 공식 규칙)

- **Risk**: `node.remove()` 호출 후 해당 노드(또는 부모)에 접근하면 `Error: Cannot read property of removed node` 발생.
- **실제 근거**:
  - [`src/code.ts`](src/code.ts:1) — `.remove()` 광범위 사용(노드 삭제/교체 로직).
  - [`src/customConnector.ts`](src/customConnector.ts:945) — 커넥터 노드 제거.
  - 공식 문서: [`figma-plugin-guide/api/typings-and-errors.md`](figma-plugin-guide/api/typings-and-errors.md:83) — `Error: Cannot read property of removed node` 항목.
- **Agent가 할 수 있는 실수**: `node.remove()` 후 `node.parent`/`node.children`/`node.x` 접근, `remove()`된 노드를 배열에 담아 나중에 반복 접근.
- **Harness 제약**: `node.remove()` 호출 시점부터 해당 노드 참조를 즉시 무효화. 제거 후 접근이 필요한 값은 `remove()` **전**에 캡처.

---
