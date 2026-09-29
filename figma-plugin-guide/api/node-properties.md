# 공유 노드 속성 (Shared Node Properties)

> 출처: https://developers.figma.com/docs/plugins/api/node-properties/

모든 또는 여러 노드 타입에서 공유하는 속성들입니다.

---

## 모든 노드 공통 (`BaseNodeMixin`)

| 속성 | 타입 | 설명 |
|------|------|------|
| `id` | `string` [readonly] | 노드 고유 ID |
| `name` | `string` | 레이어 이름 |
| `type` | `NodeType` [readonly] | 노드 타입 문자열 |
| `parent` | `BaseNode \| null` [readonly] | 부모 노드 |
| `removed` | `boolean` [readonly] | 삭제된 노드 여부 |

```typescript
console.log(node.id);     // "123:456"
console.log(node.name);   // "Button"
console.log(node.type);   // "FRAME"
node.name = '새 이름';
```

---

## 씬 노드 공통 (`SceneNodeMixin`)

| 속성 | 타입 | 설명 |
|------|------|------|
| `visible` | `boolean` | 레이어 패널 표시 여부 |
| `locked` | `boolean` | 잠금 여부 |
| `opacity` | `number` | 불투명도 (0~1) |
| `blendMode` | `BlendMode` | 블렌딩 모드 |
| `isMask` | `boolean` | 마스크 여부 |
| `effects` | `Effect[]` | 이펙트 배열 (그림자, 블러 등) |
| `effectStyleId` | `string` | 이펙트 스타일 ID |
| `exportSettings` | `ExportSettings[]` | 내보내기 설정 |

---

## 레이아웃 관련 (`LayoutMixin`)

| 속성 | 타입 | 설명 |
|------|------|------|
| `x` | `number` | 부모 기준 X 좌표 |
| `y` | `number` | 부모 기준 Y 좌표 |
| `width` | `number` [readonly] | 너비 |
| `height` | `number` [readonly] | 높이 |
| `absoluteTransform` | `Transform` [readonly] | 캔버스 기준 절대 변환 행렬 |
| `absoluteBoundingBox` | `Rect \| null` [readonly] | 캔버스 기준 절대 바운딩 박스 |
| `rotation` | `number` | 회전각 (도, -180~180) |
| `constrainProportions` | `boolean` | 비율 고정 여부 |

```typescript
node.x = 100;
node.y = 50;
node.resize(200, 100);  // 크기 변경 (width/height는 readonly, resize 사용)
node.rotation = 45;
```

### 크기 관련 메서드

```typescript
node.resize(width, height)                 // 크기 변경
node.resizeWithoutConstraints(w, h)        // 제약 없이 크기 변경
node.rescale(scale)                        // 비율 스케일 (텍스트 포함)
```

---

## 채움 및 선 (`GeometryMixin`)

| 속성 | 타입 | 설명 |
|------|------|------|
| `fills` | `Paint[] \| typeof figma.mixed` | 채움 목록 |
| `strokes` | `Paint[]` | 선 목록 |
| `strokeWeight` | `number \| typeof figma.mixed` | 선 굵기 |
| `strokeAlign` | `'INSIDE' \| 'OUTSIDE' \| 'CENTER'` | 선 정렬 |
| `strokeCap` | `StrokeCap` | 선 끝 모양 |
| `strokeJoin` | `StrokeJoin` | 선 꺾임 모양 |
| `dashPattern` | `number[]` | 점선 패턴 |
| `fillStyleId` | `string` | 채움 스타일 ID |
| `strokeStyleId` | `string` | 선 스타일 ID |

```typescript
// 단색 채움
rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];

// 그라디언트 채움
rect.fills = [{
  type: 'GRADIENT_LINEAR',
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: [
    { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
    { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } }
  ]
}];

// 선 설정
rect.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
rect.strokeWeight = 2;
rect.strokeAlign = 'OUTSIDE';
```

---

## 코너 반경 (`CornerMixin`)

