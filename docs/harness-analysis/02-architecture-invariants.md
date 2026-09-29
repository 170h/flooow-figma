# Harness Engineering 도입 분석 — Architecture Invariants

> **작성일**: 2026-09-28
> **범위**: `/Users/170h/Developer/Figma/ui-flow-diagram` (분석만 수행, 파일 수정 없음)
> **목적**: Harness 도입 시 Agent가 반드시 지켜야 할 Architecture Invariants 10개 정의
> **전제**: R-01~R-13 Agent Failure Risks 분석 완료 (본 문서의 Invariant는 해당 리스크를 제약으로 전환)
> **참고**: [`01-current-architecture-analysis.md`](01-current-architecture-analysis.md) (Baseline)

---

## 개요

본 문서는 현재 코드베이스에서 **실제로 확인된** 구조적 전제 10개를 Architecture Invariants로 정의한다. 각 Invariant는:

- **Rule** — Agent가 지켜야 할 규칙
- **Why** — 그 규칙이 존재하는 이유 (파괴 시 결과)
- **Evidence** — 실제 코드 근거 (파일:라인)
- **Agent Constraint** — Agent가 구체적으로 금지/필수로 해야 할 것
- **Verification** — 위반을 감지하는 방법

> ⚠️ INV-03 / INV-04는 **현재 코드에서 실제 위반이 존재**하는 Invariant이다. Harness 도입 시 정적 일치성 체크 게이트의 1순위 대상.

---

## INV-01 — 샌드박스 격리 (Figma API는 Core 전용)

- **Rule**: Figma API(`figma.*`)와 Figma 타입(`SceneNode`, `StrokeCap` 등)은 Core 샌드박스(`src/code.ts`, `src/customConnector.ts`)에서만 접근한다. `src/ui/` 하위는 Figma 타입을 import·참조하지 않는다.
- **Why**: UI는 순수 웹 iframe으로 Figma API가 존재하지 않으며, `customConnector.ts`는 Figma 타입 의존으로 UI에서 import 자체가 불가. 이 격리가 깨지면 플러그인 로드 실패 또는 런타임 에러.
- **Evidence**:
  - `grep "figma\." src/ui/` → **0건**
  - `grep "customConnector" src/ui/` → **0건**
  - [`src/code.ts`](../../src/code.ts:520) — `figma.ui.postMessage`
  - [`manifest.json`](../../manifest.json:1) — `main: dist/code.js` / `ui: dist/ui.html` 분리
- **Agent Constraint**: `src/ui/` 신규·수정 코드에 `figma.` 참조 또는 `@figma/plugin-typings` import 금지. 캔버스 상태가 필요하면 반드시 `PluginAction` 전송 → `CoreToUIMessage` 수신 경로를 사용.
- **Verification**: `grep -rn "figma\." src/ui/` 0건 + `npm run typecheck` 통과.

---

## INV-02 — Core↔UI 통신은 message protocol 전용

- **Rule**: Core↔UI 간 모든 통신은 `postMessage`/`figma.ui.postMessage`를 통한 정의된 protocol만 사용한다. 전역 객체·DOM·`window`를 매개체로 하는 암묵적 통신을 만들지 않는다.
- **Why**: 두 샌드박스는 `postMessage`가 유일한 통로이며, 현재 `parent.postMessage`(`src/ui/` 20곳)와 `figma.ui.postMessage`([`src/code.ts`](../../src/code.ts:521))가 유일한 경계.
- **Evidence**:
  - [`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:180) — `window.addEventListener('message')`
  - [`src/code.ts`](../../src/code.ts:4709) — `figma.ui.onmessage`
  - `grep "parent.postMessage" src/ui/` → **20건**
- **Agent Constraint**: 샌드박스 경계에 새 채널(`window` 전역, `localStorage` 공유, URL 파라미터) 추가 금지. `?nodes=2` 같은 개발용 우회 분기([`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:184))는 신규로 만들지 않는다.
- **Verification**: `parent.postMessage`/`figma.ui.postMessage` 호출 지점 목록을 작업 전후로 대조 + typecheck.

---

## INV-03 — `PluginAction`은 UI→Core 단일 계약

