# Plugin API 레퍼런스 (API Reference)

> 출처: https://developers.figma.com/docs/plugins/api/api-reference/

---

## API 레퍼런스 구조

Plugin API는 4개의 주요 섹션으로 구성됩니다:

```
Plugin API
├── Global Objects    ← figma 글로벌 객체 및 하위 API
├── Node Types        ← 캔버스의 레이어 타입들
├── Shared Node Properties ← 노드 공통 속성
└── Data Types        ← TypeScript 타입/인터페이스 정의
```

---

## 1. Global Objects (글로벌 객체)

### `figma` 글로벌 객체

Plugin API의 **진입점**. `code.ts`에서 바로 사용 가능합니다.

```typescript
// 예시: 현재 페이지에 직사각형 생성
const rect = figma.createRectangle();
rect.x = 100;
rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
figma.currentPage.appendChild(rect);
figma.closePlugin();
```

#### General 프로퍼티

| 프로퍼티 | 타입 | 설명 |
|---------|------|------|
| `apiVersion` | `'1.0.0'` [readonly] | manifest.json의 API 버전 |
| `fileKey` | `string \| undefined` [readonly] | 현재 파일의 키 (비공개 플러그인만 접근 가능) |
| `command` | `string` [readonly] | 현재 실행 중인 manifest 커맨드 |
| `pluginId` | `string?` [readonly] | manifest의 "id" 값 |
| `editorType` | `'figma' \| 'figjam' \| 'dev' \| 'slides' \| 'buzz'` [readonly] | 현재 에디터 타입 |
| `mode` | `'default' \| 'textreview' \| 'inspect' \| 'codegen' \| 'linkpreview' \| 'auth'` [readonly] | 플러그인 실행 컨텍스트 |
| `skipInvisibleInstanceChildren` | `boolean` | true면 인스턴스 내 숨겨진 자식 노드를 탐색에서 제외 (성능 향상) |
| `currentPage` | `PageNode` | 사용자가 현재 보고 있는 페이지 (쓰기 가능) |
| `root` | `DocumentNode` [readonly] | 문서 전체 루트 |

#### UI 관련

