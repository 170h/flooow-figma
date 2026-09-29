# 도형 노드 모음

> 출처: https://developers.figma.com/docs/plugins/api/nodes/
> EllipseNode / LineNode / PolygonNode / StarNode / VectorNode / BooleanOperationNode / GroupNode / SliceNode

---

## EllipseNode — `node.type === "ELLIPSE"`

원 또는 타원입니다.

```typescript
const ellipse = figma.createEllipse();
ellipse.resize(100, 100);  // 정원
ellipse.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
```

### 고유 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `arcData` | `ArcData` | 호(Arc) 데이터 — 부채꼴, 도넛 형태 제어 |

```typescript
// 반원 만들기
ellipse.arcData = {
  startingAngle: 0,
  endingAngle: Math.PI,
  innerRadius: 0
};

// 도넛(Ring) 만들기
ellipse.arcData = {
  startingAngle: 0,
  endingAngle: Math.PI * 2,
  innerRadius: 0.5  // 0~1, 내부 반경 비율
};
```

---

## LineNode — `node.type === "LINE"`

직선입니다. 실제 높이는 0이지만 strokeWeight로 두께를 표현합니다.

```typescript
const line = figma.createLine();
line.resize(200, 0);       // 200px 가로 선
line.strokeWeight = 2;
line.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
line.strokeCap = 'ROUND';  // 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL'
```

---

## PolygonNode — `node.type === "POLYGON"`

다각형입니다.

```typescript
const polygon = figma.createPolygon();
polygon.pointCount = 6;    // 정육각형
polygon.resize(100, 100);
polygon.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.8, b: 0.4 } }];
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `pointCount` | `number` | 꼭짓점 수 (최소 3) |
| `cornerRadius` | `number` | 꼭짓점 반경 |

---

## StarNode — `node.type === "STAR"`

별 모양입니다.

```typescript
const star = figma.createStar();
star.pointCount = 5;        // 꼭짓점 수
star.innerRadius = 0.4;     // 내부 반경 비율 (0~1)
star.resize(100, 100);
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `pointCount` | `number` | 꼭짓점 수 |
| `innerRadius` | `number` | 내부 반경 비율 |
| `cornerRadius` | `number` | 꼭짓점 반경 |

---

## VectorNode — `node.type === "VECTOR"`

펜 툴 등으로 그린 벡터 패스입니다.

```typescript
const vector = figma.createVector();
// vectorNetwork로 직접 경로 정의 가능 (고급)
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `vectorNetwork` | `VectorNetwork` | 벡터 네트워크 데이터 (정점·세그먼트·리전) |
| `vectorPaths` | `VectorPaths` | SVG 경로 데이터 (단순 표현) |
| `handleMirroring` | `HandleMirroring \| typeof figma.mixed` | 핸들 미러링 방식 |

---

## BooleanOperationNode — `node.type === "BOOLEAN_OPERATION"`

Union, Subtract, Intersect, Exclude 연산의 결과 노드입니다.

```typescript
const shape1 = figma.createRectangle();
const shape2 = figma.createEllipse();
// ...배치 설정...

const boolOp = figma.createBooleanOperation();
boolOp.booleanOperation = 'UNION'; // 'UNION' | 'INTERSECT' | 'SUBTRACT' | 'EXCLUDE'
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `booleanOperation` | `'UNION' \| 'INTERSECT' \| 'SUBTRACT' \| 'EXCLUDE'` | 연산 타입 |
| `children` | `SceneNode[]` | 연산에 참여하는 자식 노드들 |

---

## GroupNode — `node.type === "GROUP"`

레이어들의 논리적 그룹입니다. Auto Layout이 없으며 크기는 자식들에 의해 자동 결정됩니다.

```typescript
// 여러 노드 그룹으로 묶기
const group = figma.group([rect1, rect2, text], figma.currentPage);
group.name = 'Card Group';

// 그룹 해제
figma.ungroup(group);
```

| 속성 | 타입 | 설명 |
|------|------|------|
| `children` | `SceneNode[]` [readonly] | 그룹 내 노드들 |
| `clipsContent` | `boolean` | 클리핑 여부 (false) |

---

## SliceNode — `node.type === "SLICE"`

내보내기 전용의 보이지 않는 영역 정의 노드입니다.

```typescript
const slice = figma.createSlice();
slice.resize(300, 200);
slice.x = 100;
slice.y = 100;
// 내보내기 설정
slice.exportSettings = [{ format: 'PNG', constraint: { type: 'SCALE', value: 2 } }];
```
