# 라이브러리 & 번들링 (Libraries and Bundling)

> 출처: https://developers.figma.com/docs/plugins/libraries-and-bundling/

---

## 왜 번들링이 필요한가?

Figma 플러그인은 브라우저 환경처럼 외부 URL에서 스크립트를 동적으로 로드할 수 없습니다.
npm 패키지나 외부 라이브러리를 사용하려면 **번들러(Bundler)**를 통해 코드를 하나의 파일로 합쳐야 합니다.

```
src/code.ts
src/ui.tsx
node_modules/some-library/
          │
          ▼ [번들러: webpack / esbuild / rollup]
          │
dist/code.js   ← manifest.json의 "main"이 가리키는 파일
dist/ui.html   ← manifest.json의 "ui"가 가리키는 파일
```

---

## 권장 번들러

### Webpack (가장 많이 사용)

Figma 공식 템플릿에서도 자주 사용됩니다.

```bash
npm install --save-dev webpack webpack-cli ts-loader
```

`webpack.config.js` 예시:

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  entry: {
    ui: './src/ui.tsx',
    code: './src/code.ts',
  },

  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },

  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
      cache: false,
    }),
  ],
});
```

### esbuild (빠른 빌드 속도)

```bash
npm install --save-dev esbuild
```

```json
// package.json scripts
{
  "scripts": {
    "build": "esbuild src/code.ts --bundle --outfile=dist/code.js --target=es2020"
  }
}
```

---

## React와 함께 사용하기

React를 UI에 사용하는 경우:

```bash
npm install react react-dom
npm install --save-dev @types/react @types/react-dom
```

```tsx
// src/ui.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [count, setCount] = useState(5);

  const handleCreate = () => {
    parent.postMessage({
      pluginMessage: { type: 'CREATE_RECTANGLES', count }
    }, '*');
  };

  return (
    <div>
      <input
        type="number"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
      />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

---

## Figma UI 컴포넌트 라이브러리

Figma의 디자인 시스템과 유사한 React 컴포넌트 라이브러리를 사용하면 일관성 있는 UI를 빠르게 구성할 수 있습니다:

- [@figma/plugin-ds](https://www.npmjs.com/package/@figma/plugin-ds) — Figma 공식 제공
- [figma-plugin-ds-react](https://github.com/thomas-lowry/figma-plugin-ds) — 커뮤니티 React 버전
- [create-figma-plugin](https://yuanqing.github.io/create-figma-plugin/) — 플러그인 빌드 도구 + UI 컴포넌트

---

## 번들링 주의사항

| 항목 | 내용 |
|------|------|
| Core 코드 | Node.js/CommonJS 모듈 형태는 피하고 ES Modules 사용 |
| UI 코드 | HTML 파일 내에 JavaScript를 인라인으로 포함하거나, 번들된 JS를 참조 |
| 폰트/이미지 | Figma 환경에서는 외부 URL 폰트 사용 불가 — Base64 인코딩 또는 에디터 내 폰트만 사용 |
| `__html__` | `figma.showUI(__html__)` 시 Webpack이 `ui.html`을 번들에 인라인으로 포함 |

---

## 관련 문서

- [공식 라이브러리 & 번들링 가이드](https://developers.figma.com/docs/plugins/libraries-and-bundling/)
- [create-figma-plugin 툴체인](https://yuanqing.github.io/create-figma-plugin/)
