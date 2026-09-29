# figma.variables (VariablesAPI)

> 출처: https://developers.figma.com/docs/plugins/api/figma-variables/

Figma Variables(토큰) API입니다. 컬렉션과 변수를 읽고 생성하고 수정할 수 있습니다.

> 📌 이 API는 Figma Design 전용입니다. FigJam에서는 사용 불가합니다.

---

## 핵심 개념

```
VariableCollection (컬렉션)
  ├── mode: "Light", "Dark", "Mobile" ... (모드들)
  └── Variable (변수들)
       ├── resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN"
       └── valuesByMode: { [modeId]: value }
```

---

## 읽기 메서드

### `getLocalVariables(type?)`

현재 파일의 로컬 변수를 반환합니다.

```typescript
// 모든 로컬 변수
const all = figma.variables.getLocalVariables();

// 색상 변수만
const colors = figma.variables.getLocalVariables('COLOR');
const numbers = figma.variables.getLocalVariables('FLOAT');
const strings = figma.variables.getLocalVariables('STRING');
const booleans = figma.variables.getLocalVariables('BOOLEAN');
```

### `getLocalVariableCollections()`

현재 파일의 모든 변수 컬렉션을 반환합니다.

```typescript
const collections = figma.variables.getLocalVariableCollections();
for (const col of collections) {
  console.log(col.name, col.modes);
}
```

### `getVariableById(id)` / `getVariableCollectionById(id)`

ID로 특정 변수/컬렉션을 가져옵니다.

```typescript
const variable = figma.variables.getVariableById('VariableID:123:456');
const collection = figma.variables.getVariableCollectionById('VariableCollectionId:789:012');
```

---

## 생성 메서드

### `createVariable(name, collection, type)`

새 변수를 생성합니다.

```typescript
const collection = figma.variables.getLocalVariableCollections()[0];

const colorVar = figma.variables.createVariable(
  'primary/500',
  collection.id,
  'COLOR'
);

// 모드별 값 설정
colorVar.setValueForMode(collection.defaultModeId, {
  r: 0.2,
  g: 0.4,
  b: 1,
  a: 1
});
```

### `createVariableCollection(name)`

새 변수 컬렉션을 생성합니다.

```typescript
const collection = figma.variables.createVariableCollection('Color Tokens');

// 모드 추가
collection.addMode('Light');
collection.addMode('Dark');
// 기본 모드 이름 변경
collection.renameMode(collection.defaultModeId, 'Light');
```

---

## 변수를 노드 속성에 적용

```typescript
// 변수를 노드의 fills에 바인딩
const variable = figma.variables.getLocalVariables('COLOR')[0];

const rect = figma.createRectangle();
rect.fills = [{
  type: 'SOLID',
  color: { r: 0, g: 0, b: 0 },
  boundVariables: {
    'color': figma.variables.createVariableAlias(variable)
  }
}];
```

---

## 팀 라이브러리 변수 가져오기

```typescript
// 팀 라이브러리에서 변수 임포트 (비동기)
const imported = await figma.variables.importVariableByKeyAsync('variableKey123');
```

---

## 실용 예시: 다크모드 전환

```typescript
const collection = figma.variables.getLocalVariableCollections()
  .find(c => c.name === 'Theme');

if (collection) {
  const darkMode = collection.modes.find(m => m.name === 'Dark');
  if (darkMode) {
    // 현재 페이지의 모든 노드에 다크 모드 적용
    figma.currentPage.setExplicitVariableModeForCollection(
      collection,
      darkMode.modeId
    );
  }
}
```