- **Rule**: union에 선언된 모든 액션은 `code.ts` switch에서 처리되어야 하며, union에 없는 액션을 전송하지 않는다.
- **Why**: `CREATE_CONNECTORS`/`CREATE_TEMPLATE`이 union에는 있으나 switch에 없어 침묵 무시되는 불일치가 **실제로 존재**하고, `default` case도 없어 누락이 컴파일 타임에 잡히지 않음.
- **Evidence**:
  - [`src/types.ts`](../../src/types.ts:287) — `CREATE_CONNECTORS` (union에 존재)
  - [`src/types.ts`](../../src/types.ts:296) — `CREATE_TEMPLATE` (union에 존재)
  - [`src/code.ts`](../../src/code.ts:4710) — switch(L4710-4802)에 해당 case **없음**, `default`도 **없음**
- **Agent Constraint**: 신규 액션 추가 시 ① `types.ts` union, ② `code.ts` switch case, ③ (필요시) 발신 함수를 한 작업에서 함께 수정. 기존 멤버의 payload 스키마 변경 시 switch case의 필드 해석과 함께 수정.
- **Verification**: union 멤버 목록 ↔ switch case 목록 정적 대조 + `npm run typecheck`.

> ⚠️ **현재 위반**: `CREATE_CONNECTORS`, `CREATE_TEMPLATE`은 union에 있으나 switch에 없음.

---

## INV-04 — `CoreToUIMessage`은 Core→UI 단일 계약

- **Rule**: Core가 `postToUI`로 보내는 모든 타입은 union에 선언되어야 하며, UI 수신 switch는 union 멤버를 처리한다.
- **Why**: `INIT_DONE`/`READY`/`SWITCH_TAB`은 union에 없는데 수신 switch에서 처리되고, 반대로 `STATUS_LIST_UPDATED`/`SETTINGS_LOADED`/`UI3_VARIABLES_EXTRACTED`/`TOAST`은 union에 있으나 수신측 `default: break`로 무시되는 **양방향 불일치**가 실제로 존재.
- **Evidence**:
  - [`src/types.ts`](../../src/types.ts:379) — union(L379-418): `SELECTION_CHANGED`, `STATUS_LIST_UPDATED`, `DESIGN_FRAMES_LOADED`, `UI3_VARIABLES_EXTRACTED`, `SETTINGS_LOADED`, `TOAST`
  - [`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:158) — `INIT_DONE`/`READY`(L158-159), `SWITCH_TAB`(L169) 처리 (union에 **없음**)
  - [`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:174) — `default: break`로 `STATUS_LIST_UPDATED`/`SETTINGS_LOADED`/`UI3_VARIABLES_EXTRACTED`/`TOAST` **무시**
  - 실제 전송: [`src/code.ts`](../../src/code.ts:3878) `STATUS_LIST_UPDATED`, [`src/code.ts`](../../src/code.ts:4568) `SETTINGS_LOADED`, [`src/code.ts`](../../src/code.ts:4693) `UI3_VARIABLES_EXTRACTED`
  - `TOAST`는 union에 있으나 Core는 `figma.notify` 사용 ([`src/code.ts`](../../src/code.ts:525)) → **전송하는 곳 없음**
- **Agent Constraint**: 신규 메시지 타입 추가 시 union + 수신 case 동시 수정. "union에 있으니 처리 중"/"수신 switch에 있으니 union에 있음"을 가정하지 말고 양쪽을 직접 대조.
- **Verification**: union 멤버 ↔ 수신 switch case 정적 대조 + `postToUI` 호출 지점의 타입이 union에 포함되는지 확인.

> ⚠️ **현재 위반**: `INIT_DONE`/`READY`/`SWITCH_TAB`은 union에 없는데 수신 switch에서 처리. `TOAST`는 union에 있으나 전송하는 곳 없음.

---

## INV-05 — 폼 필드별 단일 상태 소유권

