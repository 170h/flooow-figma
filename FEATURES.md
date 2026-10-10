# Flooow — 기능 기술 문서 (Technical Specification)

> **작성일:** 2026-10-11
> **대상 코드베이스:** `Flooow-Figma` (`main` @ `0d679a3`), `Flooow-FigJam` (동일 구조)
> **문서 목적:** 현재 코드에 실제 구현된 기능을 사용자 관점 + 기술 관점으로 정리한 단일 참조 문서.
> 아키텍처 규칙(INV/R)은 `AGENTS.md`, 버그 이력은 `BUG_REPORT.md` / `VERIFICATION_REPORT.md` 참조.

---

## 1. 제품 개요

| 항목 | 값 |
|---|---|
| 플러그인 이름 | Flooow |
| 플러그인 ID | `ui-flow-diagram` (Figma / FigJam 공통) |
| 지원 에디터 | Figma + FigJam (`manifest.json` — `editorType: ["figjam", "figma"]`, FigJam 폴더는 `["figjam"]`) |
| UI 스택 | React 18 + TypeScript, esbuild 번들 |
| 플러그인 창 | 360 × 486px 기준, 높이 자동 조절 (`useAutoResize`, clamp 200~1200px), `themeColors: true` |
| 다국어 | 8개 언어 (ko / en / ja / zh-CN / zh-TW / es / de / fr) — `src/i18n.ts`, 런타임 자동 판정 |
| 테마 | Figma UI3 라이트/다크 대응 (CSS 변수 `var(--color-*)`, 폰트 웨이트 450/550) |

### 아키텍처 (2-샌드박스)

- **Core 샌드박스:** `src/code.ts` (약 8,000줄) — Figma API 전담. 노드/커넥터/뱃지 생성·수정·카운트.
- **UI 샌드박스:** `src/ui/` (React 18) — 패널 렌더링만. `figma.*` 호출 금지.
- **지오메트리 엔진:** `src/customConnector.ts` (약 2,100줄) — Core 전용. 직각 벡터 커넥터 계산.
- **통신:** `postMessage` / `figma.ui.postMessage` 전용. 계약은 `src/types.ts`의 `PluginAction`(UI→Core 29종) / `CoreToUIMessage`(Core→UI 6종).

---

## 2. 노드 (Node)

### 2.1 노드 타입 (6종 표준 + 레거시 호환)

`src/domain/nodeDomain.ts` — `normalizeNodeType()`이 레거시 별칭을 6종으로 정규화.

| 타입 | 규격 (W×H, R) | 설명 | 비고 |
|---|---|---|---|
| **Screen** | 250×90, R0 | 화면 카드. 제목+설명+링크 지원 | 유일하게 Size 전체 활성 |
| **Process** | 120×120, R0 | 일반 처리 (Square/Rectangle/Action/Error/True/False 별칭 포함) | 도형 노드 |
| **Junction** | 120×120, R60 | 연결점 (Connector/System/Database 별칭 포함) | 원형 |
| **Decision** | 140×140, R0 | 조건 분기 (Diamond 별칭 포함) | 마름모 벡터 |
| **Terminator** | 180×90, R45 | 시작/종료 (Pill/Capsule 별칭 포함) | 캡슐형 |
| **Branch** | 180×90, R0 (+ 변형별 자체 규격) | 분기 마크 (Bridge 별칭 포함) | 6종 변형(아래) |

**Branch 변형** (`BRANCH_VARIANT_ORDER`): CHECK / CROSS / TAG(64×32, R16) / SQUARE / DIAMOND(40×40) / CIRCLE.
구형 Yes/No/True/False 칩은 TAG로 읽음 (하위 호환).

**노드 분류 (Capability Matrix):** Screen(화면 카드) / Shape(도형: Process·Decision·Terminator) / Bridge(연결·분기: Junction·Branch) / FigmaObject(일반 객체).
카테고리별로 Title·Description·Status·StepBadge·Elevation·Size·FigmaLink·Style 지원 여부가 다름 (`OPTION_CAPABILITY_MATRIX`).

