# Harness Engineering 도입 분석 — Current Architecture Baseline

> **작성일**: 2026-09-28
> **범위**: `/Users/170h/Developer/Figma/ui-flow-diagram` (분석만 수행, 파일 수정 없음)
> **목적**: Harness 도입 시 검증 게이트 설계에 활용 가능한 프로젝트 기준선(Baseline)
> **참고 Harness**: `./harness-starter-kit` (`.harness/`, `AGENTS.md`, `commands/`, `agent-skills/`, `docs/`, `scripts/` 포함)

---

## 1. Current Architecture

**Figma 플러그인 (FigJam 전용)** — 두 개의 격리된 샌드박스가 메시지 프로토콜로 통신하는 구조입니다.

### 1-1. Figma Core Sandbox

- `src/code.ts` — **4,993줄 단일 모놀리스**. 모든 캔버스 조작(노드 생성/수정, 커넥터, 배지, 상태, 엘레베이션, UI3 변수 추출, 설정 저장)을 담당
  - 진입점: `figma.showUI(__html__, { width: 360, height: 486 })` (L38)
  - 메시지 라우터: `figma.ui.onmessage = async (msg: PluginAction) => switch` (L4709, 파일 말미)
  - 캔버스 변경 감지: `figma.on('documentchange', ...)` (L4807) — 커넥터 레지스트리 등록, 노드 이동 시 커넥터 추적
- `src/customConnector.ts` — 코어 측 지오메트리 엔진:
  - 직교/S-커브/자유곡선 라우팅 (`calculateOrthogonalPoints`, `calculateCurvedPoints`)
  - 마그넷 선택: 자동 4조건 유지 + 최적 (`resolveMagnetPair`, `getOptimalMagnetPair`), 수동(기즈모)은 앵커 이동량·완화 임계로 유지 (`is_manual_magnet`, `manual_base_dx/dy`)
  - 벡터 네트워크 생성 (`buildVectorNetwork`)
  - 드래그 갱신은 벡터 재사용(resize·네트워크만 갱신) + 동일 입력 틱 early-return + 최상위 reorder·라벨 이동 생략
  - 레지스트리 (`registerConnectorInRegistry`, `refreshConnectorRegistry`)
  - **Figma API 타입(`SceneNode`, `StrokeCap`)을 사용하므로 UI 샌드박스에서 import 불가**
  - (2026-10-06 갱신: `cleanupGhostTerminalMarkers` 삭제, 관통-only 유지→자동 4조건 + 수동 분리로 변경)

### 1-2. React UI Sandbox

- `src/ui/index.tsx` — React 18 진입점: `createRoot` → `AppProvider` → `App`
- `src/ui/App.tsx` — 604줄, 3개 탭(Node / Appearance / Connection) + CTA 로직 + 모달 관리
- `src/ui/context/AppContext.tsx` — 전역 상태(`useApp`)
- 컴포넌트 도메인별 구성:
  - `node/` — NodePanel, TypeSection, DescriptionSection, FigmaLinkSection
  - `appearance/` — AppearancePanel, StyleSection, SizeSection, StatusSection, StepBadgesSection, ElevationSection
  - `connection/` — ConnectionPanel, ConnectSection, LabelSection, LinkSection, FigmaLinkSection
  - `modals/` — SizeModal, StyleModal, ConnectorColorModal, FillColorModal, StrokeColorModal, FigmaDesignPickerModal
  - `popovers/` — ContextMenu
  - `shared/` — ColorWheelField, DropdownMixedItem, SectionBlock, Switch, Tooltip, icons
- 훅:
  - `useFigmaMessage` (Core→UI 수신)
  - `useAutoResize` (창 높이 자동 조절)
  - `useSelectionSummary`
- `src/ui/styles.css` — 4,370줄 (BUG_REPORT 기준)

### 1-3. Core ↔ UI 통신

| 방향      | 메커니즘                                                                | 타입                                       |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| UI → Core | `parent.postMessage({ pluginMessage: action }, '*')`                    | `PluginAction`                             |
| Core → UI | `postToUI()` → `figma.ui.postMessage(msg)` (code.ts L520)               | `CoreToUIMessage`                          |
| UI 수신   | `window.addEventListener('message', handler)` (useFigmaMessage.ts L180) | (타입 미강제, `event.data?.pluginMessage`) |

- **핸드셰이크**: UI 마운트 시 `INIT` 전송 (useFigmaMessage.ts L187) → Core가 `handleSelectionChange() + syncStatusList() + loadSavedSettings()` 응답 (code.ts L4797)
- **창 리사이즈**: UI `RESIZE_WINDOW` → Core `figma.ui.resize(360, 200~1200 clamp)` (code.ts L4791)

