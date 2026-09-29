# Plugin Manifest (manifest.json)

> 출처: https://developers.figma.com/docs/plugins/manifest/

모든 Figma 플러그인은 루트에 `manifest.json` 파일이 **반드시 있어야** 합니다. Figma가 개발용 플러그인을 등록할 때 기본 매니페스트를 자동으로 생성해 줍니다.

---

## 최소 구성 예시

```json
{
  "name": "My Plugin",
  "id": "123456789012345678",
  "api": "1.0.0",
  "main": "dist/code.js",
  "editorType": ["figma"]
}
```

---

## 전체 필드 레퍼런스

### 필수 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | `string` | 플러그인 이름 (Community 및 메뉴에 표시) |
| `id` | `string` | Figma가 생성한 고유 플러그인 ID |
| `api` | `string` | Plugin API 버전 (`"1.0.0"` 고정) |
| `main` | `string` | Core 코드 파일 경로 (컴파일된 JS) |
| `editorType` | `string[]` | 지원 에디터: `"figma"`, `"figjam"`, `"dev"`, `"slides"`, `"buzz"` |

### UI 관련

| 필드 | 타입 | 설명 |
|------|------|------|
| `ui` | `string \| UIFileMap` | UI HTML 파일 경로. 복수 UI 파일일 경우 객체로 지정 |

```json
// 단일 UI 파일
"ui": "dist/ui.html"

// 복수 UI 파일 (UIFileMap)
"ui": {
  "main": "dist/ui.html",
  "settings": "dist/settings.html"
}
```

### 메뉴 구성

```json
"menu": [
  { "name": "항목 A", "command": "commandA" },
  { "separator": true },
  {
    "name": "서브메뉴",
    "menu": [
      { "name": "서브 항목", "command": "subCommand" }
    ]
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `menu` | `ManifestMenuItem[]` | 플러그인 서브메뉴 항목 |
| `menu[].name` | `string` | 메뉴 항목 이름 |
| `menu[].command` | `string` | `figma.command`로 수신되는 문자열 |
| `menu[].separator` | `boolean` | `true`면 구분선 |

### 재실행 버튼 (Relaunch)

```json
"relaunchButtons": [
  { "command": "edit", "name": "Edit Shape" },
  { "command": "open", "name": "Open Plugin", "multipleSelection": true }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `relaunchButtons` | `RelaunchButton[]` | 노드/캔버스 패널에 표시될 재실행 버튼 |
| `relaunchButtons[].command` | `string` | 버튼 클릭 시 전달되는 커맨드 |
| `relaunchButtons[].name` | `string` | 버튼 표시 이름 |
| `relaunchButtons[].multipleSelection` | `boolean?` | `true`면 다중 선택 시에도 표시 |

### 네트워크 접근 제한

```json
"networkAccess": {
  "allowedDomains": [
    "https://api.example.com",
    "https://cdn.example.com"
  ],
  "devAllowedDomains": ["https://localhost:3000"],
  "reasoning": "외부 API에서 데이터를 가져오기 위해 필요합니다."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `networkAccess.allowedDomains` | `string[]` | 허용된 외부 도메인 목록 |
| `networkAccess.devAllowedDomains` | `string[]?` | 개발 환경 전용 추가 허용 도메인 |
| `networkAccess.reasoning` | `string?` | 네트워크 접근이 필요한 이유 (게시 시 심사 참고용) |

### 권한 (Permissions)

```json
"permissions": ["currentuser", "activeusers", "payments"]
```

| 권한 값 | 설명 |
|---------|------|
| `"currentuser"` | `figma.currentUser` 접근 허용 |
| `"activeusers"` | `figma.activeUsers` 접근 허용 |
| `"payments"` | `figma.payments` 접근 허용 |

### 문서 접근 모드

```json
"documentAccess": "dynamic-page"
```

| 값 | 설명 |
|----|------|
| (미설정, 기본값) | 현재 페이지만 로드. 가장 빠름 |
| `"dynamic-page"` | 여러 페이지에 비동기 접근 가능. `setCurrentPageAsync()` 필요 |

> ⚠️ `dynamic-page` 모드는 플러그인 시작 속도가 느려질 수 있습니다.

### 조직 비공개 플러그인

```json
"enablePrivatePluginApi": true,
"containsPrivatePluginApi": true
```

| 필드 | 설명 |
|------|------|
| `enablePrivatePluginApi` | 비공개 Plugin API(`figma.fileKey` 등) 활성화 |
| `containsPrivatePluginApi` | 비공개 API 사용 선언 (검토용) |

### 기타 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `parameterOnly` | `boolean` | 파라미터 입력만으로 동작하는 플러그인 여부 |
| `parameters` | `ManifestParameter[]` | 퀵 액션에서 받을 파라미터 목록 |
| `capabilities` | `string[]` | 특수 기능 선언 (`"textreview"`, `"inspect"`, `"codegen"` 등) |
| `codegenLanguages` | `CodegenLanguage[]` | Dev Mode Codegen 지원 언어 목록 |
| `codegenAiInstructions` | `string` | Codegen AI에 전달할 추가 지시 |

---

## 완전한 매니페스트 예시

```json
{
  "name": "My Figma Plugin",
  "id": "123456789012345678",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma", "figjam"],
  "documentAccess": "dynamic-page",
  "permissions": ["currentuser"],
  "networkAccess": {
    "allowedDomains": ["https://api.example.com"],
    "reasoning": "외부 데이터 로드에 필요"
  },
  "relaunchButtons": [
    { "command": "edit", "name": "다시 편집" }
  ],
  "menu": [
    { "name": "실행", "command": "run" },
    { "separator": true },
    { "name": "설정", "command": "settings" }
  ]
}
```
