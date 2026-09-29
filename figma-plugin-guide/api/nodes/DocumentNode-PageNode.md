# DocumentNode & PageNode

> 출처:
> - https://developers.figma.com/docs/plugins/api/DocumentNode/
> - https://developers.figma.com/docs/plugins/api/PageNode/

---

## DocumentNode — `node.type === "DOCUMENT"`

Figma 파일의 **루트 노드**입니다. `figma.root`로 접근합니다.

### 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `children` | `PageNode[]` [readonly] | 파일의 모든 페이지 |
| `name` | `string` [readonly] | 파일 이름 |

### 사용 예시

```typescript
// 모든 페이지 순회
for (const page of figma.root.children) {
  console.log(page.name);
}

// 페이지 이름으로 찾기
const targetPage = figma.root.children.find(p => p.name === 'Components');
```

---

## PageNode — `node.type === "PAGE"`

파일 내 개별 페이지입니다. `figma.currentPage`로 현재 페이지에 접근합니다.

### 생성

```typescript
const newPage = figma.createPage();
newPage.name = '새 페이지';
```

### 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `children` | `SceneNode[]` [readonly] | 페이지의 최상위 노드들 |
| `selection` | `SceneNode[]` | 현재 선택된 노드들 (쓰기 가능) |
| `backgrounds` | `Paint[]` | 페이지 배경 색상 |
| `guides` | `Guide[]` | 가이드라인 목록 |
| `prototypeStartNode` | `FrameNode \| null` | 프로토타입 시작 프레임 |

### 주요 메서드

```typescript
// 노드 탐색
page.findAll(node => node.type === 'TEXT')
page.findOne(node => node.name === 'Header')
page.findAllWithCriteria({ types: ['FRAME', 'COMPONENT'] })

// 선택 제어
page.selection = [node1, node2];

// 페이지 전환 (dynamic-page 모드)
await figma.setCurrentPageAsync(targetPage);
```

### 사용 예시

```typescript
// 현재 페이지의 모든 컴포넌트 찾기
const components = figma.currentPage.findAllWithCriteria({ types: ['COMPONENT'] });
console.log(`컴포넌트 수: ${components.length}`);

// 페이지 배경을 다크로 변경
figma.currentPage.backgrounds = [{
  type: 'SOLID',
  color: { r: 0.1, g: 0.1, b: 0.1 }
}];

// 모든 페이지의 특정 노드 처리
for (const page of figma.root.children) {
  await figma.setCurrentPageAsync(page);  // dynamic-page 모드 필요
  const texts = page.findAllWithCriteria({ types: ['TEXT'] }) as TextNode[];
  console.log(`${page.name}: ${texts.length}개 텍스트`);
}
```
