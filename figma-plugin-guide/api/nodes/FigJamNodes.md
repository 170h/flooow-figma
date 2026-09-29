# FigJam 노드 모음

> 출처: https://developers.figma.com/docs/plugins/api/nodes/
> FigJam 전용 노드 타입들입니다. `figma.editorType === 'figjam'`일 때만 사용 가능합니다.

---

## StickyNode — `node.type === "STICKY"`

포스트잇 메모입니다.

```typescript
const sticky = figma.createSticky();
sticky.text.characters = '아이디어를 적어보세요!';
sticky.fills = [{ type: 'SOLID', color: { r: 1, g: 0.94, b: 0.4 } }]; // 노란색
figma.currentPage.appendChild(sticky);
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `text` | `TextNode` [readonly] | 내부 텍스트 노드 |
| `fills` | `Paint[]` | 배경 색상 |
| `authorVisible` | `boolean` | 작성자 표시 여부 |

---

## ShapeWithTextNode — `node.type === "SHAPE_WITH_TEXT"`

텍스트를 포함하는 도형입니다(다이아몬드, 원통 등).

```typescript
const shape = figma.createShapeWithText();
shape.shapeType = 'DIAMOND';
shape.text.characters = '결정';
figma.currentPage.appendChild(shape);
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `shapeType` | `ShapeWithTextType` | 도형 종류 |
| `text` | `TextNode` [readonly] | 내부 텍스트 |
| `fills` | `Paint[]` | 배경 색상 |

```typescript
type ShapeWithTextType =
  'SQUARE' | 'ELLIPSE' | 'ROUNDED_RECTANGLE' |
  'DIAMOND' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' |
  'PARALLELOGRAM_RIGHT' | 'PARALLELOGRAM_LEFT' |
  'ENG_DATABASE' | 'ENG_QUEUE' | 'ENG_FILE' |
  'ENG_FOLDER' | 'TRAPEZOID' | 'PREDEFINED_PROCESS' |
  'SHIELD' | 'DOCUMENT_SINGLE' | 'DOCUMENT_MULTIPLE' |
  'MANUAL_INPUT' | 'HEXAGON' | 'CHEVRON' | 'PENTAGON' |
  'OCTAGON' | 'STAR' | 'PLUS' | 'ARROW_LEFT' |
  'ARROW_RIGHT' | 'SUMMING_JUNCTION' | 'OR' |
  'SPEECH_BUBBLE' | 'INTERNAL_STORAGE';
```

---

## CodeBlockNode — `node.type === "CODE_BLOCK"`

코드 스니펫 블록입니다.

```typescript
const codeBlock = figma.createCodeBlock();
codeBlock.code = 'const x = figma.createRectangle();';
codeBlock.codeLanguage = 'TYPESCRIPT';
figma.currentPage.appendChild(codeBlock);
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `code` | `string` | 코드 내용 |
| `codeLanguage` | `CodeBlockLanguage` | 언어 (`'TYPESCRIPT'`, `'JAVASCRIPT'`, `'CSS'` 등) |

---

## TableNode / TableCellNode

표 형태의 정보를 나타냅니다.

```typescript
const table = figma.createTable(3, 4); // 3행 4열
table.name = '데이터 테이블';

// 셀 접근
const cell = table.cellAt(0, 0);  // (row, col)
cell.text.characters = '헤더 1';
```

| TableNode 속성 | 설명 |
|--------------|------|
| `numRows` [readonly] | 행 수 |
| `numColumns` [readonly] | 열 수 |
| `cellAt(row, col)` | 특정 셀 반환 |

---

## SectionNode — `node.type === "SECTION"` (FigJam & Figma)

노드들을 시각적으로 구역으로 묶습니다. 스티키나 프레임을 구역별로 정리할 때 사용합니다.

```typescript
const section = figma.createSection();
section.name = '아이디어 구역';
section.resizeWithoutConstraints(600, 400);
figma.currentPage.appendChild(section);

// 노드를 섹션 안으로 이동
section.appendChild(existingNode);
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `fills` | `Paint[]` | 배경 색상 |
| `devStatus` | `DevStatus \| null` | 개발 상태 (`'READY_FOR_DEV'`, `'COMPLETED'`) |
| `children` | `SceneNode[]` [readonly] | 내부 노드들 |
