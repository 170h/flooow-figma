# Project Rules & Guidelines

## 1. UI 아이콘 영구 보존 및 사이즈 규칙
- **아이콘 사이즈**: UI에 적용되는 기본 아이콘 사이즈는 **24px (`width="24" height="24" viewBox="0 0 24 24"`)**입니다.
- **아이콘 절대 수정 금지**:
  - `StepBadgesSection`의 `BADGE_CORNERS` 4개 코너 위치 아이콘(Top-Left, Top-Right, Bottom-Left, Bottom-Right)과 `step-number-icon` 등 이미 적용 완료된 공식 SVG 아이콘은 **어떤 이유로도 임의로 다시 만들거나 수정/교체하지 마십시오.**

## 2. 디자인 및 텍스트 규칙
- text에 tracking(letter-spacing) 옵션은 부여하지 마십시오.
- 모든 코드 주석과 설명, 응답은 한국어로 작성하십시오.

## 3. 커넥터 SQUARE(사각 스타일) 단자 렌더링 규칙
- **대각선 세그먼트 절대 생성 금지**:
  - `customConnector.ts`의 `buildVectorNetwork`에서 SQUARE 단자 생성 시, 사각형의 외곽 4개 변(세그먼트 4개)으로만 구성해야 합니다.
  - 내부에 대각선(X자) 세그먼트(`vStart ↔ vStart+2`, `vStart+1 ↔ vStart+3`)를 추가하면 피그마 렌더링 시 사각형 중앙에 X자 스트로크가 그어지거나 면이 뚫린 구멍처럼 보이므로 **절대 추가하지 마십시오.**
- **면 채움(Region Fill) 필수 보장**:
  - SQUARE 단자는 외곽 4변을 루프로 묶은 `regions`(`windingRule: 'NONZERO'`)를 등록하고, `vector.fills = [{ type: 'SOLID', color: strokeColor }]`로 채워져야 내부가 투명해져 캔버스 도트 그리드가 비쳐 보이는 현상을 방지할 수 있습니다.

## 4. 커넥터 단자(Terminal) 크기 영구 고정 규칙 (임의 변경 절대 금지)
- `customConnector.ts`의 `buildVectorNetwork`에서 단자 크기 수식은 사각형/원형/마름모 간의 시각적 부피감(Visual Weight)이 완벽히 균형을 이루도록 확정된 값이므로 **어떤 이유로도 임의로 수정하거나 변경하지 마십시오.**
  1. **BAR (막대)**:
     - `barLen = Math.max(7, Math.round(strokeWeight * 4.8))` (기본 1.5px 기준 길이 약 7px)
  2. **SQUARE (사각형)**:
     - `sqSize = Math.max(6, Math.round(strokeWeight * 3.5))` (기본 1.5px 기준 한 변 6px, 6×6px 박스)
  3. **DIAMOND (마름모)**:
     - `diaRadius = Math.max(3.8, Math.round(strokeWeight * 2.6))` (기본 1.5px 기준 반지름 약 3.8~4px, 대각선 전폭 약 7.6~8px)
     - 마름모는 피그마 내장 Cap 대신 닫힌 루프와 Region Fill을 사용하는 커스텀 벡터 네트워크로 렌더링되어야 하며, 상기 반지름 수식을 유지해야 사각형(6px) 및 원형(직경 6px)과 시각적으로 동등한 크기로 보입니다.

## 5. UI 타이포그래피 및 폰트 굵기(Font Weight) 엄격 준수 규칙
- **피그마 UI3 공식 폰트 웨이트 토큰(`font / weight`) 단일 체계**:
  - 프로젝트 UI에 사용할 수 있는 폰트 굵기는 피그마 공식 디자인 시스템(UI3) 토큰에 따라 **450**과 **550**으로만 엄격히 정의되고 사용되어야 합니다.
    1. **`default` (450 / `--font-weight-default`)**:
       - 일반 본문 텍스트, 설명문, 모든 입력 필드(`input`, `textarea`, `placeholder`, `Mixed` 상태), 드롭다운 기본 항목 텍스트
    2. **`medium` (450 / `--font-weight-medium`)**:
       - 기본 레이블 및 텍스트 항목
    3. **`strong` (550 / `--font-weight-strong`)**:
       - 섹션 타이틀 및 헤더 라벨(`.section-title`, `.toggle-row-label`), 버튼 내부 텍스트, 칩 텍스트, 스크러버 라벨(W, H, R 등)
    4. **`heavy` (550 / `--font-weight-heavy`)**:
       - 모달 메인 헤더 타이틀, 강조 라벨, 주요 CTA 버튼