### 1-4. `PluginAction` (UI → Core)

`src/types.ts` L280 — **약 30개 액션의 discriminated union**:

- `CREATE_FLOW_NODE`
- `UPDATE_FLOW_NODE`
- `CONNECT_POINTS`
- `AUTO_CONNECT_SELECTED`
- `UPDATE_CONNECTOR_LABEL`
- `UPDATE_CONNECTOR_PROPERTIES`
- `SET_CONNECTOR_LINE_TYPE`
- `CONVERT_ALL_CONNECTORS_TO_ELBOWED`
- `EXTRACT_UI3_VARIABLES`
- `TOGGLE_NODE_THEME`
- `SET_STATUS`
- `SET_ELEVATION`
- `ADD_STEP_BADGES`
- `REMOVE_STEP_BADGES`
- `GET_STATUS_LIST`
- `FOCUS_FRAME`
- `GET_DESIGN_FRAMES`
- `CREATE_TEMPLATE`
- `RESIZE_NODE`
- `SAVE_SETTINGS`
- `LOAD_SETTINGS`
- `UNDO`
- `REDO`
- `CLOSE_PLUGIN`
- `NOTIFY`
- `RESIZE_WINDOW`
- `INIT`
- `CREATE_CONNECTORS`

> ⚠️ **union에 선언되어 있으나 `switch`(code.ts L4710)에서 처리되지 않는 액션 존재**: `CREATE_CONNECTORS`, `CREATE_TEMPLATE` (default case도 없음)

### 1-5. `CoreToUIMessage` (Core → UI)

`src/types.ts` L379 — 6종:

- `SELECTION_CHANGED`
- `STATUS_LIST_UPDATED`
- `DESIGN_FRAMES_LOADED`
- `UI3_VARIABLES_EXTRACTED`
- `SETTINGS_LOADED`
- `TOAST`

> ⚠️ **UI 수신측 `switch`(useFigmaMessage.ts L27)는 `INIT_DONE`, `READY`, `SWITCH_TAB`을 처리하는데 이 3종은 union에 없음** (역방향 불일치)
> ⚠️ 반대로 union의 `STATUS_LIST_UPDATED`, `UI3_VARIABLES_EXTRACTED`, `SETTINGS_LOADED`, `TOAST`는 수신측에서 `default: break`로 무시됨

### 1-6. 빌드 파이프라인

```
src/code.ts ──esbuild──▶ dist/code.js
src/ui/index.tsx ──esbuild──▶ dist/ui-bundle.js ─┐
src/ui/styles.css ───────────────────────────────┤
                                                 ▼
                              scripts/build-ui.mjs → dist/ui.html (JS+CSS 인라인)
```

- `manifest.json`: `main: dist/code.js`, `ui: dist/ui.html`, `editorType: ["figjam"]`, networkAccess: `https://api.figma.com` only
- `scripts/build-ui.mjs` — Figma 플러그인 UI가 단일 HTML이어야 하므로 번들+CSS를 인라인 주입

### 1-7. 문서 / Git 상태

- 문서:
  - `README.md` (개발 가이드 — 단, `src/ui.html` 기반의 **구 구조 설명이 남아 있어 일부陈旧**)
  - `PRODUCT_SPEC.md`
  - `DESIGN_SYSTEM_UI3.md`
  - `PROJECT_CONTEXT.md`
  - `BUG_REPORT.md` (74+ 이슈)
  - `VERIFICATION_REPORT.md` (CONFIRMED / PARTIAL / FALSE POSITIVE 판정)
- **git**: `main` 브랜치, **working tree clean**, `origin/main`과 동기화됨. 최근 커밋은 컬러 모달/StyleModal 리팩토링 중심

---

## 2. Existing Verification Commands

| 명령                   | 내용                                                     |
| ---------------------- | -------------------------------------------------------- |
| `npm run typecheck`    | `tsc --noEmit` (strict mode, `tsconfig.json`)            |
| `npm run build`        | esbuild → `dist/code.js` (core)                          |
| `npm run build:ui`     | esbuild → `dist/ui-bundle.js` (React, `--jsx=automatic`) |
| `npm run build:inject` | `node scripts/build-ui.mjs` → `dist/ui.html`             |
| `npm run build:all`    | 위 3단계 순차 실행                                       |
| `npm run watch`        | core esbuild watch (UI는 없음)                           |

**검증 공백**:

