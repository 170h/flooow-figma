# TypeScript 타이핑 파일 & API 에러

---

## 타이핑 파일 (The Typings File)

> 출처: https://developers.figma.com/docs/plugins/api/typings/

Figma는 Plugin API 전체에 대한 **TypeScript 타입 정의 파일**을 npm 패키지로 제공합니다.

### 설치

```bash
npm install --save-dev @figma/plugin-typings
```

### 설정 (tsconfig.json)

```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./node_modules/@figma/plugin-typings"],
    "target": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

> 💡 **자동 업데이트**: API 변경 시 타이핑 파일도 함께 업데이트됩니다.
> 최신 타입을 유지하려면 주기적으로 `npm update @figma/plugin-typings`를 실행하세요.

### 주요 타입 위치

타이핑 파일에는 다음이 포함됩니다:
- 모든 노드 타입 (`FrameNode`, `TextNode` 등)
- 데이터 타입 (`Paint`, `Effect`, `Transform` 등)
- `PluginAPI` (`figma` 글로벌 객체 타입)
- `UIAPI`, `ViewportAPI` 등 하위 API 타입
- 이벤트 타입

### ESLint 플러그인

올바른 Plugin API 사용을 강제하는 ESLint 규칙:

```bash
npm install --save-dev eslint @figma/eslint-plugin-figma-plugins
```

```json
// .eslintrc.json
{
  "plugins": ["@figma/figma-plugins"],
  "rules": {
    "@figma/figma-plugins/await-requires-async": "error",
    "@figma/figma-plugins/dynamic-page-requires-load-all-pages": "warn"
  }
}
```

---

## API 에러 (API Errors)

> 출처: https://developers.figma.com/docs/plugins/api/api-errors/

Plugin API 사용 중 발생할 수 있는 에러와 해결 방법입니다.

### 자주 발생하는 에러

#### `Error: Node not found`

삭제된 노드에 접근할 때 발생합니다.

```typescript
// 방어 코드
if (!node.removed) {
  node.name = '새 이름';
}
```

#### `Error: Cannot read property of removed node`

```typescript
try {
  node.fills = [...];
} catch (e) {
  console.error('노드가 삭제되었습니다:', e);
}
```

#### `Error: Missing font ... (not loaded)`

텍스트 수정 전 폰트를 로드하지 않았을 때:

```typescript
// 항상 loadFontAsync 먼저 호출
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
textNode.characters = '새 텍스트';

// 혼합 폰트 처리 (mixed font)
if (textNode.fontName !== figma.mixed) {
  await figma.loadFontAsync(textNode.fontName);
} else {
  // 모든 사용된 폰트 로드
  const fonts = textNode.getRangeAllFontNames(0, textNode.characters.length);
  await Promise.all(fonts.map(f => figma.loadFontAsync(f)));
}
```

#### `Error: Cannot call ... in a non-async context`

`await` 없이 비동기 함수 사용 시:

```typescript
// ❌ 잘못된 코드
figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

// ✅ 올바른 코드
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
```

#### CSP 네트워크 에러

`networkAccess.allowedDomains`에 없는 도메인 요청 시:

```json
// manifest.json에 도메인 추가
"networkAccess": {
  "allowedDomains": ["https://api.example.com"]
}
```

#### `Error: Node not in the document`

부모에 추가되지 않은 노드에 접근 시:

```typescript
const rect = figma.createRectangle();
// 먼저 페이지에 추가
figma.currentPage.appendChild(rect);
// 그 다음 속성 설정
rect.name = '배경';
```

### 에러 핸들링 패턴

```typescript
async function safePluginRun() {
  try {
    // 플러그인 로직
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    // ...
    figma.closePlugin('완료!');
  } catch (error) {
    figma.notify(`오류 발생: ${error.message}`, { error: true });
    figma.closePlugin();
  }
}

safePluginRun();
```