- **인라인 `style={{ fontWeight: ... }}` 임의 사용 엄격 금지**:
  - JSX 컴포넌트 내에 `fontWeight: 500` 등의 인라인 스타일을 임의로 주입하지 마십시오.
  - 폰트 굵기는 반드시 `styles.css`의 정규 클래스 또는 CSS 변수(`var(--font-weight-*)`)를 통해서만 통제되어야 합니다.
- **입력 필드(Input/Textarea) 및 Mixed 상태 굵기 규칙**:
  - 모든 `input`, `textarea` 및 `placeholder`(특히 `Mixed` 상태)의 폰트 굵기는 UI3 기본 토큰인 **`450 (default)`**을 준수합니다.

## 6. 드롭다운 및 팝오버 렌더링/이벤트 격리 영구 보존 규칙
- **로컬 `useState` 1차 격리 및 동기화 원칙**:
  - 모든 드롭다운(Phase, Size, Color, Terminal 등)은 컴포넌트 내부의 로컬 `useState`로 열림/닫힘을 1차 관리해야 하며, 전역 Context 상태의 직접 의존으로 인한 App 전체 리렌더링 폭풍을 차단해야 합니다.
  - 전역 닫기(`closeAllPopovers()`)와는 `useEffect`를 통해 양방향으로 안전하게 동기화합니다.
- **스크롤바 표시 완전 차단 및 4px 레이아웃 시프트 방지 원칙**:
  - `.tab-panels`의 스크롤바는 `scrollbar-width: none` 및 `::-webkit-scrollbar { display: none !important; width: 0 !important; }`로 완전 숨김 처리되어야 합니다.
  - 드롭다운/팝오버가 열렸을 때 스크롤바가 깜빡이며 생겨나 패널 폭을 좁히고 전체 UI를 좌측으로 밀어내는 레이아웃 시프트(Layout Shift)를 원천 차단합니다.
- **`useAutoResize` 창 크기 계산 간섭 완전 배제 원칙**:
  - 플로팅 팝오버/메뉴(`.popover-phase-select`, `.figma-dropdown-menu`, `.popover-context-menu`, `.size-mode-menu-popover`)는 플러그인 창 높이 계산(`getPluginIdealHeight`)에서 100% 제외되어야 합니다.
  - 드롭다운이 열렸다고 해서 `scrollHeight`가 팽창하여 피그마 윈도우 창 크기가 덜컥거리며 리사이즈(Flicker)되지 않도록 순수 정적 콘텐츠 요소들의 높이만 산출해야 합니다.
- **전역 클릭 및 외부 클릭(Click-Outside) 이벤트 전파 보호 규칙**:
  - 모든 드롭다운 래퍼에는 반드시 `.figma-dropdown-wrapper` 클래스를 부여하고, `App.tsx`의 `handleRootClick` 셀렉터에 등록하여 드롭다운 클릭 시 바깥 클릭으로 오인되어 즉시 닫히는 현상을 방지합니다.
  - 외부 클릭 감지(`mousedown`)는 `dropdownRef.current.contains(e.target)`을 철저히 검사하여 드롭다운 내부 클릭이 보호되어야 합니다.

## 7. 어피어런스 독점 아코디언 및 비동기 깜빡임(Flicker) 차단 규칙
- **Step Badges / Status / Elevation 3사 상호 배타적 아코디언(Exclusive Accordion) 원칙**:
  - `AppearancePanel` 내의 **Step Badges**, **Status**, **Elevation** 세 스위치는 **동시에 다 열리지 않고 오직 하나만 열리는 배타적 아코디언 방식**으로 동작해야 합니다.
  - 전역 상태 `activeAppearanceSection: 'stepBadges' | 'status' | 'elevation' | null`을 단일 진실 공급원(Single Source of Truth)으로 사용합니다.
  - 하나가 켜지면(열리면) 나머지 둘의 스위치와 옵션 바디는 즉시 닫히고, 피그마 노드에서도 타 속성 해제(`removeStepBadgesFromNodes()`, `applyStatusToNode('')`, `applyElevationToNodes(null)`) 및 `lastNodeConfig` 동기화가 이루어져야 합니다.
  - 이미 켜진 스위치를 다시 클릭해 끄면 세 섹션 모두 닫힌(`null`) 상태가 됩니다.
- **`userActionLockRef` 600ms 보호 메커니즘 필수 유지**:
  - 스위치 조작 시 `userActionLockRef.current = Date.now()`로 타임스탬프를 갱신합니다.
  - 사용자가 스위치를 조작한 직후 600ms 이내에는 피그마 백엔드로부터 도착하는 중간 비동기 응답(`SELECTION_CHANGED`)으로 로컬 열림/닫힘 상태를 덮어쓰지 않도록 차단하여, **열렸다가 찰나에 닫힌 뒤 다시 열리는 깜빡임(Flicker)**을 원천 차단합니다.
  - 단, 캔버스에서 다른 노드를 클릭하여 선택 ID가 변경된 경우(`isDifferentNode`)에는 락을 우회하여 새로운 노드의 상태로 즉시 동기화합니다.