### 2.2 노드 생성·수정

- **생성** (`CREATE_FLOW_NODE` → `createFlowNode()`): 타입별 FRAME 카드 생성, 제목/설명 텍스트 노드 내장, 폰트 사전 로드(`loadRequiredFonts`), 태그 자동 넘버링(`getNextFlowTag`).
- **수정** (`UPDATE_FLOW_NODE` → `updateFlowNode()`, 일괄 `batchUpdateFlowNodes()`): 제목·설명·타입·색상 패치. 타입 전환 시 외형 실시간 변환.
- **리사이즈** (`RESIZE_NODE` → `resizeNode()`): W/H 직접 지정. Screen 전용 게이트는 UI 레벨에서 제어.
- **선택 동기화** (`SELECTION_CHANGED` → `handleSelectionChange()`): 캔버스 선택 변경 시 UI 패널에 노드 정보·상태·연결 현황 푸시. 단일/복수(혼합) 선택 모두 대응.
- 노드 식별은 `pluginData` 태그 기반 (`is_flow_node=true` + `node_type`). **태그가 유지되는 한 복사·붙여넣기된 노드도 Flooow 노드로 인식** (파일 간 이동 가능).

### 2.3 제목·설명 (DescriptionSection)

- 제목(13px 550) + 설명(11px) 인라인 편집. 설명은 자동 줄바꿈·말줄임(`updateDescTextTruncation`).
- 복사 버튼 (클립보드 복사), 비어 있음 안내 툴팁.
- Screen 외 타입은 비활성 (Capability Matrix).

### 2.4 타입 전환 (TypeSection)

- 6종 + Branch 변형 칩 선택 UI. 전환 시 기존 제목/스펙 유지, 외형만 변환.
- 복수 선택 시 혼합 상태(`Mixed`) 표시, 일괄 전환 지원.

---

## 3. 커넥터 (Connector)

### 3.1 직각 벡터 커넥터 엔진 (`customConnector.ts`)

- Figma 네이티브 커넥터를 우회하고 **벡터 네트워크(VectorNetwork)로 90도 직각 경로를 직접 생성** (`buildVectorNetwork`, `calculateOrthogonalPoints`).
- 박스 회피(`doesPathCrossBoxes`), 불필요한 꺾임 제거(`simplifyOrthogonalPoints`), 최적 자석쌍 탐색(`getOptimalMagnetPair`).
- 노드 이동 시 `syncConnectorsForMovedNodes()`로 연결선 자동 추종 (드래그 동기화 게이트 내장).
- 단자(Terminal) 렌더링 규격 고정: BAR 길이 `max(7, w×4.8)` / SQUARE 한 변 `max(6, w×3.5)` / DIAMOND 반지름 `max(3.8, w×2.6)`. 대각선 세그먼트 금지, Region Fill 필수.

### 3.2 연결 방식

| 방식 | 액션 | 설명 |
|---|---|---|
| 점-점 연결 | `CONNECT_POINTS` → `connectPoints()` | 출발 노드 자석 + 도착 노드 자석 지정, 단건 정밀 연결 |
| 자동 연결 | `AUTO_CONNECT_SELECTED` → `autoConnectSelected()` | 2개 이상 선택 시 공간 정렬 후 순차 연결 (N-1개 원자 승인) |
| 체인 연결 | `CONNECT_CHAIN` → `connectChain()` | 명시적 pair 목록 기반 일괄 연결 |
| 기즈모 연결 | ConnectSection + `gizmoState` | 출발/도착 단자 프리뷰(고스트) + 자석 유지(`magnetKeep`) |

### 3.3 커넥터 속성

