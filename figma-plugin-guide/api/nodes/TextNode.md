# TextNode

> 출처: https://developers.figma.com/docs/plugins/api/TextNode/
> `node.type === "TEXT"`

텍스트 레이어를 나타냅니다.

> ⚠️ **텍스트 내용이나 폰트 속성을 변경하기 전에 반드시 `figma.loadFontAsync()`를 호출해야 합니다.**

---

## 생성

```typescript
const text = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
text.characters = '안녕하세요';
text.fontSize = 16;
figma.currentPage.appendChild(text);
```

---

## 주요 속성

### 텍스트 내용

| 속성 | 타입 | 설명 |
|------|------|------|
| `characters` | `string` | 전체 텍스트 내용 |
| `textAlignHorizontal` | `'LEFT' \| 'CENTER' \| 'RIGHT' \| 'JUSTIFIED'` | 가로 정렬 |
| `textAlignVertical` | `'TOP' \| 'CENTER' \| 'BOTTOM'` | 세로 정렬 |
| `textAutoResize` | `'NONE' \| 'WIDTH_AND_HEIGHT' \| 'HEIGHT' \| 'TRUNCATE'` | 자동 크기 조절 방식 |
| `textTruncation` | `'DISABLED' \| 'ENDING'` | 말줄임표 처리 |
| `maxLines` | `number \| null` | 최대 줄 수 |

### 폰트 속성 (전체 노드 단위)

| 속성 | 타입 | 설명 |
|------|------|------|
| `fontName` | `FontName \| typeof figma.mixed` | 폰트 패밀리 + 스타일 |
| `fontSize` | `number \| typeof figma.mixed` | 폰트 크기 |
| `fontWeight` | `number \| typeof figma.mixed` [readonly] | 폰트 굵기 |
| `letterSpacing` | `LetterSpacing \| typeof figma.mixed` | 자간 |
| `lineHeight` | `LineHeight \| typeof figma.mixed` | 줄 간격 |
| `paragraphSpacing` | `number` | 문단 간격 |
| `paragraphIndent` | `number` | 문단 들여쓰기 |
| `textDecoration` | `TextDecoration \| typeof figma.mixed` | 밑줄, 취소선 등 |
| `textCase` | `TextCase \| typeof figma.mixed` | 대소문자 변환 |

```typescript
// FontName 타입
interface FontName {
  family: string;   // "Inter", "Noto Sans KR" 등
  style: string;    // "Regular", "Bold", "Italic" 등
}

// LetterSpacing 타입
type LetterSpacing =
  | { value: number; unit: 'PIXELS' }
  | { value: number; unit: 'PERCENT' };

// LineHeight 타입
type LineHeight =
  | { value: number; unit: 'PIXELS' }
  | { value: number; unit: 'PERCENT' }
  | { unit: 'AUTO' };
```

---

## 범위 지정 속성 변경 (getRange / setRange)

텍스트의 특정 범위에만 속성을 적용할 수 있습니다.

```typescript
// 특정 범위의 폰트 읽기
const fontAt = text.getRangeFontName(0, 5);

// 특정 범위에 굵게 적용
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
text.setRangeFontName(0, 5, { family: 'Inter', style: 'Bold' });
text.setRangeFontSize(0, 5, 24);
text.setRangeFills(0, 5, [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]);
text.setRangeTextDecoration(0, 5, 'UNDERLINE');
text.setRangeLetterSpacing(0, 5, { value: 2, unit: 'PIXELS' });
```

| 메서드 | 설명 |
|--------|------|
| `getRangeFontName(start, end)` | 범위 폰트 이름 읽기 |
| `getRangeFontSize(start, end)` | 범위 폰트 크기 읽기 |
| `getRangeFills(start, end)` | 범위 색상 읽기 |
| `setRangeFontName(start, end, value)` | 범위 폰트 이름 설정 |
| `setRangeFontSize(start, end, value)` | 범위 폰트 크기 설정 |
| `setRangeFills(start, end, value)` | 범위 색상 설정 |
| `setRangeTextDecoration(start, end, value)` | 범위 장식 설정 |
| `setRangeLetterSpacing(start, end, value)` | 범위 자간 설정 |
| `setRangeLineHeight(start, end, value)` | 범위 줄 간격 설정 |
| `setRangeTextCase(start, end, value)` | 범위 대소문자 설정 |

---

## 텍스트 스타일

```typescript
// 텍스트 스타일 ID 적용
text.textStyleId = 'S:abc123...';

// 범위에 스타일 적용
text.setRangeTextStyleId(0, 10, 'S:abc123...');
```

---

## 실용 예시

```typescript
// 서식 있는 텍스트 생성
async function createRichText() {
  const text = figma.createText();

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  text.characters = '제목: 플러그인 개발 가이드';

  // '제목:' 부분을 굵게
  text.setRangeFontName(0, 3, { family: 'Inter', style: 'Bold' });
  text.setRangeFontSize(0, 3, 20);

  // 나머지 일반 크기
  text.setRangeFontSize(3, text.characters.length, 16);

  text.textAutoResize = 'WIDTH_AND_HEIGHT';
  figma.currentPage.appendChild(text);
}
```
