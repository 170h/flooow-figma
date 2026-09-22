# UI Flow Diagram - 피그잼(FigJam) 전용 플러그인 개발 가이드

피그잼(FigJam)에서 외부 피그마 디자인 파일의 화면(프레임)들을 연동하여 노드로 생성하고, **상·하·좌·우 포인트를 마우스로 직접 끌어당겨(드래그) 직각 커넥터로 연결**할 수 있는 피그잼 전용 UI 플로우 다이어그램 플러그인입니다.

---

## 1. 주요 기능

- **피그잼 네이티브 마우스 드래그 연결 (100% 순정 경험)**
  - 생성된 노드에 마우스를 올리면 상·하·좌·우에 피그잼 파란색 자석 포인트가 즉시 활성화
  - 마우스로 포인트를 클릭한 채 쭉 끌어당겨(드래그 앤 드롭) 다른 노드에 놓으면 90도 직각 화살표가 자석처럼 착 연결
  - 키보드 단축키 `X` (Connector Tool)로도 자유로운 선 긋기 지원
- **피그마 디자인 파일 REST API 완전 연동**
  - 피그마 디자인 파일 URL과 Personal Access Token(무료)을 등록하면 원본 디자인 파일의 페이지와 프레임 목록 자동 로딩
  - 프레임 선택 시: **태그 ID = 피그마 프레임 네임** 자동 입력
  - 노드의 태그를 클릭하면 원본 피그마 디자인 화면으로 브라우저/앱 즉시 점프
- **라이트 / 다크 테마 지원**
  - 화이트 및 다크 모드 스타일 지원
- **표준 노드 규격 프리셋 (Size Presets)**
  - 캔버스 가독성과 그리드 정렬을 고려한 화면 비례(Aspect Ratio) 기반 노드 크기 지원
  - **Default** (`250×90px`), **Square** (`180×180px`), **Web** (`320×180px`, 16:9), **Mobile** (`160×280px`, 9:16)
  - 박스 리사이즈 시 텍스트 및 뱃지 크기는 고정되어 레이아웃 안정성 유지
- **플러그인 UI 원클릭 포인트 연결 & 출발 노드 지정 모드**
  - 캔버스 드래그 연결 외에도 플러그인 창에서 상/하/좌/우 방향을 지정하여 원클릭으로 정밀 연결 가능

---

## 2. 프로젝트 폴더 구조

```text
ui-flow-diagram/
├── manifest.json         # 피그마 플러그인 매니페스트 (이름, 권한, 진입점 정의)
├── package.json          # 프로젝트 의존성 및 빌드 스크립트 정의
├── tsconfig.json         # TypeScript 컴파일 설정
├── PRODUCT_SPEC.md       # 제품 기획, 비즈니스 모델 및 노드 아키텍처 명세서
├── DESIGN_SYSTEM_UI3.md  # 피그마 공식 UI3 디자인 시스템 및 컴포넌트 개발 가이드
├── README.md             # 프로젝트 개요 및 코어 개발 가이드
├── dist/
│   └── code.js           # esbuild로 번들링된 피그마 샌드박스 실행 코드
└── src/
    ├── code.ts           # 피그마 코어 백엔드 로직 (캔버스 노드 생성, 커넥터, 이벤트 감지)
    ├── types.ts          # 메시지 통신 프로토콜 및 데이터 타입 인터페이스 정의
    └── ui.html           # 플러그인 팝업 UI (HTML/CSS/JavaScript)
```

---

## 3. 개발 환경 설정 및 빌드

### 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn
- Figma 데스크톱 앱 (개발 테스트 권장)

### 패키지 설치
```bash
npm install
```

### 빌드 명령어

- **1회성 프로덕션 번들 빌드:**
  ```bash
  npm run build
  ```
- **실시간 파일 감시 및 자동 빌드 (개발 시 권장):**
  ```bash
  npm run watch
  ```
