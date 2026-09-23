// scripts/build-ui.mjs
// esbuild로 번들된 React JS를 ui.html에 인라인으로 주입하여 dist/ui.html 생성

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 번들 파일 읽기
const jsBundle = readFileSync(join(root, 'dist', 'ui-bundle.js'), 'utf-8');
const css = readFileSync(join(root, 'src', 'ui', 'styles.css'), 'utf-8');

// dist 디렉토리 확인
mkdirSync(join(root, 'dist'), { recursive: true });

// 최종 ui.html 생성
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>UI Flow</title>
  <style>
${css}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
${jsBundle}
  </script>
</body>
</html>`;

writeFileSync(join(root, 'dist', 'ui.html'), html, 'utf-8');
console.log('✅ dist/ui.html 생성 완료 (' + Math.round(html.length / 1024) + ' KB)');
