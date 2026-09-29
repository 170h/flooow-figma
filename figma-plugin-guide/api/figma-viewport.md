# figma.viewport (ViewportAPI)

> 출처: https://developers.figma.com/docs/plugins/api/figma-viewport/

`figma.viewport`는 Figma 캔버스의 **현재 보기 영역(뷰포트)**을 읽고 제어합니다.

---

## 프로퍼티

### `figma.viewport.center` — `{ x: number, y: number }`

뷰포트 중심의 캔버스 좌표입니다. 쓰기 가능합니다.

```typescript
// 현재 중심 좌표 읽기
const center = figma.viewport.center;
console.log(center.x, center.y);

// 특정 좌표로 뷰 이동
figma.viewport.center = { x: 0, y: 0 };
```

---

### `figma.viewport.zoom` — `number`

현재 줌 레벨입니다. `1.0` = 100%, `0.5` = 50%, `2.0` = 200%. 쓰기 가능합니다.

```typescript
// 현재 줌 읽기
console.log(figma.viewport.zoom); // e.g. 1

// 줌 변경
figma.viewport.zoom = 2.0; // 200%로 확대
```

---

### `figma.viewport.bounds` — `Rect` [readonly]

현재 뷰포트가 보여주는 캔버스 영역을 나타내는 직사각형입니다.

```typescript
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const bounds = figma.viewport.bounds;
console.log(`뷰포트: ${bounds.x}, ${bounds.y} ~ ${bounds.width}x${bounds.height}`);
```

---

## 메서드

### `figma.viewport.scrollAndZoomIntoView(nodes)`

지정한 노드들이 화면에 꼭 맞게 보이도록 뷰포트를 스크롤 및 줌합니다.

```typescript
// 선택된 노드를 화면에 맞춤
figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);

// 특정 노드를 화면에 맞춤
const frame = figma.currentPage.findOne(n => n.name === 'Main Frame');
if (frame) {
  figma.viewport.scrollAndZoomIntoView([frame]);
}
```

---

## 실용 예시

```typescript
// 현재 뷰포트 중심에 새 프레임 생성
const center = figma.viewport.center;
const frame = figma.createFrame();
frame.x = center.x - 100;
frame.y = center.y - 100;
frame.resize(200, 200);
figma.currentPage.appendChild(frame);

// 생성된 프레임으로 뷰 이동
figma.viewport.scrollAndZoomIntoView([frame]);
```