- **선 종류:** ELBOWED(직각) / STRAIGHT(직선) — `SET_CONNECTOR_LINE_TYPE`, 전체 일괄 전환 `CONVERT_ALL_CONNECTORS_TO_ELBOWED`.
- **라우팅:** ORTHOGONAL / S_CURVE / CURVED / STRAIGHT (`ConnectorRoutingType`).
- **선 패턴:** SOLID / DASHED / DOTTED. **두께:** 0~10 (소수 지원).
- **단자:** NONE / ARROW / CIRCLE / DIAMOND / TRIANGLE_ARROW / REVERSED_TRIANGLE_ARROW. 시작/종료 각각 지정 + 오프셋.
- **색상:** `ConnectorColorModal` (HEX + 프리셋 + None). 라벨 박스 색상과 연동.
- **라벨:** 중앙 텍스트 라벨 (`UPDATE_CONNECTOR_LABEL`). 박스 스타일(BOX/CAPSULE/ROUNDED_BOX/LINE), 정렬(LEFT/CENTER/RIGHT), 채우기/외곽선 색상, 단독 색상 모달. 라벨 프레임(`ConnectorLabel`)은 카운트에서 제외.
---

## 4. 어피어런스 (Appearance 탭)

### 4.1 Size (SizeSection + SizeModal)

- **편집 항목:** Width / Height / Corner Radius 수치 입력 + Height Mode 드롭다운(Fixed / Hug / Fit) + Size Preset 칩.
- **제약:** W 49~800px, H 49~600px, R 0~20px (`SCREEN_NODE_CONSTRAINTS`, clamp 함수).
- **Screen 전용:** Screen 외 타입은 UI 유지 + 비활성(disabled) 렌더링 (UI3 비활성 토큰, 배경 유지).
- **Preset 해제 원칙:** Preset 적용 후 수동 수정 시 선택 즉시 해제. 프로그램 갱신 시에는 유지.
- **입력 보호:** 타이핑 중인 필드는 외부 동기화가 덮어쓰지 않음 (`activeElement` 가드).
- **Size Preset (기본 4종, 수정/삭제 잠금):**

| 프리셋 | W×H | 모드 |
|---|---|---|
| Default | 250×90 | hug |
| Square | 180×180 | fixed |
| Web (16:9) | 320×180 | fixed |
| Mobile (9:16) | 160×280 | fixed |

- **커스텀 프리셋:** SizeModal(Add/Edit)로 추가·수정·삭제. 로컬 + Core 이중 저장 (envelope + `savedAt` newer-wins). 툴팁은 치수만 표시 (`{w}×{h}`, 예: `375×812` — 이름 제외).

### 4.2 Style (StyleSection + StyleModal)

- **편집 항목:** Fill(채우기) / Stroke(외곽선, 색+두께) / 테마 토글(`TOGGLE_NODE_THEME` — 라이트/다크 반전).
- **기본 프리셋 2종** (White / Black, 수정/삭제 잠금). **커스텀 최대 7개** (`MAX_CUSTOM_STYLE_PRESETS`).
- 구형 다채색 기본 프리셋(Red/Coral/Orange/Pink/Purple)은 로드 시 자동 필터링 (legacy 제외).
- 색상 모달 3종 (Fill / Stroke / Connector): HEX 입력(3자리 확장 지원) + 컬러휠 + 스타일 프리셋 그리드 + None(투명) 지원.
- 값 일치 시 프리셋 자동 매칭 표시 (단일·복수·Undo 동기화 공유 판정식).

### 4.3 Status (StatusSection — Node 탭에 배치)