- **타입스크립트 타입 유효성 검사:**
  ```bash
  npm run typecheck
  ```

---

## 4. 피그마에서 플러그인 로드 및 디버깅

### 1) 매니페스트 등록 (최초 1회)
1. 피그마 데스크톱 앱 실행 후 임의의 디자인 파일을 엽니다.
2. 상단 메뉴에서 `Plugins` → `Development` → `Import plugin from manifest...`를 클릭합니다.
3. 프로젝트 루트의 [`manifest.json`](manifest.json) 파일을 선택합니다.
4. `Plugins` → `Development` 목록에 **`UI Flow Diagram`**이 등록됩니다.

### 2) 개발 중 실시간 새로고침 및 디버깅
- **코드 수정 반영:**
  - `npm run watch`가 켜져 있으면 `src/code.ts` 저장 시 `dist/code.js`가 자동 생성됩니다.
  - 피그마 플러그인 UI 팝업 창 안에서 **우클릭 → `Reload`**를 누르면 최신 코드가 즉시 반영됩니다.
  - 또는 캔버스 단축키 **`Option + Command + P`** (Mac 기준, 마지막 플러그인 재실행)를 누릅니다.
- **개발자 도구 콘솔 확인:**
  - 플러그인 UI 창을 우클릭하고 **`Inspect Element`**를 누르면 Chrome DevTools와 유사한 개발자 도구가 열려 `console.log` 및 네트워크/에러를 디버깅할 수 있습니다.

---

## 5. 핵심 아키텍처 및 API 개발 가이드

피그마 플러그인은 **두 개의 분리된 환경(샌드박스 코어와 UI iframe)**이 메시지를 주고받는 구조로 동작합니다.

### 1) 메인 스레드와 UI 스레드 간의 통신
- **UI → 메인 스레드 (`src/ui.html` → `src/code.ts`):**
  ```javascript
  parent.postMessage({
    pluginMessage: {
      type: 'CREATE_FLOW_NODE',
      payload: { title: 'Welcome', description: '메인 진입' }
    }
  }, '*');
  ```
- **메인 스레드 수신 (`src/code.ts`):**
  ```typescript
  figma.ui.onmessage = async (msg: PluginAction) => {
    if (msg.type === 'CREATE_FLOW_NODE') {
      await createFlowNode(msg.payload);
    }
  };
  ```
- **메인 스레드 → UI 전송 (`src/code.ts` → `src/ui.html`):**
  ```typescript
  figma.ui.postMessage({
    type: 'SELECTION_CHANGED',
    count: selection.length,
    nodes: [...]
  });
  ```

### 2) 필수 폰트 사전 로드 (`loadFontAsync`)
피그마에서 텍스트 노드의 `characters`를 변경하거나 신규 생성할 때는 반드시 해당 폰트가 사전에 로드되어 있어야 합니다:
```typescript
await Promise.all([
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
]);
```

### 3) 오토레이아웃 내 절대 위치(`ABSOLUTE`) 앵커 포인트
오토레이아웃 프레임 내부에서 상하좌우 모서리 중앙에 포인트를 붙일 때는 `layoutPositioning = 'ABSOLUTE'`와 `constraints`를 함께 사용합니다:
```typescript
dot.layoutPositioning = 'ABSOLUTE';
dot.constraints = { horizontal: 'CENTER', vertical: 'MIN' }; // 상단 중앙 고정
```

### 4) 피그마 공식 직교 커넥터(`ConnectorNode`) 생성
```typescript
const connector = figma.createConnector();
connector.connectorLineType = 'ELBOWED'; // 직각 꺾임 형태
connector.connectorStart = {
  endpointNodeId: sourceNode.id,
  magnet: 'RIGHT', // 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT'
};
connector.connectorEnd = {
  endpointNodeId: targetNode.id,
  magnet: 'LEFT',
};
connector.connectorEndStrokeCap = 'ARROW_EQUILATERAL'; // 화살표 머리
```