- **Rule**: 각 폼 필드는 정확히 하나의 상태 소유권을 가진다. 현재는 "DOM이 폼 값의 source of truth, React state(`lastNodeConfig`/`uiState`)는 캐시/파생" 패턴이므로, 이 소유권을 뒤집거나 이중 소유를 만들지 않는다.
- **Why**: `applyCurrentNodeState`가 DOM 값을 1차 소스로 읽고 DOM 부재 시 ref로 폴백하는 구조이며, 5개 이상 파일이 같은 DOM 필드를 읽기/쓰기. 소유권 불분명이 BUG_REPORT 다수 항목의 원인.
- **Evidence**:
  - [`src/ui/context/AppContext.tsx`](../../src/ui/context/AppContext.tsx:522) — DOM 1차, ref 폴백
  - [`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:52) — DOM+state 동시 쓰기
  - [`src/ui/components/appearance/SizeSection.tsx`](../../src/ui/components/appearance/SizeSection.tsx:206) — `triggerApply` DOM 읽기
- **Agent Constraint**: 신규 폼 필드 추가 시 "어느 쪽이 truth인지" 명시하고, 기존 필드의 읽기/쓰기 경로를 모두 찾아 동일 패턴으로 수정. "React state만 갱신"/"DOM만 갱신"의 반쪽 수정 금지.
- **Verification**: 필드별 읽기/쓰기 위치 목록을 작업 전후로 대조 + 해당 필드 관련 수동 시나리오 검증.

---

## INV-06 — `customConnector.ts`는 Core 전용 지오메트리 엔진

- **Rule**: `customConnector.ts`는 코어 측 지오메트리 엔진이며 UI 번들에 포함되지 않는다. `src/ui/`에서 import하지 않는다.
- **Why**: Figma 타입(`SceneNode`, `StrokeCap`)을 사용하므로 UI 번들에 포함되면 런타임 실패. 현재 `src/ui/` 어디에서도 import하지 않는 것이 전제.
- **Evidence**:
  - `grep "customConnector" src/ui/` → **0건**
  - [`src/customConnector.ts`](../../src/customConnector.ts:1) — Figma 타입 의존
  - [`src/code.ts`](../../src/code.ts:4807) — `documentchange`에서 커넥터 레지스트리 사용
- **Agent Constraint**: `src/ui/`에서 `customConnector` import 금지. 커넥터 지오메트리 로직이 UI에 필요하면 Core가 계산해 `CoreToUIMessage`로 전달하는 구조로만 확장.
- **Verification**: `grep -rn "customConnector" src/ui/` 0건 + `npm run build:all` 성공.

---

## INV-07 — `src/types.ts`는 프로토콜의 단일 소스 오브 트루스

- **Rule**: `src/types.ts`는 프로토콜 타입의 단일 소스다. 단, 이 파일에는 런타임 코드(`STATUS_CONFIG`, `NODE_TYPE_SHAPE_SPECS`, `normalizeNodeType`)도 포함되어 두 번들 모두에 중복 번들링되므로, 이 런타임 값의 변경은 양쪽 샌드박스에 동일하게 반영된다는 전제 하에 한 파일에서만 수정한다.
- **Why**: 양쪽이 각자 상수를 정의하면 값 불일치(노드 타입 디폴트 크기 등)가 발생하고, 현재는 `types.ts` 단일 정의가 그 불일치를 방지.
- **Evidence**:
  - [`src/types.ts`](../../src/types.ts:18) — `STATUS_CONFIG`
  - [`src/types.ts`](../../src/types.ts:103) — `normalizeNodeType`
  - [`src/types.ts`](../../src/types.ts:146) — `NODE_TYPE_SHAPE_SPECS`
  - UI 측 사용: [`src/ui/context/AppContext.tsx`](../../src/ui/context/AppContext.tsx:519), [`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:77)
- **Agent Constraint**: `STATUS_CONFIG`/`NODE_TYPE_SHAPE_SPECS` 값 변경 시 "UI와 Core가 같은 값을 보는가" 확인. 이 파일에 프로토콜 외 신규 런타임 로직 추가 금지(계약 파일과 로직 파일 분리 원칙).
- **Verification**: 변경된 상수를 사용하는 UI/Core 양쪽 위치 grep + typecheck + 해당 기능 수동 검증.

---

## INV-08 — `code.ts`(4,992줄) 수정 범위 한정

- **Rule**: `src/code.ts` 수정은 대상 함수 + (필요시) 라우터 case로 범위를 한정한다. 파일 전체 재작성, 함수 재배치, 무관 코드 포맷팅을 하지 않는다.
- **Why**: 파일 말미에 라우터(L4709-4803), `documentchange` 핸들러(L4807~, 5개 서브로직), 초기화가 집중되어 있어 전체 재작성 시 서브로직 누락 위험이 실제로 존재.
- **Evidence**:
  - [`src/code.ts`](../../src/code.ts:4709) — 라우터
  - [`src/code.ts`](../../src/code.ts:4807) — `documentchange`
  - `wc -l src/code.ts` → **4,992줄**
- **Agent Constraint**: diff는 변경 대상 함수 블록 + 라우터 case로만 구성. "인근 코드 정리" 금지. `documentchange` 핸들러를 건드릴 경우 5개 서브로직(커넥터 등록, 기즈모 차단, 텍스트 스타일 보정, status 뱃지 잠금, 커넥터 설정 동기화) 각각에 영향이 없는지 명시.
- **Verification**: diff 리뷰 시 변경 블록이 대상 함수 내에 포함되는지 확인 + `npm run build` 성공 + 해당 기능 수동 검증.

