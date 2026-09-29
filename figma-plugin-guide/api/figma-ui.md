# figma.ui (UIAPI)

> 출처: https://developers.figma.com/docs/plugins/api/figma-ui/

`figma.ui`는 Core 코드에서 UI iframe과 통신하기 위한 API입니다.
`figma.showUI()`로 UI를 열고 나면 이 객체를 통해 메시지를 주고받습니다.

---

## 메서드 & 프로퍼티

### `figma.showUI(html, options?)`

UI iframe을 생성하고 표시합니다.

```typescript
figma.showUI(__html__);

figma.showUI(__html__, {
  width: 400,
  height: 600,
  title: '내 플러그인',
  themeColors: true,    // Figma UI 테마 변수 자동 주입
  visible: true,        // false면 숨김 상태로 열기
  position: { x: 100, y: 100 }
});
```

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `width` | `number` | `300` | UI 창 너비 (px) |
| `height` | `number` | `200` | UI 창 높이 (px) |
| `title` | `string` | 플러그인 이름 | 모달 타이틀 |
| `themeColors` | `boolean` | `false` | `true`면 Figma 테마 CSS 변수를 iframe에 자동 주입 |
| `visible` | `boolean` | `true` | 초기 표시 여부 |
| `position` | `{x, y}` | — | 창 초기 위치 |

---

### `figma.ui.postMessage(msg, options?)`

Core → UI 방향으로 메시지를 전송합니다.

```typescript
// Core에서 UI로 메시지 전송
figma.ui.postMessage({ type: 'SELECTION_CHANGED', nodes: selectedIds });
figma.ui.postMessage('단순 문자열도 가능');
figma.ui.postMessage(42);
```

---

### `figma.ui.onmessage`

UI → Core 방향의 메시지를 수신하는 핸들러입니다.

```typescript
figma.ui.onmessage = (message, props) => {
  console.log('UI에서 받은 메시지:', message);
  console.log('발신 origin:', props.origin);
};
```

---

### `figma.ui.on(type, callback)` / `figma.ui.off(type, callback)`

이벤트 기반 방식의 메시지 수신입니다. `onmessage` 대신 사용합니다.

```typescript
// 이벤트 리스너 등록
figma.ui.on('message', (message, props) => {
  if (message.type === 'CREATE') {
    // 처리
  }
});

// 리스너 제거
const handler = (msg) => { /* ... */ };
figma.ui.on('message', handler);
figma.ui.off('message', handler);
```

---

### `figma.ui.show()` / `figma.ui.hide()`

UI 창을 표시하거나 숨깁니다. UI가 열려 있어야 합니다.

```typescript
figma.ui.hide();  // 창 숨기기 (플러그인은 계속 실행)
figma.ui.show();  // 창 다시 표시
```

---

### `figma.ui.resize(width, height)`

UI 창 크기를 동적으로 변경합니다.

```typescript
figma.ui.resize(500, 400);
```

---

### `figma.ui.reposition(x, y)`

UI 창 위치를 변경합니다.

```typescript
figma.ui.reposition(100, 200);
```

---

### `figma.ui.close()`

UI 창을 닫습니다. (`figma.closePlugin()`과 다르게 플러그인 자체는 종료되지 않음)

---

## UI 쪽 수신 코드 (ui.html)

```html
<script>
// UI → Core 메시지 전송
parent.postMessage({ pluginMessage: { type: 'CREATE', count: 5 } }, '*');

// Core → UI 메시지 수신
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'SELECTION_CHANGED') {
    console.log('선택된 노드 ID:', msg.nodes);
  }
};
</script>
```

---

## 자주 쓰는 패턴

### themeColors로 Figma 테마 변수 사용

```typescript
figma.showUI(__html__, { themeColors: true });
```

```css
/* ui.html CSS */
.button {
  background: var(--figma-color-bg-brand);
  color: var(--figma-color-text-onbrand);
}
```

### 선택 변경 시 UI 업데이트

```typescript
figma.on('selectionchange', () => {
  const nodes = figma.currentPage.selection;
  figma.ui.postMessage({
    type: 'SELECTION_UPDATE',
    count: nodes.length,
    types: nodes.map(n => n.type)
  });
});
```