- ❌ 테스트 프레임워크 없음 (jest/vitest 미설치)
- ❌ Linter 없음 (eslint 설정 없음)
- ❌ CI 설정 없음
- ✅ 수동 검증: Figma 데스크톱 → manifest import → UI 우클릭 `Reload`, `Inspect Element`로 DevTools 확인
- ✅ `BUG_REPORT.md` + `VERIFICATION_REPORT.md` — 현재 버그 수정의 검증 기준선
  - C-15, C-31은 FALSE POSITIVE (수정 제외)
  - C-04, C-20, M-07, L-07은 PARTIAL (범위 축소)

---

## 3. Important Architecture Boundaries

1. **샌드박스 격리 (가장 핵심)**
   - Core(`code.ts`, `customConnector.ts`)만 Figma API 접근 가능
   - UI(`src/ui/`)는 순수 웹 iframe으로 Figma API가 **전혀 없음**
   - 유일한 통로는 `postMessage`
   - `customConnector.ts`는 Figma 타입 의존으로 **UI에서 import 불가**

2. **공유 계약 모듈**
   - `src/types.ts`가 양쪽 샌드박스의 **단일 소스 오브 트루스**
   - 단, 타입뿐 아니라 **런타임 코드도 포함**(`STATUS_CONFIG`, `NODE_TYPE_SHAPE_SPECS`, `normalizeNodeType`) → 두 번들 모두에 런타임 중복 번들링됨

3. **타입 안전성의 한계**
   - 프로토콜은 컴파일 타임 union으로만 보장
   - **런타임 메시지 검증(zod 등) 없음**
   - 특히 UI 수신측은 `event.data?.pluginMessage`가 **타입 미강제**라 union과 불일치해도 컴파일 에러가 나지 않음 (1-4/1-5의 양방향 불일치가 그 증거)

4. **단일 HTML 제약**
   - Figma UI는 외부 에셋 불가 → CSS/JS 전부 `dist/ui.html`에 인라인
   - 빌드 순서(`build:ui` → `build:inject`)를 깨면 플러그인 로딩 실패

5. **상태 소유권 경계**
   - Core = 캔버스 상태 소유, UI = 폼/패널 상태 소유(`AppContext`)
   - 단, UI가 `SELECTION_CHANGED` 수신 시 `document.getElementById`로 직접 DOM 조작하여 폼을 복원 (useFigmaMessage.ts L52) — React 상태 관리와 혼재된 **취약 경계** (BUG_REPORT 다수 항목의 원인)

6. **창 크기 고정**
   - 폭 360px 고정, 높이 200~1200px clamp (code.ts L4793)

7. **FigJam 전용 + 네트워크 제한**
   - `editorType: ["figjam"]`
   - 외부 통신은 `https://api.figma.com`만 허용 (manifest networkAccess)

8. **모놀리스 리스크**
   - `code.ts` 4,993줄 단일 파일, 메시지 라우터가 파일 말미
   - 신규 액션 추가 시 `types.ts` union + `code.ts` switch + (필요시) `useFigmaMessage.ts` 3곳 동시 수정 필요
   - **Harness 도입 시 검증 게이트의 1순위 대상**

9. **검증 자동화 부재**
   - typecheck + build + 수동 Figma 테스트가 전부
   - Harness 도입 시 `typecheck → build:all`을 최소 게이트로, BUG_REPORT의 CONFIRMED 항목을 회귀 기준선으로 삼을 수 있는 구조

---

## Appendix: Harness 도입 시 검증 게이트 설계 제안 (Baseline 기반)

| 게이트 | 명령                            | 목적                                                                                |
| ------ | ------------------------------- | ----------------------------------------------------------------------------------- |
| G1     | `npm run typecheck`             | 컴파일 타임 타입 안전성 (strict mode)                                               |
| G2     | `npm run build:all`             | core + UI 번들 + HTML 인라인 순서 검증                                              |
| G3     | (신규) 프로토콜 일치성 스크립트 | `PluginAction` union ↔ `code.ts` switch ↔ `useFigmaMessage.ts` switch 3자 일치 검증 |
| G4     | (신규) BUG_REPORT 회귀 체크     | CONFIRMED 항목(C-01~C-05 등)이 재발하지 않는지 정적/수동 검증                       |
| G5     | (신규) 런타임 메시지 검증       | zod 등 스키마로 `postMessage` payload 검증 (경계 3 대응)                            |

> **핵심 인사이트**: 이 프로젝트의 가장 큰 Harness 도입 기회는 **경계 3(타입 안전성 한계)** 과 **경계 8(모놀리스 리스크)** 입니다. `types.ts`가 단일 소스 오브 트루스이므로, 프로토콜 일치성 자동 검증(G3)만으로도 신규 액션 추가 시 3곳 동시 수정 누락(1-4/1-5의 불일치)을 컴파일 타임에 잡아낼 수 있습니다.
