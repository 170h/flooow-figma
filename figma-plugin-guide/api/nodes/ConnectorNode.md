# ConnectorNode

> 출처: https://developers.figma.com/docs/plugins/api/ConnectorNode/
> `node.type === "CONNECTOR"` — FigJam 전용

FigJam의 커넥터(화살표 연결선)입니다.

---

## 생성

```typescript
const connector = figma.createConnector();
figma.currentPage.appendChild(connector);
```

---

## 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `connectorStart` | `ConnectorEndpoint` | 시작 끝점 |
| `connectorEnd` | `ConnectorEndpoint` | 끝 끝점 |
| `connectorStartStrokeCap` | `ConnectorStrokeCap` | 시작 화살표 스타일 |
| `connectorEndStrokeCap` | `ConnectorStrokeCap` | 끝 화살표 스타일 |
| `connectorLineType` | `'ELBOWED' \| 'STRAIGHT'` | 선 타입 |
| `strokeWeight` | `number` | 선 굵기 |
| `strokes` | `Paint[]` | 선 색상 |
| `text` | `TextNode` [readonly] | 커넥터 중앙 텍스트 |
| `textBackground` | `ShapeWithTextNode` [readonly] | 텍스트 배경 |

---

## 끝점 타입 (ConnectorEndpoint)

```typescript
// 자유 부동 끝점 (노드에 연결 안 됨)
type ConnectorEndpointEndpointNodeIdAndMagnet = {
  endpointNodeId: string;
  magnet: 'NONE' | 'AUTO' | 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
};

type ConnectorEndpointPosition = {
  position: { x: number; y: number };
};
```

---

## 화살표 스타일 (`ConnectorStrokeCap`)

| 값 | 외형 |
|----|------|
| `'NONE'` | 없음 |
| `'ARROW_EQUILATERAL'` | 채워진 화살표 |
| `'ARROW_LINES'` | 선 화살표 |
| `'DIAMOND_FILLED'` | 채워진 다이아몬드 |
| `'CIRCLE_FILLED'` | 채워진 원 |
| `'TRIANGLE_FILLED'` | 채워진 삼각형 |

---

## 노드 연결 예시

```typescript
// 두 스티키 노드를 커넥터로 연결
const sticky1 = figma.createSticky();
sticky1.x = 0;
const sticky2 = figma.createSticky();
sticky2.x = 300;

figma.currentPage.appendChild(sticky1);
figma.currentPage.appendChild(sticky2);

const connector = figma.createConnector();
connector.connectorStart = {
  endpointNodeId: sticky1.id,
  magnet: 'AUTO'
};
connector.connectorEnd = {
  endpointNodeId: sticky2.id,
  magnet: 'AUTO'
};
connector.connectorEndStrokeCap = 'ARROW_EQUILATERAL';
connector.strokes = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 1 } }];
connector.strokeWeight = 2;

figma.currentPage.appendChild(connector);
```
