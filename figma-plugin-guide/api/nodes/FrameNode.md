# FrameNode

> 출처: https://developers.figma.com/docs/plugins/api/FrameNode/
> `node.type === "FRAME"`

프레임은 Figma Design의 핵심 컨테이너입니다. Auto Layout, 클리핑, 컴포넌트의 기반이 됩니다.

---

## 생성

```typescript
const frame = figma.createFrame();
frame.name = 'Card';
frame.resize(320, 200);
figma.currentPage.appendChild(frame);
```

---

## 주요 속성

### 레이아웃 / 크기

| 속성 | 타입 | 설명 |
|------|------|------|
| `x`, `y` | `number` | 위치 |
| `width`, `height` | `number` [readonly] | 크기 (`resize()`로 변경) |
| `rotation` | `number` | 회전각 (도) |
| `clipsContent` | `boolean` | 자식 노드를 프레임 경계로 클리핑 여부 |

### Auto Layout

| 속성 | 타입 | 설명 |
|------|------|------|
| `layoutMode` | `'NONE' \| 'HORIZONTAL' \| 'VERTICAL'` | Auto Layout 방향 |
| `layoutWrap` | `'NO_WRAP' \| 'WRAP'` | 줄 바꿈 |
| `primaryAxisSizingMode` | `'FIXED' \| 'AUTO'` | 주축 크기 방식 |
| `counterAxisSizingMode` | `'FIXED' \| 'AUTO'` | 교차축 크기 방식 |
| `primaryAxisAlignItems` | `'MIN' \| 'CENTER' \| 'MAX' \| 'SPACE_BETWEEN'` | 주축 정렬 |
| `counterAxisAlignItems` | `'MIN' \| 'CENTER' \| 'MAX' \| 'BASELINE'` | 교차축 정렬 |
| `paddingLeft/Right/Top/Bottom` | `number` | 내부 여백 |
| `itemSpacing` | `number` | 자식 간격 |
| `counterAxisSpacing` | `number \| null` | 교차축 간격 (wrap 모드) |

### 자식 정렬 (개별 자식 노드에서 설정)

```typescript
// 자식 노드에서 설정
child.layoutAlign = 'STRETCH';   // 교차축 방향 늘리기
child.layoutGrow = 1;            // 주축 방향 늘리기 (flex-grow)
child.layoutPositioning = 'ABSOLUTE'; // 절대 위치 (Auto Layout 흐름에서 제외)
```

### 모서리 및 외형

| 속성 | 타입 | 설명 |
|------|------|------|
| `cornerRadius` | `number \| typeof figma.mixed` | 전체 모서리 반경 |
| `topLeftRadius` | `number` | 개별 모서리 |
| `topRightRadius` | `number` | 개별 모서리 |
| `bottomLeftRadius` | `number` | 개별 모서리 |
| `bottomRightRadius` | `number` | 개별 모서리 |
| `cornerSmoothing` | `number` | 모서리 부드러움 (0~1) |
| `fills` | `Paint[]` | 배경 채움 |
| `strokes` | `Paint[]` | 테두리 선 |
| `strokeWeight` | `number` | 선 굵기 |
| `effects` | `Effect[]` | 그림자·블러 등 이펙트 |

### 자식 노드

```typescript
frame.children       // 자식 배열
frame.appendChild(node)
frame.insertChild(0, node)
frame.findAll(cb)
frame.findOne(cb)
```

---

## 코드 예시

```typescript
// Auto Layout 카드 컴포넌트 생성
const card = figma.createFrame();
card.name = 'Card';
card.layoutMode = 'VERTICAL';
card.paddingLeft = 16;
card.paddingRight = 16;
card.paddingTop = 16;
card.paddingBottom = 16;
card.itemSpacing = 8;
card.cornerRadius = 12;
card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
card.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.1 },
  offset: { x: 0, y: 4 },
  radius: 12,
  spread: 0,
  visible: true,
  blendMode: 'NORMAL'
}];

// 제목 텍스트 추가
const title = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
title.fontName = { family: 'Inter', style: 'Bold' };
title.fontSize = 18;
title.characters = '카드 제목';
card.appendChild(title);

figma.currentPage.appendChild(card);
```
