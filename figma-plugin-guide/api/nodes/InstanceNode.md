# InstanceNode

> 출처: https://developers.figma.com/docs/plugins/api/InstanceNode/
> `node.type === "INSTANCE"`

ComponentNode의 **인스턴스(복사본)**입니다. 마스터 컴포넌트에 연결되어 있습니다.

---

## 생성

```typescript
// 컴포넌트에서 인스턴스 생성
const instance = component.createInstance();
figma.currentPage.appendChild(instance);
```

---

## 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `mainComponent` | `ComponentNode \| null` [readonly] | 연결된 마스터 컴포넌트 |
| `mainComponentId` | `string` [readonly] | 마스터 컴포넌트 ID |
| `swapComponent(newComp)` | `void` | 다른 컴포넌트로 교체 |
| `scaleFactor` | `number` | 인스턴스 스케일 |
| `overrides` | `Override[]` [readonly] | 재정의된 속성 목록 |

---

## 배리언트 제어

```typescript
// 현재 배리언트 속성 읽기
const props = instance.componentProperties;
// { "State": { type: "VARIANT", value: "Default" }, ... }

// 배리언트 속성 변경
instance.setProperties({ 'State': 'Hover' });
instance.setProperties({ 'State': 'Pressed', 'Size': 'Large' });
```

---

## 인스턴스 분리

```typescript
// 마스터 컴포넌트와 연결 해제 → FrameNode 반환
const frame = instance.detachInstance();
```

---

## 중첩 인스턴스 재정의

```typescript
// 자식 노드 재정의 (텍스트 변경 등)
const textChild = instance.findOne(n => n.type === 'TEXT' && n.name === 'Label');
if (textChild && textChild.type === 'TEXT') {
  await figma.loadFontAsync(textChild.fontName as FontName);
  textChild.characters = '새 라벨';
}
```

---

## 실용 예시

```typescript
// 버튼 컴포넌트로 여러 버튼 생성
const buttonComp = figma.currentPage.findOne(
  n => n.type === 'COMPONENT' && n.name === 'Button/Primary'
) as ComponentNode;

const labels = ['확인', '취소', '더 보기'];
for (let i = 0; i < labels.length; i++) {
  const btn = buttonComp.createInstance();
  btn.x = i * 140;
  btn.y = 0;

  // 라벨 텍스트 변경
  const label = btn.findOne(n => n.type === 'TEXT') as TextNode;
  if (label) {
    await figma.loadFontAsync(label.fontName as FontName);
    label.characters = labels[i];
  }

  figma.currentPage.appendChild(btn);
}
```
