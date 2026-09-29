# figma.util (UtilAPI)

> 출처: https://developers.figma.com/docs/plugins/api/figma-util/

`figma.util`은 Plugin API에서 자주 필요한 작업을 위한 **편의 함수 모음**입니다.

---

## 색상 변환

### `figma.util.solidPaint(color, options?)`

16진수 색상 문자열로 `SolidPaint` 객체를 생성합니다.

```typescript
// 기본 사용
const paint = figma.util.solidPaint('#FF5733');
// { type: 'SOLID', color: { r: 1, g: 0.341, b: 0.2 }, opacity: 1 }

// 투명도 설정
const semiTransparent = figma.util.solidPaint('#FF5733', { opacity: 0.5 });

// 노드에 적용
const rect = figma.createRectangle();
rect.fills = [figma.util.solidPaint('#4A90E2')];
```

---

## 이미지 다운로드

### `figma.util.fetchAsync(url, options?)`

URL에서 이미지를 다운로드합니다.

> ⚠️ `networkAccess.allowedDomains`에 해당 URL의 도메인이 포함되어야 합니다.

```typescript
// URL에서 이미지 fetch (Uint8Array 반환)
const imageData = await figma.util.fetchAsync('https://example.com/image.png');

// Figma 이미지로 변환
const image = figma.createImage(imageData);
const frame = figma.createFrame();
frame.fills = [{
  type: 'IMAGE',
  imageHash: image.hash,
  scaleMode: 'FILL'
}];
```

### `figma.util.fetchSVGAsync(url, options?)`

URL에서 SVG를 다운로드하고 벡터 노드로 직접 생성합니다.

```typescript
const vectorNode = await figma.util.fetchSVGAsync('https://example.com/icon.svg');
figma.currentPage.appendChild(vectorNode);
```

---

## 실용 예시

```typescript
// 여러 색상으로 사각형 생성
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
for (let i = 0; i < colors.length; i++) {
  const rect = figma.createRectangle();
  rect.x = i * 120;
  rect.resize(100, 100);
  rect.fills = [figma.util.solidPaint(colors[i])];
  figma.currentPage.appendChild(rect);
}
```