| 속성 | 타입 | 설명 |
|------|------|------|
| `cornerRadius` | `number \| typeof figma.mixed` | 전체 모서리 반경 |
| `cornerSmoothing` | `number` | 모서리 부드러움 (0~1, 애플 스타일) |

```typescript
rect.cornerRadius = 8;
// 개별 설정 (RectangleNode만)
rect.topLeftRadius = 8;
rect.topRightRadius = 0;
```

---

## 자식 노드 (`ChildrenMixin`)

| 속성/메서드 | 설명 |
|-----------|------|
| `children` [readonly] | 자식 노드 배열 |
| `appendChild(node)` | 마지막에 자식 추가 |
| `insertChild(index, node)` | 특정 위치에 자식 삽입 |
| `findAll(cb?)` | 조건에 맞는 모든 하위 노드 반환 |
| `findOne(cb?)` | 조건에 맞는 첫 번째 하위 노드 반환 |
| `findAllWithCriteria(criteria)` | 기준에 맞는 하위 노드 반환 |

```typescript
// 하위의 모든 텍스트 노드 찾기
const textNodes = frame.findAll(n => n.type === 'TEXT');

// 이름으로 노드 찾기
const btn = frame.findOne(n => n.name === 'Button');

// 타입으로 빠르게 찾기
const allFrames = page.findAllWithCriteria({ types: ['FRAME'] });
```

---

## Auto Layout (`AutoLayoutMixin`)

FrameNode에서만 사용 가능합니다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `layoutMode` | `'NONE' \| 'HORIZONTAL' \| 'VERTICAL'` | Auto Layout 방향 |
| `primaryAxisSizingMode` | `'FIXED' \| 'AUTO'` | 주축 크기 방식 |
| `counterAxisSizingMode` | `'FIXED' \| 'AUTO'` | 교차축 크기 방식 |
| `primaryAxisAlignItems` | `'MIN' \| 'CENTER' \| 'MAX' \| 'SPACE_BETWEEN'` | 주축 정렬 |
| `counterAxisAlignItems` | `'MIN' \| 'CENTER' \| 'MAX' \| 'BASELINE'` | 교차축 정렬 |
| `paddingLeft/Right/Top/Bottom` | `number` | 내부 여백 |
| `itemSpacing` | `number` | 항목 간격 |
| `layoutWrap` | `'NO_WRAP' \| 'WRAP'` | 줄 바꿈 여부 |

```typescript
const frame = figma.createFrame();
frame.layoutMode = 'HORIZONTAL';
frame.paddingLeft = 16;
frame.paddingRight = 16;
frame.paddingTop = 8;
frame.paddingBottom = 8;
frame.itemSpacing = 8;
frame.primaryAxisSizingMode = 'AUTO';
frame.counterAxisSizingMode = 'AUTO';
frame.counterAxisAlignItems = 'CENTER';
```

---

## 플러그인 데이터 (`PluginDataMixin`)

| 메서드 | 설명 |
|--------|------|
| `getPluginData(key)` | 이 플러그인이 저장한 데이터 읽기 |
| `setPluginData(key, value)` | 이 플러그인의 데이터 저장 |
| `getPluginDataKeys()` | 이 플러그인이 저장한 키 목록 |
| `getSharedPluginData(namespace, key)` | 다른 플러그인도 읽을 수 있는 데이터 읽기 |
| `setSharedPluginData(namespace, key, value)` | 공유 데이터 저장 |

```typescript
// 노드에 메타데이터 저장
node.setPluginData('flowType', 'decision');
node.setPluginData('metadata', JSON.stringify({ created: Date.now() }));

// 데이터 읽기
const flowType = node.getPluginData('flowType');
const meta = JSON.parse(node.getPluginData('metadata') || '{}');
```

---

## 내보내기 (ExportMixin)

```typescript
// 노드를 PNG로 내보내기
const bytes = await node.exportAsync({
  format: 'PNG',
  constraint: { type: 'SCALE', value: 2 }  // 2x 해상도
});

// SVG로 내보내기
const svg = await node.exportAsync({ format: 'SVG' });

// PDF로 내보내기
const pdf = await node.exportAsync({ format: 'PDF' });
```
