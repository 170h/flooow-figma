# PROJECT_CONTEXT — UI Flow Diagram (Figma Plugin)

> 이 문서는 프로젝트의 전체 구조를 파악하기 위한 **단일 소스 오브 트루** 문서다.
> 새로운 AI 세션에서 이 파일만 읽으면 코드베이스를 이해할 수 있어야 한다.
> 코드 수정 없이 구조·아키텍처·프로토콜·패턴만 기록한다.

---

## 1. 프로젝트 개요

| 항목          | 값                                                                         |
| ------------- | -------------------------------------------------------------------------- |
| 이름          | UI Flow Diagram                                                            |
| 목적          | FigJam 캔버스에 UI 화면 흐름 다이어그램(스크린 플로우) 생성·연결·상태 관리 |
| 타겟 에디터   | `figjam` (manifest.json:7)                                                 |
| API           | Figma Plugin API `1.0.0`                                                   |
| UI 스택       | React 18 + TypeScript, esbuild 번들                                        |
| 외부 네트워크 | `https://api.figma.com` (디자인 파일 페이지/프레임 조회)                   |
| 플러그인 창   | 360 × 486px, `themeColors: true` (code.ts:38)                              |

### 핵심 기능

- 6종 표준 노드 타입(Screen/Process/Connector/Decision/Terminator/Branch) 생성·수정
- 노드 간 직각(orthogonal) 벡터 커넥터 자동 연결 (네이티브 커넥터 우회)
- 워크플로 상태 뱃지(8단계), 스텝 번호 뱃지, 페이즈, 엘레베이션(E100~E500)
- Figma 디자인 파일 프레임 링크, UI3 변수 추출
- Figma UI3 공식 디자인 규격 준수 (라이트/다크 테마)

---

## 2. 아키텍처 (2-샌드박스)

Figma 플러그인 표준 구조. UI(iframe)와 Core(Figma API)가 `postMessage`로만 통신한다.

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│  UI 샌드박스 (iframe)        │         │  Core 샌드박스 (Figma API)   │
│                             │         │                             │
│  index.tsx                  │         │  code.ts (4,993줄)          │
│   └─ AppProvider            │         │   ├─ 노드 생성/수정/리사이즈  │
│       └─ App.tsx (604줄)    │         │   ├─ 커넥터 생성/수정        │
│           ├─ NodePanel      │         │   ├─ 상태/페이즈/스텝 뱃지   │
│           ├─ AppearancePanel│         │   ├─ 엘레베이션/테마         │
│           └─ ConnectionPanel│         │   ├─ Figma REST API 연동    │
│                             │         │   └─ figma.ui.onmessage     │
│  context/AppContext.tsx     │         │        (디스패처, code.ts:4709)│
│  hooks/                     │         │                             │
│   ├─ useFigmaMessage        │         │  customConnector.ts (1,419줄)│
│   ├─ useAutoResize          │         │   └─ 직각 벡터 커넥터 엔진   │
│   └─ useSelectionSummary    │         │                             │
│  components/ (도메인별)      │         │  types.ts (419줄)           │
└─────────────────────────────┘         └─────────────────────────────┘
        ▲                                        │
        │  CoreToUIMessage (6종)                 │
        └────────────────────────────────────────┘
        UI → Core: PluginAction (~30종)