| 메서드/프로퍼티 | 설명 |
|--------------|------|
| `showUI(html, options?)` | UI iframe 생성 |
| `ui` ([UIAPI](https://developers.figma.com/docs/plugins/api/figma-ui/)) | UI iframe과 통신 (`postMessage`, `onmessage` 등) |

#### 하위 API 객체

| 프로퍼티 | 타입 | 용도 |
|---------|------|------|
| `ui` | `UIAPI` | UI 통신 (postMessage, show/hide) |
| `util` | `UtilAPI` | 편의 함수 모음 |
| `constants` | `ConstantsAPI` | 상수 값 접근 |
| `motion` | `MotionAPI` | 모션 애니메이션 스타일 읽기 |
| `timer` | `TimerAPI?` | FigJam 전용 타이머 제어 |
| `viewport` | `ViewportAPI` | 뷰포트(보기 영역) 읽기/설정 |
| `clientStorage` | `ClientStorageAPI` | 로컬 영속 데이터 저장 |
| `parameters` | `ParametersAPI` | 파라미터 모드 입력 처리 |
| `payments` | `PaymentsAPI?` | 결제 기능 (manifest 권한 필요) |
| `variables` | `VariablesAPI` | 변수(토큰) 읽기/생성 |
| `teamLibrary` | `TeamLibraryAPI` | 팀 라이브러리 접근 |
| `annotations` | `AnnotationsAPI` | 어노테이션 관리 |

#### 노드 생성 메서드 (figma.create*)

```typescript
figma.createRectangle()     // 사각형
figma.createEllipse()       // 원/타원
figma.createLine()          // 선
figma.createPolygon()       // 다각형
figma.createStar()          // 별
figma.createVector()        // 벡터
figma.createText()          // 텍스트
figma.createFrame()         // 프레임
figma.createComponent()     // 컴포넌트
figma.createPage()          // 페이지
figma.createSlice()         // 슬라이스
figma.createBooleanOperation() // 불리언 연산
figma.createSticky()        // FigJam 스티키 노트
figma.createConnector()     // FigJam 커넥터
figma.createShapeWithText() // FigJam 텍스트 도형
figma.createTable()         // 테이블
figma.createImage(imageData)     // 이미지 (동기)
figma.createImageAsync(src)      // 이미지 (비동기)
figma.createNodeFromJSXAsync()   // JSX로 노드 생성
```

#### 노드 조작 메서드

```typescript
figma.group(nodes, parent)    // 그룹 생성
figma.ungroup(node)           // 그룹 해제
figma.flatten(nodes)          // 벡터로 병합(flatten)
figma.combineAsVariants(components, parent) // 배리언트 세트 생성
figma.transformGroup(nodes)   // TransformGroup으로 묶기
```

#### 기타 주요 메서드

```typescript
figma.notify(message, options?)       // 토스트 알림 표시
figma.closePlugin(message?)           // 플러그인 종료
figma.commitUndo()                    // 실행취소 히스토리에 체크포인트 추가
figma.saveVersionHistoryAsync(title)  // 버전 히스토리 저장
figma.openExternal(url)               // 외부 URL 열기
figma.loadFontAsync(fontName)         // 폰트 비동기 로드
figma.on(eventType, callback)         // 이벤트 리스너 등록
figma.off(eventType, callback)        // 이벤트 리스너 제거
figma.mixed                           // 다중 선택 시 "혼합(Mixed)" 상태 값
```

#### 클라이언트 스토리지 (영속 데이터)

```typescript
// 플러그인 설정 등 영속 데이터 저장
await figma.clientStorage.setAsync('key', value);
const value = await figma.clientStorage.getAsync('key');
await figma.clientStorage.deleteAsync('key');
const keys = await figma.clientStorage.keysAsync();
```

#### 이벤트 종류 (`figma.on(...)`)

| 이벤트 | 발생 시점 |
|--------|---------|
| `selectionchange` | 선택 변경 시 |
| `currentpagechange` | 현재 페이지 변경 시 |
| `close` | 플러그인 종료 시 |
| `documentchange` | 문서 변경 시 |
| `run` | 플러그인 시작 시 |
| `drop` | 드롭 이벤트 |

---

## 2. Node Types (노드 타입)

Figma의 모든 레이어는 **노드(Node)**로 표현됩니다.

### BaseNode 타입 계층

```typescript
type BaseNode =
  DocumentNode |   // 문서 루트
  PageNode     |   // 페이지
  SceneNode        // 캔버스 위의 모든 레이어
```

### SceneNode (캔버스 레이어)

```typescript
type SceneNode =
  // Figma Design 전용
  BooleanOperationNode | // 불리언 연산 (Union, Subtract 등)
  ComponentNode        | // 컴포넌트 마스터
  ComponentSetNode     | // 컴포넌트 세트 (배리언트 컨테이너)
  EllipseNode          | // 원/타원
  FrameNode            | // 프레임 (Auto Layout 포함)
  GroupNode            | // 그룹
  InstanceNode         | // 컴포넌트 인스턴스
  LineNode             | // 선
  PolygonNode          | // 다각형
  RectangleNode        | // 사각형
  SectionNode          | // 섹션
  SliceNode            | // 슬라이스
  StarNode             | // 별
  TextNode             | // 텍스트
  TextPathNode         | // 패스 위 텍스트
  TransformGroupNode   | // Transform Group
  VectorNode           | // 벡터 (펜 툴 등)

  // FigJam 전용
  CodeBlockNode        | // 코드 블록
  ConnectorNode        | // 커넥터(화살표)
  EmbedNode            | // 임베드
  HighlightNode        | // 하이라이트
  LinkUnfurlNode       | // 링크 언펄
  MediaNode            | // 미디어
  ShapeWithTextNode    | // 텍스트 있는 도형
  StampNode            | // 스탬프
  StickyNode           | // 스티키 노트
  TableNode            | // 테이블
  TableCellNode        | // 테이블 셀
  WashiTapeNode        | // 와시 테이프

  // Slides 전용
  SlideNode            | // 슬라이드
  SlideRowNode         | // 슬라이드 행
  SlideGridNode        | // 슬라이드 격자
  SlotNode             | // 슬롯
  InteractiveSlideElementNode | // 인터랙티브 요소

  WidgetNode             // 위젯
```

### NodeType (node.type 문자열 값)

```typescript
// 노드를 탐색할 때 타입 가드로 사용
if (node.type === 'FRAME') {
  // FrameNode로 타입이 좁혀짐
  console.log(node.children);
}
if (node.type === 'TEXT') {
  // TextNode로 타입이 좁혀짐
  console.log(node.characters);
}
```

| 노드 타입 | `node.type` 값 | 설명 |
|----------|---------------|------|
| `FrameNode` | `"FRAME"` | 프레임 |
| `ComponentNode` | `"COMPONENT"` | 컴포넌트 |
| `ComponentSetNode` | `"COMPONENT_SET"` | 컴포넌트 세트 |
| `InstanceNode` | `"INSTANCE"` | 컴포넌트 인스턴스 |
| `RectangleNode` | `"RECTANGLE"` | 사각형 |
| `EllipseNode` | `"ELLIPSE"` | 원/타원 |
| `LineNode` | `"LINE"` | 선 |
| `VectorNode` | `"VECTOR"` | 벡터 |
| `TextNode` | `"TEXT"` | 텍스트 |
| `GroupNode` | `"GROUP"` | 그룹 |
| `BooleanOperationNode` | `"BOOLEAN_OPERATION"` | 불리언 연산 |
| `SectionNode` | `"SECTION"` | 섹션 |
| `PageNode` | `"PAGE"` | 페이지 |
| `DocumentNode` | `"DOCUMENT"` | 문서 |
| `ConnectorNode` | `"CONNECTOR"` | FigJam 커넥터 |
| `StickyNode` | `"STICKY"` | FigJam 스티키 |

---

## 3. 자주 쓰는 API 패턴

### 선택된 노드 처리

```typescript
const selection = figma.currentPage.selection;

for (const node of selection) {
  if (node.type === 'TEXT') {
    await figma.loadFontAsync(node.fontName as FontName);
    node.characters = '변경된 텍스트';
  }
}
```

### 페이지 전체 탐색

```typescript
function traverseNodes(node: BaseNode) {
  console.log(node.type, node.id);
  if ('children' in node) {
    for (const child of node.children) {
      traverseNodes(child);
    }
  }
}
traverseNodes(figma.root);
```

### UI와 통신

```typescript
// Core → UI
figma.ui.postMessage({ type: 'UPDATE', data: payload });

// Core에서 UI 메시지 수신
figma.ui.onmessage = (msg) => {
  if (msg.type === 'CREATE') {
    const frame = figma.createFrame();
    figma.currentPage.appendChild(frame);
    figma.closePlugin();
  }
};
```

### pluginData 저장

```typescript
// 노드에 커스텀 데이터 저장
node.setPluginData('myKey', JSON.stringify({ value: 42 }));

// 데이터 읽기
const data = JSON.parse(node.getPluginData('myKey') || '{}');

// 다른 플러그인도 읽을 수 있는 공유 데이터
node.setSharedPluginData('namespace', 'key', 'value');
```

---

## 4. 기타 리소스

| 항목 | 링크 |
|------|------|
| **Plugin Manifest** | [manifest.json 전체 필드 레퍼런스](https://developers.figma.com/docs/plugins/manifest/) |
| **Typings File** | [TypeScript 타입 정의 파일](https://developers.figma.com/docs/plugins/api/typings/) |
| **API Errors** | [에러 코드 레퍼런스](https://developers.figma.com/docs/plugins/api/api-errors/) |
| **TypeScript 설정** | [TypeScript 환경 설정 가이드](https://developers.figma.com/docs/plugins/typescript/) |
| **ESLint Plugin** | [eslint-plugin-figma-plugins](https://github.com/figma/eslint-plugin-figma-plugins) |

> 💡 **Tip**: TypeScript 타이핑 최신 버전 설치:
> ```bash
> npm install --save-dev @figma/plugin-typings
> ```