- **8단계 워크플로 상태:** Draft(#9CA3AF) / Wireframe(#6B7280) / In Progress(#3B82F6) / In Review(#FF9E42) / Revision(#F24822) / Approved(#8B5CF6) / Ready for Dev(#16A34A) / Done(#374151).
- 노드 상단 상태 뱃지로 렌더링 (배경색 + 흰색 텍스트). 설정·해제 토글.
- 복수 선택 시 혼합 상태 표시, 일괄 적용.

### 4.4 Step Badges (StepBadgesSection — Node 탭에 배치)

- 스텝 번호 뱃지 (시작 번호 지정 → 선택 노드 순서대로 부여).
- 모서리 위치(TL/TR/BL/BR) + 모양 + 색상 모드(White/Black/Style 연동).
- 추가(`ADD_STEP_BADGES`) / 제거(`REMOVE_STEP_BADGES`). 고채도 배경 시 텍스트색 자동 보정.

### 4.5 Elevation (ElevationSection)

- **5단계 그림자:** E100 Shapes / E200 Stickies·Comments / E300 Tooltips / E400 Menus·Panels / E500 Modals·Dialogs.
- 토글 스위치 + 카드 선택 UI. 라이트/다크별 그림자 값 (`getElevationEffects`).
- 카드 호버 시 툴팁 없음 (의도적 제거). 접근성 `aria-label` 유지.

---

## 5. 연결 패널 (Connection 탭)

- **ConnectSection:** 출발/도착 노드 기즈모 카드, 단자(TOP/BOTTOM/LEFT/RIGHT) 선택, 연결 실행·상태 표시 (기존 연결 수, pair 완성도, 체인 누락 수).
- **LabelSection:** 커넥터 라벨 텍스트 입력 + 정렬 + 박스 스타일 + 색상.
- **LinkSection / FigmaLinkSection(Node 탭):** Reference Link — 외부 URL을 노드에 첨부. Figma 디자인 파일 URL이면 프레임 피커(`FigmaDesignPickerModal`)로 화면 선택 → 노드 태그에 바인딩, 클릭 시 원본 화면으로 점프. Personal Access Token + 파일 URL 설정 저장 (`SAVE_SETTINGS` / `LOAD_SETTINGS`, `clientStorage`: `figma_token`, `figma_file_url`).

---

## 6. Export / 설정

- **Flow Export** (`flowExport.ts`, 스키마 v1.0): 보드 전체 or 선택 범위 → JSON 다운로드 / AI용 텍스트 복사 (`FLOW_EXPORTED`).
  - 노드(제목·설명·상태·타입·좌표) + 엣지(출발→도착) 구조화. 순환 경로 가드, 중복 제목 구분(`Login (2)`), 고립 노드 분리 섹션.
- **SettingsModal:** Export 범위 선택, 플랜/사용량 표시, 언어 전환.
- **UI3 변수 추출** (`EXTRACT_UI3_VARIABLES` → `extractUI3Variables()`): `figma.variables` feature-detection 후 디자인 토큰 추출.
- **Undo/Redo:** Figma 네이티브에 위임 (UI `UNDO`/`REDO` 액션은 의도적 no-op). 단, AppContext에 폼 단위 Undo 스냅샷(single/batch/connector) 별도 보유.
- **플러그인 창 자동 리사이즈** (`RESIZE_WINDOW`, `useAutoResize`): 팝오버·드롭다운은 높이 계산에서 제외 (깜빡임 방지).
---

## 7. 요금제 / 사용량 (Free 20개 게이트)

- **FREE 20개 제한** (`entitlementGate.ts` — `FREE_ELEMENT_LIMIT = 20`): 노드+커넥터 합산. 실측(`figma.root.findAll()` + 세션 델타) 기준.
- **게이트 위치 (신규 생성 4경로만):** 노드 생성 / 커넥터 생성 / 자동 연결 / 체인 연결. 초과 시 `limitReached` 토스트 + 생성 차단.
- **게이트가 걸리지 않는 것:** 기존 노드 수정·스타일 변경, Figma 네이티브 복사·붙여넣기 (플러그인을 거치지 않음). 붙여넣은 노드는 태그 유지 시 정상 인식·수정 가능. 단, 해당 파일 카운트에 합산되므로 이후 신규 생성·연결은 막힘.
- **파일별 분리:** 카운트 저장소(`figma.root` pluginData + `clientStorage` usage index)는 파일 단위. 다른 파일의 사용량은 합산되지 않음.
- **유료/개발:** `PAID_ACTIVE` (Figma Payments `PAID`), `DEV_ACTIVE` (지인 allowlist 4명, 무제한). `SubscriptionModal`에 사용량 미터·잔여 색상·업그레이드 CTA.
- **프리셋 저장소** (`presetStore.ts`): Style/Size 프리셋 envelope(`savedAt` + `items`). Core `clientStorage` + UI `localStorage` 이중화, newer-wins 병합.

---

## 8. UI 컴포넌트 일람

| 위치 | 컴포넌트 | 역할 |
|---|---|---|
| Node 탭 | TypeSection / DescriptionSection / StatusSection / StepBadgesSection / FigmaLinkSection | 타입·설명·상태·스텝·링크 |
| Appearance 탭 | SizeSection / StyleSection / ElevationSection | 크기·스타일·그림자 |
| Connection 탭 | ConnectSection / LabelSection (+ LinkSection) | 연결·라벨·링크 |
| 모달 (8종) | SizeModal / StyleModal / FillColorModal / StrokeColorModal / ConnectorColorModal / FigmaDesignPickerModal / SubscriptionModal / SettingsModal | 프리셋 편집·색상·디자인 선택·구독·설정 |
| 공용 | Switch / Tooltip(`data-tooltip`, 1000ms 진입) / SectionBlock / ColorWheelField / DropdownMixedItem / DisabledNotice / StylePresetColorGrid / icons | 토글·툴팁·섹션·색상·드롭다운·안내·아이콘 |
| 팝오버 | ContextMenu | 우클릭 메뉴 |

---

## 9. 검증 체계 (구현됨)

| 게이트 | 명령 | 상태 |
|---|---|---|
| 타입체크 | `npm run typecheck` | PASS 필수 |
| 빌드 | `npm run build:all` (build → build:ui → build:inject, 산출물 `dist/ui.html`) | PASS 필수 |
| 프로토콜 정합 | `npm run check:protocol` | KNOWN 10건 / NEW 0 (예상된 기존 불일치, Failure Memory `failures/0001` 기록) |
| 구조 제약 | `npm run check:constraints` | PASS (샌드박스 격리·DOM allowlist·dispatchEvent·window 상태) |
| CSS | `npm run check:css` | NEW 6건 (legacy-theme-selectors, 2026-10-11 기준 — 별도 정리 대상) |
| 테스트 | `npm run check:tests`, `npm test` (13개 스위트: chainOrder / gizmoState / connectButton / elementCount / entitlementGate / subscriptionStatus / planUsageTone / flooowUsage / i18n / magnetKeep / selectionMixed / presetStore / flowExport) | PASS |
| 일괄 | `npm run verify` | 위 전체 순차 실행 |
| 수동 | Figma 데스크톱 체크리스트 M1~M8 (`07-verification-gates.md`) | 릴리스 전 수행 |

---

## 10. 미구현 / 알려진 제한 (코드 기준)

- `PluginAction` 중 `CREATE_CONNECTORS`, `CREATE_TEMPLATE`은 union에만 있고 Core 미처리 (KNOWN).
- `CoreToUIMessage` 중 `STATUS_LIST_UPDATED`, `UI3_VARIABLES_EXTRACTED`, `SETTINGS_LOADED`, `TOAST`는 UI 미수신 (KNOWN). `INIT_DONE`/`READY`/`SWITCH_TAB`은 union 미선언 (KNOWN). → 상세 `docs/harness-analysis/failures/0001-protocol-union-switch-drift.md`.
- FigJam 네이티브 노드(Sticky/CodeBlock/Table), Component/Instance는 플로우 노드로 사용하지 않음.
- `PRODUCT_SPEC.md`의 AI 스마트 정렬·연결, 평생 라이선스 등 기획 항목은 본 문서 기준 미구현 (기획서와 코드 불일치 시 코드가 정답).
