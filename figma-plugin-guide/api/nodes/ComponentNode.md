# ComponentNode & ComponentSetNode

> 출처:
> - https://developers.figma.com/docs/plugins/api/ComponentNode/
> - https://developers.figma.com/docs/plugins/api/ComponentSetNode/

---

## ComponentNode — `node.type === "COMPONENT"`

컴포넌트의 **마스터(원본)**입니다. InstanceNode들의 원형입니다.

### 생성

```typescript
// 빈 컴포넌트 생성
const comp = figma.createComponent();
comp.name = 'Button';
comp.resize(120, 40);

// 기존 노드를 컴포넌트로 변환
const node = figma.currentPage.selection[0];
const comp2 = figma.createComponentFromNode(node);
```

### 주요 속성 & 메서드

| 속성/메서드 | 타입 | 설명 |
|-----------|------|------|
| `description` | `string` | 컴포넌트 설명 (툴팁) |
| `documentationLinks` | `DocumentationLink[]` | 문서 링크 목록 |
| `remote` | `boolean` [readonly] | 외부 라이브러리 컴포넌트 여부 |
| `key` | `string` [readonly] | 컴포넌트 키 (임포트에 사용) |
| `createInstance()` | `InstanceNode` | 인스턴스 생성 |
| `getPublishStatusAsync()` | `Promise<PublishStatus>` | 게시 상태 확인 |

```typescript
// 인스턴스 생성
const btn = comp.createInstance();
btn.x = 100;
btn.y = 200;
figma.currentPage.appendChild(btn);
```

---

## ComponentSetNode — `node.type === "COMPONENT_SET"`

**배리언트(Variants) 컨테이너**입니다. 여러 ComponentNode를 묶어 배리언트 세트를 구성합니다.

### 생성

```typescript
// 여러 컴포넌트를 배리언트로 묶기
const btnDefault = figma.createComponent();
btnDefault.name = 'State=Default';
const btnHover = figma.createComponent();
btnHover.name = 'State=Hover';
const btnPressed = figma.createComponent();
btnPressed.name = 'State=Pressed';

const variantSet = figma.combineAsVariants(
  [btnDefault, btnHover, btnPressed],
  figma.currentPage
);
variantSet.name = 'Button';
```

### 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `children` | `ComponentNode[]` | 배리언트 컴포넌트들 |
| `description` | `string` | 컴포넌트 세트 설명 |
| `documentationLinks` | `DocumentationLink[]` | 문서 링크 |
| `key` | `string` [readonly] | 컴포넌트 세트 키 |

---

## 외부 라이브러리 컴포넌트 임포트

```typescript
// 키로 컴포넌트 임포트 (팀 라이브러리에서)
const imported = await figma.importComponentByKeyAsync('componentKey123');
const instance = imported.createInstance();
figma.currentPage.appendChild(instance);
```
