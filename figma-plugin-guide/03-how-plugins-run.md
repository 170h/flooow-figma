# 플러그인 실행 방식 (How Plugins Run)

> 출처: https://developers.figma.com/docs/plugins/how-plugins-run/

---

## 개요

Figma 플러그인은 주로 **JavaScript와 HTML**로 작성됩니다.
Figma 에디터(FigJam, Slides, Buzz 포함)가 플러그인에 노출하는 환경은 표준 웹 브라우저와 매우 유사하지만, 보안과 안정성을 위해 **일부 차이**가 있습니다.

---

## 플러그인 실행 환경 (Plugin Environment)

### 2가지 실행 컨텍스트

```
┌─────────────────────────────────────────────────────────────┐
│                        Figma 에디터                          │
│                                                              │
│  ┌──────────────────────┐     ┌──────────────────────────┐  │
│  │    Main Thread       │     │      UI (iframe)          │  │
│  │    (Sandbox)         │◄───►│                          │  │
│  │                      │     │  HTML / CSS / JavaScript │  │
│  │  Plugin API 접근 가능│     │  브라우저 API 접근 가능   │  │
│  │  DOM / fetch 불가    │     │  Figma Scene 접근 불가   │  │
│  └──────────────────────┘     └──────────────────────────┘  │
│         postMessage                   postMessage            │
└─────────────────────────────────────────────────────────────┘
```

### Main Thread (Sandbox) — Core 코드 실행 영역

- 플러그인 코드가 **메인 스레드의 샌드박스**에서 실행
- **브라우저 API 미제공** — `fetch`, `XMLHttpRequest`, `setTimeout`, DOM 등 없음
- **사용 가능한 JavaScript** (ES2020+):

| 분류 | 내용 |
|------|------|
| 핵심 언어 | 클래스, 제너레이터, async/await, 구조 분해, 템플릿 리터럴, for...of |
| ES2020+ 문법 | Optional chaining (`?.`), Nullish coalescing (`??`), Logical assignment (`\|\|=`, `&&=`, `??=`), BigInt |
| 표준 내장 객체 | Array, Object, Map, Set, WeakMap, WeakSet, WeakRef, Proxy, Reflect, Symbol |
| 숫자 타입 | BigInt, ArrayBuffer, Uint8Array, Float32Array 등 Typed Array |
| 비동기 | Promise (allSettled, any, withResolvers), async/await |
| 표준 API | JSON, Math, Date, RegExp, structuredClone |
| 기타 | console API (최소 버전) |

### UI (iframe) — UI 코드 실행 영역

- `figma.showUI(htmlString)` 호출로 생성
- HTML/CSS/JavaScript 자유롭게 사용 가능
- **브라우저 API 전체 접근 가능** — fetch, setTimeout, DOM, canvas, WebGL, WebAssembly 등
- Figma Scene(레이어 계층)에는 직접 접근 불가

---

## Core ↔ UI 통신 (Message Passing)

두 컨텍스트는 **메시지 패싱**으로만 통신합니다:

```typescript
// Core → UI 메시지 전송
figma.ui.postMessage({ type: 'RESULT', data: someData });

// Core에서 UI 메시지 수신
figma.ui.onmessage = (msg) => {
  if (msg.type === 'CREATE') {
    // Figma API 처리
  }
};
```

```javascript
// UI → Core 메시지 전송
parent.postMessage({ pluginMessage: { type: 'CREATE', count: 5 } }, '*');

// UI에서 Core 메시지 수신
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'RESULT') {
    // UI 업데이트
  }
};
```

---

## 플러그인 종료

플러그인은 작업 완료 후 반드시 `figma.closePlugin()`을 호출해야 합니다.

```typescript
// 작업 완료 후 플러그인 종료
figma.closePlugin();

// 메시지와 함께 종료
figma.closePlugin('완료되었습니다!');
```

> ⚠️ 종료하지 않으면 사용자에게 "Running [플러그인명]" 토스트가 계속 표시됩니다.
> 사용자가 직접 취소하면 Figma가 `figma.closePlugin()`을 자동 호출합니다.

---

## 네트워크 보안

`manifest.json`에서 네트워크 접근을 제한할 수 있습니다.
지정하지 않은 도메인에 접근 시도 시 **CSP(Content Security Policy) 오류** 발생:

```json
// manifest.json
{
  "networkAccess": {
    "allowedDomains": ["https://api.example.com"]
  }
}
```

---

## 파일 로딩 (File Loading)

- Figma 파일의 페이지는 **필요에 따라 동적으로 로드**됩니다.
- 대부분의 플러그인은 전체 파일에 접근할 필요 없음
- 여러 페이지를 다루는 플러그인은 필요한 페이지만 로드하여 성능 최적화 권장
- [문서 접근 방법 →](https://developers.figma.com/docs/plugins/accessing-document/)

---

## 관련 문서

- [문서(Document) 접근하기](https://developers.figma.com/docs/plugins/accessing-document/)
- [비동기 작업 (Async Tasks)](https://developers.figma.com/docs/plugins/async-tasks/)
- [사용자 인터페이스 생성](https://developers.figma.com/docs/plugins/creating-ui/)
- [네트워크 요청 처리](https://developers.figma.com/docs/plugins/making-network-requests/)