```

### 샌드박스 경계 규칙

- Core는 `figma.*` API만 접근 가능, DOM 접근 불가
- UI는 DOM/React만 접근 가능, `figma` 전역 객체 없음
- 양방향 통신은 **타입화된 메시지 프로토콜**로만 (types.ts)

---

## 3. 빌드 파이프라인

`package.json` 스크립트 3단계 순차 실행:

| 스크립트       | 입력                                      | 출력                | 비고                                                 |
| -------------- | ----------------------------------------- | ------------------- | ---------------------------------------------------- |
| `build`        | `src/code.ts`                             | `dist/code.js`      | esbuild, target es2020                               |
| `build:ui`     | `src/ui/index.tsx`                        | `dist/ui-bundle.js` | `--jsx=automatic --loader:.css=text`                 |
| `build:inject` | `dist/ui-bundle.js` + `src/ui/styles.css` | `dist/ui.html`      | `scripts/build-ui.mjs`가 JS/CSS를 HTML에 인라인 주입 |

- `build:all` = 위 3단계 순차 실행
- `watch` = code.ts만 워치 모드
- `typecheck` = `tsc --noEmit` (테스트 프레임워크 없음)
- Figma는 `manifest.json`의 `main`(dist/code.js)과 `ui`(dist/ui.html)만 로드

---

## 4. 메시지 프로토콜 (핵심 계약)

양방향 메시지 타입은 `src/types.ts`에 유니온 타입으로 정의 → **단일 소스 오브 트루**.

### 4.1 UI → Core: `PluginAction` (types.ts:280)

| 그룹        | 액션                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 노드        | `CREATE_FLOW_NODE`, `UPDATE_FLOW_NODE`, `RESIZE_NODE`, `TOGGLE_NODE_THEME`                                                                                         |
| 커넥터      | `CONNECT_POINTS`, `AUTO_CONNECT_SELECTED`, `UPDATE_CONNECTOR_LABEL`, `UPDATE_CONNECTOR_PROPERTIES`, `SET_CONNECTOR_LINE_TYPE`, `CONVERT_ALL_CONNECTORS_TO_ELBOWED` |
| 상태/스타일 | `SET_STATUS`, `SET_PHASE`, `SET_ELEVATION`, `ADD_STEP_BADGES`, `REMOVE_STEP_BADGES`                                                                                |
| 조회        | `GET_STATUS_LIST`, `GET_DESIGN_FRAMES`, `FOCUS_FRAME`, `EXTRACT_UI3_VARIABLES`                                                                                     |
| 설정        | `SAVE_SETTINGS`, `LOAD_SETTINGS`                                                                                                                                   |
| 시스템      | `UNDO`, `REDO`, `CLOSE_PLUGIN`, `NOTIFY`, `RESIZE_WINDOW`, `INIT`                                                                                                  |

- 디스패처: `code.ts:4709` `figma.ui.onmessage` switch문
- 각 액션은 `code.ts`의 전용 함수로 위임 (아래 §5 참조)

### 4.2 Core → UI: `CoreToUIMessage` (types.ts:379)

| 타입                      | 용도                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `SELECTION_CHANGED`       | 선택 노드 정보(`SelectedNodeInfo[]`) + 마그넷 제안 + 카운트 메타 |
| `STATUS_LIST_UPDATED`     | 프레임 상태 목록                                                 |
| `DESIGN_FRAMES_LOADED`    | Figma 디자인 파일 프레임 목록                                    |
| `UI3_VARIABLES_EXTRACTED` | 추출된 CSS 변수                                                  |
| `SETTINGS_LOADED`         | 저장된 토큰/파일 URL                                             |
| `TOAST`                   | 토스트 알림                                                      |

- 수신: `src/ui/hooks/useFigmaMessage.ts:9` `window.onmessage` 핸들러
- `SELECTION_CHANGED` 수신 시 폼 필드 복원 (DOM 직접 조작, §7 참조)

### 4.3 주요 페이로드 타입 (types.ts)

| 타입                                  | 용도                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `FlowNodePayload` (types.ts:182)      | 노드 생성: title/desc/tag/theme/figmaLink/치수/nodeType/phase/elevation/status/badge/색상 |
| `UpdateNodePayload` (types.ts:242)    | 노드 수정: nodeId + 위 필드                                                               |
| `ConnectPointsPayload` (types.ts:208) | 커넥터 생성: source/target nodeId + magnet + 라우팅/단자/패턴/라벨                        |
| `SelectedNodeInfo` (types.ts:329)     | 선택 노드 직렬화: isFlowNode/isConnector + 모든 속성                                      |
| `FrameStatusItem` (types.ts:69)       | 프레임 상태 항목                                                                          |
| `DesignFrameItem` (types.ts:271)      | 디자인 프레임(id/name/치수/코너)                                                          |

---

## 5. Core 샌드박스 모듈

### 5.1 `src/code.ts` (4,993줄) — 플러그인 메인

기능 영역별 함수 배치:

| 영역           | 함수 (위치)                                                                                                                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI3 토큰       | `ELEVATION_EFFECTS_LIGHT/DARK` (code.ts:51), `getElevationEffects` (code.ts:402)                                                                                                                                                                                                       |
| 헬퍼           | `rgbToHexColor` (code.ts:32), `hexToRgbColor` (code.ts:3191), `safeGetPluginData` (code.ts:653), `normalizeUrl`/`isFigmaUrl` (code.ts:532)                                                                                                                                             |
| 선택 감지      | `handleSelectionChange` (code.ts:1031) — 캔버스 선택 → `SelectedNodeInfo[]` 직렬화 → UI 전송                                                                                                                                                                                           |
| 노드 탐색      | `findConnectorNode` (code.ts:665), `findFlowNode` (code.ts:695), `getNextFlowTag` (code.ts:719)                                                                                                                                                                                        |
| 텍스트         | `extractNodeText` (code.ts:737), `calculateCardHugHeight` (code.ts:807), `safeSetCharacters` (code.ts:1605), `enforceTitleStandardStyle` (code.ts:1694), `updateDescTextTruncation` (code.ts:886)                                                                                      |
| 노드 생성/수정 | `createFlowNode` (code.ts:2227), `updateFlowNode` (code.ts:2519), `resizeNode` (code.ts:3016), `convertShapeToFrameNode` (code.ts:1878)                                                                                                                                                |
| 도형           | `getShapeVectorData` (code.ts:2130), `createShapeVectorNode` (code.ts:2158), `attachShapeVectorNode` (code.ts:2194)                                                                                                                                                                    |
| 커넥터         | `connectPoints` (code.ts:3203), `createSingleConnector` (code.ts:3251), `autoConnectSelected` (code.ts:3292), `updateConnectorLabel` (code.ts:3399), `updateConnectorProperties` (code.ts:3437), `setConnectorLineType` (code.ts:3746), `convertAllConnectorsToElbowed` (code.ts:3777) |
| 상태/뱃지      | `applyStatusToSelected` (code.ts:3915), `applyPhaseToSelected` (code.ts:3882), `applyElevationToSelected` (code.ts:4059), `addStepBadges` (code.ts:4430), `removeStepBadges` (code.ts:4468), `applyStepBadgeToSingleCard` (code.ts:4210), `getStepBadgeCoordinates` (code.ts:4314)     |
| Figma API      | `extractUI3Variables` (code.ts:4584), `getDesignFrames` (code.ts:4517), `focusFrame` (code.ts:4504), `saveSettings` (code.ts:4575), `loadSavedSettings` (code.ts:4565)                                                                                                                 |
| 상태 목록      | `collectStatusItems` (code.ts:3838), `syncStatusList` (code.ts:3876)                                                                                                                                                                                                                   |
| 메시지         | `postToUI` (code.ts:520), `notify` (code.ts:525)                                                                                                                                                                                                                                       |
| 디스패처       | `figma.ui.onmessage` (code.ts:4709)                                                                                                                                                                                                                                                    |

### 5.2 `src/customConnector.ts` (1,419줄) — 직각 벡터 커넥터 엔진

피그잼 네이티브 커넥터의 라운딩 강제 문제를 우회, 100% 순수 직각 Miter 선 생성.

| 영역            | 함수 (위치)                                                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 타입/인터페이스 | `Point`, `Box`, `ConnectorOptions` (customConnector.ts:13)                                                                                                                                                                                                        |
| 헬퍼            | `safeGetPluginData` (customConnector.ts:40), `terminalToStrokeCap` (customConnector.ts:52), `getMagnetDirectionVector` (customConnector.ts:70)                                                                                                                    |
| 라우팅 계산     | `calculateCurvedPoints` (customConnector.ts:80), `calculateStraightPoints` (customConnector.ts:123), `calculateRoutingPoints` (customConnector.ts:128), `calculateOrthogonalPoints` (customConnector.ts:471), `simplifyOrthogonalPoints` (customConnector.ts:440) |
| 지오메트리      | `buildVectorNetwork` (customConnector.ts:164) — 단자별 버텍스·세그먼트, `buildVectorVertices` (customConnector.ts:380, 하위호환 래퍼)                                                                                                                             |
| 좌표            | `getMagnetPoint` (customConnector.ts:426), `getLabelCenterPoint` (customConnector.ts:390)                                                                                                                                                                         |
| 충돌 검사       | `lineSegmentIntersectsBox` (customConnector.ts:630), `doesPathCrossBoxes` (customConnector.ts:671)                                                                                                                                                                |
| 렌더링          | `createOrthogonalVectorConnector` (customConnector.ts:686), `updateOrthogonalVectorConnector` (customConnector.ts:1097)                                                                                                                                           |
| 레지스트리      | `registerConnectorInRegistry` (customConnector.ts:896), `refreshConnectorRegistry` (customConnector.ts:958), `cleanupGhostTerminalMarkers` (customConnector.ts:929)                                                                                               |
| 최적화          | `getOptimalMagnetPair` (customConnector.ts:984), `optimizeNativeConnector` (customConnector.ts:1058)                                                                                                                                                              |
| 동기화          | `syncConnectorsForMovedNodes` (customConnector.ts:1353) — 노드 이동 시 커넥터 자동 재연결                                                                                                                                                                         |
| 메타            | `copyConnectorData` (customConnector.ts:1324)                                                                                                                                                                                                                     |

### 5.3 `src/types.ts` (419줄) — 공유 도메인 모델

| 항목                                                        | 위치                    |
| ----------------------------------------------------------- | ----------------------- |
| `WorkflowStatus` (8단계) + `STATUS_CONFIG` 색상             | types.ts:1, types.ts:18 |
| `DiagramNodeType` (6종 표준 + 10종 레거시)                  | types.ts:80             |
| `normalizeNodeType()` — 16종 → 6종 정규화                   | types.ts:103            |
| `NODE_TYPE_SHAPE_SPECS` — 타입별 치수/코너/설명·링크 허용   | types.ts:146            |
| `BadgePosition` / `BadgeShape`                              | types.ts:165            |
| `ConnectorStrokePattern` (SOLID/DASHED/DOTTED)              | types.ts:169            |
| `ConnectorRoutingType` (ORTHOGONAL/S_CURVE/CURVED/STRAIGHT) | types.ts:170            |
| `ConnectorTerminalType` (9종)                               | types.ts:171            |
| 페이로드/메시지 타입                                        | types.ts:182~415        |

---

## 6. UI 샌드박스 모듈

### 6.1 진입점

- `src/ui/index.tsx` — `createRoot` + `AppProvider` + `App` 렌더링

### 6.2 `src/ui/context/AppContext.tsx` (1,195줄) — 전역 상태 저장소

| 항목   | 내용                                                                                                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 타입   | `SizePreset`, `StylePreset`, `NodeInfo`, `LastNodeConfig`, `LastConnectorConfig`, `UIState`, `ModalType`                                                                                      |
| 기본값 | `DEFAULT_SIZE_PRESETS` (4종), `DEFAULT_STYLE_PRESETS` (2종)                                                                                                                                   |
| 상태   | currentTab, selectedNodes, isConnectorSelected, activeModal, uiState, phasePopoverOpen, contextMenuOpen, lastNodeConfig, stylePresets, sizePresets, phases, editingPhase, designFrames, toast |
| 액션   | `handleMainAction`, `handleSelectionChange`, `showToast`, `autoResizeWindow`, `closeAllPopovers`, `applyCurrentNodeState`, 프리셋 CRUD, 페이즈 관리                                           |

### 6.3 `src/ui/App.tsx` (604줄) — 셸 컴포넌트

| 항목         | 내용                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| 탭           | `Node` / `Appearance` / `Connection` (App.tsx:23)                       |
| CTA 라벨     | `getCtaLabel` (App.tsx:32) — Create/Update/Connect/Update All 동적 결정 |
| 탭 자동 전환 | App.tsx:115 — 선택 상태에 따라 탭 자동 이동                             |
| 모달         | Phase/Size/FigmaDesignPicker/Style/ConnectorColor/FillColor/StrokeColor |
| 포버         | ContextMenu, PhasePopover                                               |
| 입력 UX      | 포커스 시 텍스트 전체 자동 선택 (App.tsx:141)                           |

### 6.4 컴포넌트 트리 (도메인별 폴더)

```
src/ui/components/
├── node/          NodePanel + TypeSection + PhaseSection + DescriptionSection + FigmaLinkSection
├── appearance/    AppearancePanel + StyleSection + SizeSection + ElevationSection + StatusSection + StepBadgesSection
├── connection/    ConnectionPanel + ConnectSection + LabelSection + LinkSection + FigmaLinkSection
├── modals/        PhaseModal + SizeModal + StyleModal + FillColorModal + StrokeColorModal + ConnectorColorModal + FigmaDesignPickerModal
├── popovers/      ContextMenu + PhasePopover
└── shared/        Switch + Tooltip + SectionBlock + ColorWheelField + DropdownMixedItem + icons
```

### 6.5 훅

| 훅                    | 파일                                | 역할                                           |
| --------------------- | ----------------------------------- | ---------------------------------------------- |
| `useFigmaMessage`     | src/ui/hooks/useFigmaMessage.ts     | core→UI 메시지 수신, 선택 노드 속성 → 폼 복원  |
| `useAutoResize`       | src/ui/hooks/useAutoResize.ts       | 콘텐츠 높이에 맞춰 플러그인 창 리사이즈        |
| `useSelectionSummary` | src/ui/hooks/useSelectionSummary.ts | 선택 요약(플로우 노드/커넥터/FigJam 객체 분류) |

### 6.6 유틸

- `src/ui/utils/selectionUtils.ts` — 선택 관련 유틸

---

## 7. 설계 패턴

### 7.1 플러그인 데이터 기반 식별

- 노드/커넥터는 `getPluginData`/`setPluginData`로 메타데이터 저장·복원
- `safeGetPluginData` (code.ts:653, customConnector.ts:40)로 네이티브 노드 TypeError 방어
- 커넥터 레지스트리(`nodeToConnectorsMap`)로 노드↔커넥터 매핑 유지

### 7.2 Source of Truth 이중화

- **캔버스 노드** = 텍스트/치수/스타일의 단일 진실
- **UI 폼** = `LastNodeConfig`를 기준으로 입력 상태 유지
- 선택 변경 시 `useFigmaMessage.ts:52`에서 `getElementById`로 **직접 DOM 조작**해 복원
  - React 상태 + DOM 직접 접근 하이브리드 (리팩토링 시 제어 컴포넌트 패턴 전환 가능)

### 7.3 UI3 디자인 시스템 정합성

- 엘레베이션 E100~E500 (라이트/다크) — code.ts:51
- Inter 폰트 고정 (Bold 13px 타이틀, Regular 11px 설명)
- 360px 폭, Figma 공식 UI3 인스펙터 UX 표준
- `DESIGN_SYSTEM_UI3.md` 참조

### 7.4 레거시 호환 계층

- 노드 타입 16종 → 6종 정규화 (`normalizeNodeType`, types.ts:103)
- `buildVectorVertices` 하위 호환 래퍼 (customConnector.ts:380)
- `NODE_TYPE_SHAPE_SPECS`에 레거시 별칭 포함 (types.ts:153)

### 7.5 커넥터 엔진 분리

- 직각 벡터 커넥터 로직을 `customConnector.ts`로 독립 분리
- code.ts는 오직 Figma API 호출 + 커넥터 엔진 호출만 담당
- 노드 이동 시 `syncConnectorsForMovedNodes`로 자동 재연결

### 7.6 타입 프로토콜 중심

- 양방향 메시지 타입을 `types.ts` 유니온 타입으로 단일화
- `PluginAction` / `CoreToUIMessage`이 샌드박스 경계의 유일한 계약
- 페이로드 타입(`FlowNodePayload`, `UpdateNodePayload`, `ConnectPointsPayload`)도 types.ts에 정의

---

## 8. 파일 맵 (전체)

```
ui-flow-diagram/
├── manifest.json              # Figma 플러그인 매니페스트 (figjam 전용)
├── package.json               # 스크립트 + 의존성
├── tsconfig.json              # TypeScript 설정
├── .gitignore
├── README.md
├── PRODUCT_SPEC.md            # 제품 스펙
├── DESIGN_SYSTEM_UI3.md       # UI3 디자인 시스템 문서
├── GEMINI.md
├── scripts/
│   └── build-ui.mjs           # UI 번들 → dist/ui.html 인라인 주입
└── src/
    ├── code.ts                # Core 메인 (4,993줄)
    ├── customConnector.ts     # 직각 벡터 커넥터 엔진 (1,419줄)
    ├── types.ts               # 공유 타입/프로토콜 (419줄)
    ├── ui.html                # UI 템플릿 (빌드 시 dist/ui.html 생성)
    └── ui/
        ├── index.tsx          # UI 진입점
        ├── App.tsx            # 셸 (604줄)
        ├── styles.css         # UI 스타일
        ├── context/
        │   └── AppContext.tsx # 전역 상태 (1,195줄)
        ├── hooks/
        │   ├── useFigmaMessage.ts
        │   ├── useAutoResize.ts
        │   └── useSelectionSummary.ts
        ├── utils/
        │   └── selectionUtils.ts
        └── components/
            ├── node/          # NodePanel + 4 섹션
            ├── appearance/    # AppearancePanel + 5 섹션
            ├── connection/    # ConnectionPanel + 4 섹션
            ├── modals/        # 7종 모달
            ├── popovers/      # ContextMenu + PhasePopover
            └── shared/        # 6종 공용 컴포넌트
