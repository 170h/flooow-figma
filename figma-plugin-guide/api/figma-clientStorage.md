# figma.clientStorage (ClientStorageAPI)

> 출처: https://developers.figma.com/docs/plugins/api/figma-clientStorage/

`figma.clientStorage`는 플러그인 설정 등 **사용자의 로컬 머신에 영속 데이터를 저장**합니다.
데이터는 플러그인 ID별로 격리되며, 다른 플러그인은 접근할 수 없습니다.

> ⚠️ 중요한 데이터는 저장하지 마세요 — 사용자가 브라우저 캐시를 지우면 삭제됩니다.

---

## 메서드 (모두 비동기)

### `setAsync(key, value)` — 데이터 저장

```typescript
// 다양한 타입 저장 가능
await figma.clientStorage.setAsync('theme', 'dark');
await figma.clientStorage.setAsync('count', 42);
await figma.clientStorage.setAsync('settings', { fontSize: 14, color: '#ff0000' });
await figma.clientStorage.setAsync('history', ['item1', 'item2']);
```

---

### `getAsync(key)` — 데이터 읽기

```typescript
const theme = await figma.clientStorage.getAsync('theme');
// 존재하지 않으면 undefined 반환

const settings = await figma.clientStorage.getAsync('settings');
if (settings) {
  console.log(settings.fontSize); // 14
}
```

---

### `deleteAsync(key)` — 데이터 삭제

```typescript
await figma.clientStorage.deleteAsync('theme');
```

---

### `keysAsync()` — 저장된 키 목록

```typescript
const keys = await figma.clientStorage.keysAsync();
console.log(keys); // ['theme', 'count', 'settings']
```

---

## 실용 예시

### 플러그인 설정 저장/불러오기

```typescript
// code.ts
interface PluginSettings {
  defaultColor: string;
  autoClose: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
  defaultColor: '#000000',
  autoClose: true,
};

async function loadSettings(): Promise<PluginSettings> {
  const saved = await figma.clientStorage.getAsync('settings');
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
}

async function saveSettings(settings: PluginSettings): Promise<void> {
  await figma.clientStorage.setAsync('settings', settings);
}

// 시작 시 설정 로드
const settings = await loadSettings();
figma.showUI(__html__);
figma.ui.postMessage({ type: 'INIT', settings });

// UI에서 설정 변경 시 저장
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'SAVE_SETTINGS') {
    await saveSettings(msg.settings);
    figma.notify('설정이 저장되었습니다');
  }
};
```

### 최근 사용 항목 유지

```typescript
async function addToRecent(item: string) {
  const history: string[] = (await figma.clientStorage.getAsync('recent')) || [];
  const updated = [item, ...history.filter(h => h !== item)].slice(0, 10);
  await figma.clientStorage.setAsync('recent', updated);
  return updated;
}
```
