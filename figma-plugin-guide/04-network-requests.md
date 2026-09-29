# 네트워크 요청 (Making Network Requests)

> 출처: https://developers.figma.com/docs/plugins/making-network-requests/

---

## 핵심 원칙

Plugin Core 샌드박스에는 `fetch` / `XMLHttpRequest` 등 브라우저 네트워크 API가 **없습니다**.
네트워크 요청은 반드시 **UI iframe에서** 수행해야 합니다.

```
Core (Sandbox)           UI (iframe)
     │                        │
     │  1. postMessage 요청   │
     │───────────────────────►│
     │                        │ 2. fetch() 실행
     │                        │    (브라우저 API 사용)
     │  4. postMessage 응답   │
     │◄───────────────────────│ 3. 결과 수신
     │                        │
     ▼                        ▼
  Figma Scene 조작          UI 업데이트
```

---

## 구현 패턴

### UI (ui.html)에서 fetch 수행

```html
<script>
window.onmessage = async (event) => {
  const msg = event.data.pluginMessage;

  if (msg.type === 'FETCH_DATA') {
    try {
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();

      // Core로 결과 전달
      parent.postMessage({
        pluginMessage: { type: 'FETCH_RESULT', data }
      }, '*');
    } catch (error) {
      parent.postMessage({
        pluginMessage: { type: 'FETCH_ERROR', error: error.message }
      }, '*');
    }
  }
};
</script>
```

### Core (code.ts)에서 UI에 요청

```typescript
// UI에 네트워크 요청 위임
figma.ui.postMessage({ type: 'FETCH_DATA', url: 'https://api.example.com/data' });

// UI로부터 결과 수신
figma.ui.onmessage = (msg) => {
  if (msg.type === 'FETCH_RESULT') {
    const data = msg.data;
    // Figma API로 결과 활용
  }
  if (msg.type === 'FETCH_ERROR') {
    figma.notify(`오류: ${msg.error}`);
  }
};
```

---

## 네트워크 접근 제한 (manifest.json)

`manifest.json`에서 접근 가능한 도메인을 명시적으로 제한할 수 있습니다:

```json
{
  "name": "My Plugin",
  "id": "...",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "networkAccess": {
    "allowedDomains": [
      "https://api.example.com",
      "https://cdn.example.com"
    ]
  }
}
```

> ⚠️ 지정되지 않은 도메인에 접근 시도하면 CSP(Content Security Policy) 오류가 발생합니다.
> 단, 플러그인이 렌더링하는 웹사이트가 로드하는 외부 리소스(예: Google Analytics)에는 제한이 적용되지 않습니다.

---

## 자주 사용하는 패턴

### JSON API 호출 예시

```typescript
// code.ts
figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'API_RESULT') {
    // 받은 데이터로 Figma 캔버스 조작
    const frame = figma.createFrame();
    frame.name = msg.data.title;
    figma.closePlugin();
  }
};

// UI에 데이터 요청 시작
figma.ui.postMessage({ type: 'FETCH', endpoint: '/items' });
```

```html
<!-- ui.html -->
<script>
window.onmessage = async (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'FETCH') {
    const res = await fetch(`https://api.example.com${msg.endpoint}`);
    const data = await res.json();
    parent.postMessage({ pluginMessage: { type: 'API_RESULT', data } }, '*');
  }
};
</script>
```

---

## 관련 문서

- [플러그인 실행 방식 →](./03-how-plugins-run.md)
- [공식 네트워크 요청 가이드](https://developers.figma.com/docs/plugins/making-network-requests/)