## 8. 플러그인 창 높이 자동 조절(`useAutoResize`) 및 울찔(Jitter) 차단 규칙
- **콘텐츠 높이 이중 합산 절대 금지 원칙**:
  - `getPluginIdealHeight`에서 활성 패널(`activePanel`) 내부의 콘텐츠 높이(`contentH`) 산출 시, 자식 요소의 상대 Y 좌표는 반드시 패널 상단 기준(`childRect.bottom - panelRect.top + scrollTop`)으로 측정해야 합니다.
  - `el.offsetTop`을 직접 사용하면 최상위 컨테이너 기준 좌표가 들어가 상단 타이틀/탭 높이(약 77px)가 리턴문에서 이중으로 더해져 **푸터 위에 100~150px 이상의 거대한 빈 공간이 남는 버그가 발생하므로 절대 금지**합니다.
- **`ResizeObserver` 자기 참조(Root Observe) 피드백 루프 원천 차단**:
  - `ro.observe(root)`로 최상위 루트 윈도우(`#plugin-root`)를 관찰하면, 창 리사이즈가 일어날 때마다 옵저버가 다시 격발되어 **창이 0.1초 동안 2~3회 연타로 덜컥거리며 울찔(Jitter)거리는 현상**이 발생합니다.
  - `ResizeObserver`는 실제 콘텐츠가 변경되는 내부 탭 패널(`.tab-panel`)들만 관찰해야 합니다.
- **리사이즈 35ms 디바운스(Debounce) 필수 적용**:
  - `autoResizeWindow`는 `setTimeout(..., 35)` 디바운스를 적용하여, 토글 클릭/DOM 확장/리렌더링이 완전히 안정화된 후 **최종 높이로 단 1회만 `RESIZE_WINDOW` 메시지를 전송**해야 합니다.
- **플로팅 메뉴 완전 배제 원칙**:
  - `.popover-phase-select`, `.figma-dropdown-menu`, `.popover-context-menu`, `.popover-size-mode`, `.size-mode-menu-popover`는 플러그인 창 높이 계산에서 100% 제외되어야 합니다.

## 9. 레거시 명령형 DOM 조작 금지 및 React 선언적 렌더링 규칙
- **`useFigmaMessage.ts` 등 훅/리스너에서의 DOM 직접 조작 금지**:
  - `statusOptionsEl.classList.remove('active')`, `toggleEl.checked = false`, `tabNode?.classList.add('disabled')` 등 명령형으로 DOM 클래스나 checked를 직접 덮어쓰는 코드는 React의 가상 DOM 렌더링과 충돌하여 **요소가 깜빡이며 다시 형성되거나 상태가 꼬이는 버그**를 일으키므로 절대 작성하지 마십시오.
  - 노드 선택 변경 동기화는 반드시 React Context(`setUIState`, `setLastNodeConfig`, `setActiveAppearanceSection`)를 통해서만 이루어져야 합니다.
- **섹션 바디 조건부 렌더링 통일**:
  - `StatusSection`, `StepBadgesSection`, `LabelSection` 등 토글 섹션의 바디는 CSS 클래스 토글 방식 대신 React 조건부 렌더링(`{isSectionOpen && ( ... )}`)을 준수하여, 닫혀 있을 때 DOM 간섭을 배제하고 열릴 때 단 한 번에 온전히 렌더링되어야 합니다.

## 10. 스타일(Style) 프리셋 화이트/블랙 2종 영구 규격
- **기본 프리셋 단일 체계**:
  - 기본 스타일 프리셋(`DEFAULT_STYLE_PRESETS`)은 오직 **White**(`style-white`, `#ffffff`, stroke 1.5px `#000000`)와 **Black**(`style-black`, `#000000`, stroke 0px) 2종만 유지합니다.
  - 과거의 Red, Coral, Orange, Pink, Purple 등 다채색 기본 프리셋은 영구 삭제되었으며, 로컬 스토리지 캐시 로드 시에도 해당 legacy ID는 자동 필터링되어야 합니다.

## 11. 커넥터(Connector) 네이티브 추종 및 실시간 바인딩 보존 규칙
- **피그잼 네이티브 커넥터(`ConnectorNode`) 간섭 절대 금지 원칙**:
  - 피그잼 네이티브 커넥터는 캔버스에서 노드를 이동할 때 피그마 코어 엔진이 자체적으로 엔드포인트 스냅 및 실시간 추종을 100% 자동 처리합니다.
  - `documentchange` 등 노드 이동 이벤트에서 `conn.connectorStart` / `conn.connectorEnd`를 임의로 재할당하거나 강제 최적화(`optimizeNativeConnector` 등)를 시도하면 피그마 내부 바인딩이 손상되어 연결선이 풀리거나 사용자가 의도한 마그넷 연결이 파괴되므로 **절대 임의로 덮어쓰지 마십시오.**
