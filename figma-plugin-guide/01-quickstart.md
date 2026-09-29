# Figma Plugin 퀵스타트 가이드

> 출처: https://developers.figma.com/docs/plugins/plugin-quickstart-guide/
> 
> 이 가이드는 **TypeScript + Visual Studio Code** 환경을 기준으로 작성되었습니다.
> JavaScript 또는 다른 에디터를 사용해도 무방합니다.

---

## 가이드 목표

이 가이드를 완료하면 다음 기능을 가진 플러그인을 만들 수 있습니다:
- 모달 창을 열어 사용자로부터 숫자를 입력받음
- 입력된 숫자만큼 캔버스에 사각형(Rectangle)을 생성

---

## 1단계: 필요한 도구 설치

### 필수 도구

| 도구 | 용도 | 다운로드 |
|------|------|----------|
| **Figma 데스크톱 앱** | 플러그인 개발 및 테스트 (웹 버전 불가) | [figma.com/downloads](https://www.figma.com/downloads/) |
| **Visual Studio Code** | 코드 에디터 | [code.visualstudio.com](https://code.visualstudio.com/) |

> ⚠️ **중요**: 플러그인 개발은 반드시 **Figma 데스크톱 앱**에서 해야 합니다.
> Figma가 로컬에 저장된 플러그인 코드 파일을 직접 읽어야 하기 때문입니다.

---

## 2단계: 새 플러그인 만들기

1. 데스크톱 앱에 로그인한 뒤, **새 디자인 파일**을 생성합니다.
2. 메뉴에서 **Plugins > Development > New plugin** 을 선택합니다.
3. **Create a plugin** 모달에서:
   - **Figma design** 선택
   - 플러그인 이름 입력 (예: `my-first-plugin`)
4. **Custom UI** 를 선택합니다.
5. **Save as** 를 클릭하여 원하는 위치에 폴더를 저장합니다.

---

## 3단계: 플러그인 코드 폴더 열기 (VS Code)

1. Visual Studio Code를 실행합니다.
2. **File > Open Folder** 를 선택하고, 2단계에서 저장한 폴더를 엽니다.
3. 신뢰 확인 모달이 나타나면 **Yes, I trust the authors** 를 클릭합니다.

폴더를 열면 다음 스타터 파일들이 보입니다:

```
my-first-plugin/
├── code.ts          ← 플러그인 Core 로직 (TypeScript)
├── ui.html          ← 플러그인 UI (HTML)
├── manifest.json    ← 플러그인 설정 파일
├── package.json     ← 의존성 및 스크립트 정의
└── tsconfig.json    ← TypeScript 컴파일 설정
```

---

## 4단계: 프로젝트 의존성 설치

처음 프로젝트를 열면 일부 오류가 표시될 수 있습니다. 아래 순서로 의존성을 설치합니다.

### 4-1. Node.js와 npm 설치

> **Node.js**: 브라우저 밖에서 JavaScript를 실행하는 런타임
> **npm**: Node.js의 기본 패키지 매니저

[nodejs.org](https://nodejs.org/en/) 에서 Node.js를 다운로드합니다.

설치 시:
- *"Automatically install the necessary tools"* 체크 후 **Next** 클릭
- **Install** → **Finish** 클릭

**설치 확인 방법:**
```bash
# VS Code 터미널 (Terminal > New terminal)에서 실행
node -v
# 버전 번호가 출력되면 성공
# Ctrl+C를 두 번 눌러 Node 종료
```

### 4-2. TypeScript (자동 포함)

Figma는 플러그인 개발에 **TypeScript** 사용을 권장합니다.

이유:
- [Plugin API 타이핑 파일](https://developers.figma.com/docs/plugins/api/typings/) 제공
- VS Code에서 자동완성(IntelliSense) 지원
- 타입 에러를 코딩 중에 미리 발견 가능

`package.json`의 `devDependencies`에는 다음이 이미 포함되어 있습니다:

```json
"devDependencies": {
  "typescript": "...",
  "@figma/plugin-typings": "...",
  "eslint": "...",
  "@typescript-eslint/eslint-plugin": "...",
  "@typescript-eslint/parser": "...",
  "@figma/eslint-plugin-figma-plugins": "..."
}
```

**설치 확인 방법:**
```bash
tsc -v
# 버전 번호가 출력되면 성공
```

### 4-3. 플러그인 린터 (자동 포함)

Figma는 [eslint-plugin-figma-plugins](https://github.com/figma/eslint-plugin-figma-plugins) 를 통해
플러그인 전용 TypeScript-ESLint 규칙을 제공합니다.

- 코드 오류를 조기에 발견
- 많은 경우 자동 수정(Auto-fix)도 지원

`package.json`에 포함된 ESLint 설정 예시:

```json
"eslintConfig": {
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@figma/figma-plugins/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "root": true,
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  }
}
```

### 4-4. 의존성 일괄 설치

```bash
# VS Code 터미널에서 실행
npm install
```

설치 완료 후:
- 파일 오류 표시가 사라짐
- Explorer에 `node_modules` 폴더가 생성됨

---

## 5단계: TypeScript 컴파일 설정

Figma 플러그인은 브라우저에서 실행되므로, TypeScript는 **반드시 JavaScript로 컴파일** 되어야 합니다.
`manifest.json`의 `main` 필드는 항상 `.js` 파일을 가리킵니다.

```
code.ts  →  [TypeScript 컴파일]  →  code.js  →  Figma가 실행
```

### 자동 Watch 모드 설정 (파일 변경 시 자동 컴파일)

1. `Ctrl+Shift+B` (Windows) 또는 `Command+Shift+B` (Mac) 를 누릅니다.
2. **watch-tsconfig.json** 을 선택합니다.

> 💡 **참고**: VS Code를 종료하거나 프로젝트 폴더를 닫을 때마다 이 명령을 다시 실행해야 합니다.

---

## 6단계: 샘플 플러그인 실행하기

1. Figma 데스크톱 앱에서 2단계에서 만든 디자인 파일을 엽니다.
2. **Plugins > Development > [플러그인 이름]** 을 선택합니다.
3. 플러그인 모달이 팝업되면 **Create** 를 클릭합니다.

캔버스에 **주황색 사각형 5개**가 생성되면 성공입니다! 🎉

---

## 7단계: Hot Reloading (핫 리로딩)

Figma는 개발 속도를 높이기 위한 **핫 리로딩** 기능을 제공합니다.

- **켜짐(On)**: 코드를 수정하고 다시 빌드하면 플러그인이 자동으로 최신 코드로 재시작
- **꺼짐(Off)**: 코드 변경 후 플러그인을 수동으로 재시작해야 함

메뉴 **Plugins > Development** 에서 핫 리로딩 설정을 변경할 수 있습니다.

---

## 다음 단계

설정이 완료되었다면 첫 번째 플러그인 코딩을 시작할 수 있습니다!

- 📹 [Build Your First Plugin 영상 시리즈 (YouTube)](https://www.youtube.com/watch?v=-JAphRkjV9g&list=PLXDU_eVOJTx5YBAszyuOTyxlgIxkQVyii)
- 📹 [4번째 영상: 첫 플러그인 코딩 시작하기](https://www.youtube.com/watch?v=ExwP3Kmh-vI)
- 📖 [Plugin API 전체 레퍼런스](https://developers.figma.com/docs/plugins/api/)
- 📖 [에디터 타입 설정 가이드](https://developers.figma.com/docs/plugins/setting-editor-type/)

---

## 핵심 요약

```
1. Figma 데스크톱 앱 + VS Code 설치
2. Plugins > Development > New plugin으로 새 플러그인 생성
3. VS Code에서 폴더 열기
4. npm install (TypeScript, typings, ESLint 포함)
5. Ctrl/Cmd + Shift + B → watch-tsconfig.json 선택 (자동 컴파일)
6. Figma에서 Plugins > Development > [플러그인명]으로 실행
```
