# 에디터 타입 설정 (Setting Editor Type)

> 출처: https://developers.figma.com/docs/plugins/setting-editor-type/

---

## `editorType` 필드란?

`editorType`은 **`manifest.json`의 필수 필드**입니다.
플러그인이 동작할 Figma 에디터 제품을 지정합니다.

특정 에디터 하나만, 여러 에디터 조합, 또는 에디터별로 다른 동작을 하는 플러그인 모두 만들 수 있습니다.

---

## 지원 에디터 타입

| 값 | 에디터 |
|----|--------|
| `"figma"` | Figma Design (기본 디자인 에디터) |
| `"figjam"` | FigJam (화이트보드) |
| `"dev"` | Dev Mode |
| `"slides"` | Figma Slides |
| `"buzz"` | Figma Buzz |

> ⚠️ **주의**: `"dev"`와 `"figjam"`은 동시에 지정할 수 없습니다.

---

## manifest.json 설정 예시

```json
// Figma Design + FigJam 모두 지원
"editorType": ["figjam", "figma"]

// Figma Design + Dev Mode 지원
"editorType": ["figma", "dev"]

// Figma Design 전용
"editorType": ["figma"]

// FigJam 전용
"editorType": ["figjam"]

// Dev Mode 전용
"editorType": ["dev"]

// Figma Slides 전용
"editorType": ["slides"]

// Figma Buzz 전용
"editorType": ["buzz"]
```

---

## 런타임 에디터 감지

여러 에디터를 지원할 때, 코드에서 현재 실행 중인 에디터를 확인하려면 `figma.editorType`을 사용합니다.

반환값: `"figma"` | `"figjam"` | `"dev"` | `"slides"` | `"buzz"`

```typescript
// 현재 실행 중인 에디터를 확인하여 조건 분기
if (figma.editorType === 'figjam') {
  // FigJam에서만 사용 가능한 API (e.g. figma.createSticky())
}

if (figma.editorType === 'figma') {
  // Figma Design 모드
}

if (figma.editorType === 'dev') {
  // Dev Mode
}

if (figma.editorType === 'slides') {
  // Figma Slides
}

if (figma.editorType === 'buzz') {
  // Figma Buzz
}
```

> ⚠️ 예를 들어 `figma.createSticky()`는 FigJam에서만 동작합니다.
> `editorType`을 여러 개 지정한 경우 에디터별로 가용 API가 다르므로 반드시 분기 처리가 필요합니다.

---

## 에디터별 상세 가이드

- [FigJam에서 작업하기](https://developers.figma.com/docs/plugins/working-in-figjam/)
- [Dev Mode에서 작업하기](https://developers.figma.com/docs/plugins/working-in-dev-mode/)
- [Slides에서 작업하기](https://developers.figma.com/docs/plugins/working-in-slides/)
- [Buzz에서 작업하기](https://developers.figma.com/docs/plugins/working-in-buzz/)