- **커스텀 벡터 커넥터 추적 엔진 무결성 및 레지스트리 보장 원칙**:
  - `updateOrthogonalVectorConnector` 등 패스 재계산 함수에서 Bounding Box 산출 시 `allX`, `allY` 좌표 배열 선언이 누락되어 `ReferenceError` 런타임 에러가 발생하면 전체 커넥터 추적 엔진이 중단되므로 무결성을 반드시 유지해야 합니다.
  - 라벨이나 특수 마커가 없는 단일 `VectorNode` 커넥터 생성 시에도 `source_node_id`, `target_node_id`, `is_flow_connector`, `is_custom_connector`, `source_magnet`, `target_magnet` 등의 필수 `pluginData`를 빠짐없이 기록하여 `nodeToConnectorsMap` 레지스트리에 반드시 등록되어야 합니다.
  - 부모 컨테이너(Section, Group, Frame 등)가 드래그 이동될 때도 하위 자식 노드들에 연결된 커넥터까지 탐색 및 감지되어 위치가 정확히 갱신되어야 합니다.
- **커넥터 반전(`isReversed`) 시 엔드포인트 노드 바인딩 보존 원칙**:
  - 커넥터 반전(`isReversed: true`) 시 마그넷(`targetMagnet` ↔ `sourceMagnet`)만 바꾸고 노드 ID를 그대로 두면 시작 노드에 타깃 마그넷이 적용되어 연결이 꼬이거나 풀리므로, 반드시 `endpointNodeId`(`startEndpointNodeId` ↔ `endEndpointNodeId`)도 함께 상호 교체해야 합니다.

## 12. 노드 사이즈(Size) UI 활성/비활성 제어 및 피그마 UI3 표준 disabled 렌더링 규칙
- **Screen 타입 전용 편집 및 레이아웃 유지 원칙**:
  - Size 관련 UI(Width, Height, Corner Radius 인풋, Size Mode 드롭다운, Size Preset 칩)는 **Screen 타입에서만 활성화**되어 수정 가능합니다.
  - Process, Connector, Decision, Terminator, Branch 등 고정형 타입에서는 Size UI를 절대 숨기지 않고 기존 레이아웃을 유지한 채 **비활성화(disabled)** 상태로 표시합니다.
  - 타입 판별은 `normalizeNodeType(selectedNodes[0]?.flowNodeType) === 'Screen'` (단일) / `!summary.nodeType.isMixed && normalizeNodeType(summary.nodeType.value) === 'Screen'` (복수) / `normalizeNodeType(uiState.selectedNodeType) === 'Screen'` (미선택) 규칙을 엄격히 준수합니다.
- **피그마 UI3 공식 표준 disabled 렌더링 규격**:
  - 컨테이너 박스 전체에 `opacity: 0.35`를 주어 배경을 날리는 비표준 딤 방식은 엄격히 금지합니다.
  - 입력 필드(`.input-scrubber-box`) 및 드롭다운(`.size-mode-dropdown-btn`)의 **배경색(`var(--color-bg-secondary)`)과 박스 형태는 온전하게 보존**해야 합니다.
  - 라벨(`W`, `H`), 모서리 곡률 아이콘, 입력 텍스트, 드롭다운 텍스트 및 셰브론은 피그마 UI3 공식 비활성 토큰인 **`var(--color-text-tertiary, rgba(0, 0, 0, 0.4))`** 및 `-webkit-text-fill-color`로 감쇄하고, `pointer-events: none`, `cursor: default`, 호버/포커스 테두리 차단을 적용합니다.
- **Preset 적용 후 수동 수정 시 Preset 즉시 해제 원칙**:
  - Preset이 적용된 상태에서 사용자가 Width, Height, Corner Radius를 직접 입력(`onChange`)하거나 Size Mode를 변경(`selectSizeMode`)하면 `setSelectedSizePresetId(null)`을 호출하여 Preset 선택 상태를 즉시 해제합니다.
  - 반면 프로그램에 의한 크기 갱신(Fit Contents 자동 크기 계산, 노드 선택 변경 동기화, 타입 변경 등) 시에는 Preset을 해제하지 않고 유지해야 합니다.
- **인풋 입력 중 리렌더링 시 DOM 값 덮어쓰기 방지 원칙**:
  - `SizeSection`의 외부 동기화 `useEffect`에서는 현재 사용자가 포커스하여 타이핑 중인 입력 필드(`activeEl === wEl` 등)를 덮어쓰지 않도록 `(isDifferentNode || activeEl !== inputEl)` 가드를 반드시 유지하여 수치 입력이 끊기거나 이전 값으로 되돌아가지 않도록 보장합니다.