```

---

## 9. 알려진 관찰점 / 리팩토링 여지

| 항목              | 설명                                                                              |
| ----------------- | --------------------------------------------------------------------------------- |
| code.ts 단일 파일 | 4,993줄. 노드/커넥터/뱃지/설정 도메인으로 분할 가능                               |
| 테스트 부재       | `typecheck` 스크립트만 존재, 테스트 프레임워크 없음                               |
| DOM 직접 조작     | `useFigmaMessage.ts`의 `getElementById` 기반 복원 → React 제어 컴포넌트 전환 가능 |
| 레거시 타입       | 10종 레거시 노드 타입 호환 유지 중, 정리 가능                                     |

---

## 10. 빠른 참조

| 질문                      | 답                                                             |
| ------------------------- | -------------------------------------------------------------- |
| UI→Core 메시지 보내는 곳? | `AppContext.tsx`의 `handleMainAction` → `figma.ui.postMessage` |
| Core→UI 메시지 받는 곳?   | `useFigmaMessage.ts:9`                                         |
| 노드 생성 로직?           | `code.ts:2227` `createFlowNode`                                |
| 커넥터 생성 로직?         | `code.ts:3203` `connectPoints` → `customConnector.ts:686`      |
| 상태 뱃지 적용?           | `code.ts:3915` `applyStatusToSelected`                         |
| 스텝 뱃지 적용?           | `code.ts:4430` `addStepBadges`                                 |
| 엘레베이션 적용?          | `code.ts:4059` `applyElevationToSelected`                      |
| 선택 변경 감지?           | `code.ts:1031` `handleSelectionChange`                         |
| 빌드?                     | `npm run build:all`                                            |
| 타입체크?                 | `npm run typecheck`                                            |