---

## INV-09 — 빌드 순서와 산출물

- **Rule**: 빌드 순서는 `build`(core) → `build:ui`(React 번들) → `build:inject`(HTML 인라인)이며, 최종 산출물은 `dist/code.js` + `dist/ui.html`이다. `dist/ui.html`을 수동 편집하지 않는다.
- **Why**: Figma UI는 단일 HTML 제약으로 JS/CSS가 `dist/ui.html`에 인라인되어야 하며, `build-ui.mjs`는 `dist/ui-bundle.js` + `src/ui/styles.css`을 읽어 `dist/ui.html`을 생성. 순서 위반 또는 수동 편집은 다음 빌드 시 소실.
- **Evidence**:
  - [`package.json`](../../package.json:10) — `build:all` 체인(`build && build:ui && build:inject`)
  - [`scripts/build-ui.mjs`](../../scripts/build-ui.mjs:19) — HTML 템플릿
  - [`manifest.json`](../../manifest.json:1) — `ui: dist/ui.html`
- **Agent Constraint**: UI 변경 후 `npm run build:ui && npm run build:inject`(또는 `build:all`) 실행 필수. `dist/` 파일 직접 수정 금지. `src/ui.html`은 빌드 산출물이 아님(구형 아티팩트)으로 취급.
- **Verification**: `npm run build:all` 성공 + `dist/ui.html`에 변경된 JS/CSS가 포함되는지 확인.

---

## INV-10 — 완료 전 검증 게이트

- **Rule**: 모든 작업 완료 전 `npm run typecheck` + `npm run build:all`이 통과해야 하며, 프로토콜 관련 변경(INV-03/04)은 union ↔ switch 일치성 대조를 추가 검증으로 수행한다.
- **Why**: 테스트/linter/CI가 없어 typecheck+build가 유일한 자동 검증이고, typecheck는 `event.data?.pluginMessage`의 타입 미강제 구간([`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:24))의 불일치를 잡지 못함(현재 R-08/R-09 불일치가 typecheck 통과 상태에서 존재하는 것이 증거).
- **Evidence**:
  - [`package.json`](../../package.json:12) — `typecheck`(`tsc --noEmit`)
  - devDependencies에 **테스트/linter 없음** (`esbuild`/`react`/`typescript`/`@figma/plugin-typings`만 존재)
  - [`src/ui/hooks/useFigmaMessage.ts`](../../src/ui/hooks/useFigmaMessage.ts:24) — 타입 미강제 수신
- **Agent Constraint**: "typecheck 통과"를 "프로토콜 일치"로 해석 금지. 완료 보고 시 실행한 검증 명령과 결과를 명시. `npm run build`(core만) 성공을 전체 빌드 성공으로 보고 금지.
- **Verification**: `npm run typecheck` && `npm run build:all` exit code 0 + (프로토콜 변경 시) union/switch 대조 결과 첨부.

---

## 요약 매트릭스

| ID     | 영역                 | 현재 위반?                  | Harness 게이트 우선순위 |
| ------ | -------------------- | --------------------------- | ----------------------- |
| INV-01 | 샌드박스 격리        | ❌ 없음                     | 낮음 (사전 lint)        |
| INV-02 | 통신 채널            | ❌ 없음                     | 낮음 (사전 lint)        |
| INV-03 | PluginAction 계약    | ⚠️ **있음** (2개 액션 누락) | **1순위** (정적 대조)   |
| INV-04 | CoreToUIMessage 계약 | ⚠️ **있음** (양방향 불일치) | **1순위** (정적 대조)   |
| INV-05 | 상태 소유권          | ⚠️ 구조적 취약              | 2순위 (allowlist)       |
| INV-06 | customConnector 격리 | ❌ 없음                     | 낮음 (사전 lint)        |
| INV-07 | types.ts 단일 소스   | ❌ 없음                     | 낮음 (리뷰 체크)        |
| INV-08 | code.ts 수정 범위    | ❌ 없음                     | 2순위 (diff 제한)       |
| INV-09 | 빌드 순서            | ❌ 없음                     | 2순위 (게이트)          |
| INV-10 | 검증 게이트          | ❌ 없음                     | **1순위** (완료 게이트) |
