# RectangleNode

> 출처: https://developers.figma.com/docs/plugins/api/RectangleNode/
> `node.type === "RECTANGLE"`

기본 사각형 도형입니다.

---

## 생성

```typescript
const rect = figma.createRectangle();
rect.name = 'Background';
rect.resize(200, 100);
rect.x = 50;
rect.y = 50;
figma.currentPage.appendChild(rect);
```

---

## 주요 속성

### 기본

| 속성 | 타입 | 설명 |
|------|------|------|
| `x`, `y` | `number` | 위치 |
| `width`, `height` | `number` [readonly] | 크기 |
| `rotation` | `number` | 회전각 |
| `fills` | `Paint[]` | 채움 |
| `strokes` | `Paint[]` | 테두리 선 |
| `strokeWeight` | `number` | 선 굵기 |
| `strokeAlign` | `'INSIDE' \| 'OUTSIDE' \| 'CENTER'` | 선 정렬 |
| `effects` | `Effect[]` | 이펙트 |

### 모서리 반경 (개별 설정 가능)

| 속성 | 타입 | 설명 |
|------|------|------|
| `cornerRadius` | `number \| typeof figma.mixed` | 전체 모서리 반경 |
| `topLeftRadius` | `number` | 좌상단 |
| `topRightRadius` | `number` | 우상단 |
| `bottomLeftRadius` | `number` | 좌하단 |
| `bottomRightRadius` | `number` | 우하단 |
| `cornerSmoothing` | `number` | 부드러움 (0~1) |

---

## 코드 예시

```typescript
// 채움 + 테두리 + 그림자가 있는 카드 배경
const card = figma.createRectangle();
card.resize(320, 200);
card.cornerRadius = 16;
card.cornerSmoothing = 0.6;
card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
card.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
card.strokeWeight = 1;
card.strokeAlign = 'INSIDE';
card.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.08 },
  offset: { x: 0, y: 2 },
  radius: 8,
  spread: 0,
  visible: true,
  blendMode: 'NORMAL'
}];

// 그라디언트 배경
const gradRect = figma.createRectangle();
gradRect.resize(300, 150);
gradRect.fills = [{
  type: 'GRADIENT_LINEAR',
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: [
    { position: 0, color: { r: 0.4, g: 0.2, b: 0.9, a: 1 } },
    { position: 1, color: { r: 0.1, g: 0.6, b: 1, a: 1 } }
  ]
}];
```
