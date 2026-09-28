# UI Flow Diagram 플러그인 — 코드 리뷰 / 버그 리포트

> **작성일**: 2026-09-28
> **범위**: `src/ui/` 전체 (17개 TSX/TS 파일) + `src/ui/styles.css` (4,370줄) + `src/code.ts`, `src/types.ts`, `src/customConnector.ts`
> **총 식별**: 74개 이상 버그/문제점
>
> ⚠️ **1차 검증 완료 (2026-09-28)**: 각 항목의 현재 코드 대조 판정(CONFIRMED / PARTIAL / FALSE POSITIVE)과 수정 방향이 [`VERIFICATION_REPORT.md`](VERIFICATION_REPORT.md)에 정리되어 있습니다. **수작업 전 반드시 해당 문서를 참고하세요.** 특히 C-15, C-31은 FALSE POSITIVE(수정 제외), C-04, C-20, M-07, L-07은 PARTIAL(범위 축소)입니다.

---

## 📋 목차

- [🔴 Critical — 기능 깨짐 / 데이터 손실](#critical)
- [🟡 Medium — CSS / 테마 / 일관성 문제](#medium)
- [🟢 Low — 코드 품질 / 유지보수](#low)
- [📊 요약 및 수정 우선순위](#summary)
- [📁 분석 대상 파일 목록](#files)

---

<a id="critical"></a>

## 🔴 Critical — 기능 깨짐 / 데이터 손실

### C-01. 3자리 hex `padStart(6,'0')` 오용 (5개 모달 공통)

**문제**: 3자리 hex(예: `"F00"`)를 `padStart(6, '0')`으로 확장하면 **앞자리**에 0이 채워져 `#000F00`이 됩니다(정답: `#FFFF00`). `padStart`는 왼쪽 패딩이라 3자리 hex 확장에 부적합합니다.

| 파일                                               | 라인     |
| -------------------------------------------------- | -------- |
| `src/ui/components/modals/ConnectorColorModal.tsx` | 121      |
| `src/ui/components/modals/FillColorModal.tsx`      | 99       |
| `src/ui/components/modals/StrokeColorModal.tsx`    | 120      |
| `src/ui/components/modals/StyleModal.tsx`          | 123, 124 |

**수정**:

```ts
// ❌ 현재
hex.length === 3 ? "#" + hex.padStart(6, "0") : hex;

// ✅ 수정
hex.length === 3
  ? "#" +
    hex
      .split("")
      .map((c) => c + c)
      .join("")
  : hex;
```

---

### C-02. `parseInt` vs `parseFloat` — stroke weight 소수점 유실

**문제**: stroke weight는 `1.5` 같은 소수값이 가능하지만 `parseInt`는 소수점을 버립니다.

| 파일                                            | 라인 |
| ----------------------------------------------- | ---- |
| `src/ui/components/modals/StrokeColorModal.tsx` | 211  |
| `src/ui/components/modals/StyleModal.tsx`       | 336  |

**수정**: `parseInt(e.target.value)` → `parseFloat(e.target.value)`

---

### C-03. Enter + blur 이중 커밋 (3곳)

**문제**: Enter 키로 커밋 후 `blur()`이 호출되면 `onBlur` 핸들러가 **다시** 커밋합니다.

| 파일                                                 | 라인     |
| ---------------------------------------------------- | -------- |
| `src/ui/components/node/FigmaLinkSection.tsx`        | 130-139  |
| `src/ui/components/appearance/StepBadgesSection.tsx` | 422-427  |
| `src/ui/components/appearance/StyleSection.tsx`      | 440, 486 |

**수정**: Enter 핸들러에서 `e.currentTarget.blur()` 제거 또는 `onBlur`에서 중복 커밋 방지 플래그 사용

---

### C-04. Cancel 시 초기값 재적용 (3개 모달)

**문제**: Cancel은 단순히 닫아야 하는데 `onApply(initialColor)`를 호출합니다. `initialColor`가 `'None'` 또는 mixed일 때 **무효 값을 색상으로 적용**합니다.

| 파일                                               | 라인 |
| -------------------------------------------------- | ---- |
| `src/ui/components/modals/ConnectorColorModal.tsx` | 110  |
| `src/ui/components/modals/FillColorModal.tsx`      | 91   |
| `src/ui/components/modals/StrokeColorModal.tsx`    | 114  |

**수정**: Cancel 핸들러에서 `onApply` 호출 제거, `onClose()`만 호출

---

### C-05. `elevation >= 0` 항상 true

**위치**: `src/ui/context/AppContext.tsx:1115`

**문제**: `first.elevation >= 0`은 elevation이 0이어도 true. `> 0`이어야 합니다.

**수정**: `first.elevation >= 0` → `first.elevation > 0`

---

### C-06. `Boolean(...)` getter 항상 true

**위치**: `src/ui/utils/selectionUtils.ts:133,140,146,148`

**문제**: `Boolean(node.prop)` getter는 속성이 없어도 `true` 반환 → `hasValue`가 항상 true. `src/ui/components/node/DescriptionSection.tsx:72`의 `anyHasDesc`에 연쇄 영향.

**수정**: `Boolean(node.prop)` → `node.prop != null && node.prop !== ''`

---

### C-07. `Date.now()` ID 충돌

**위치**: `src/ui/context/AppContext.tsx:599,651`

**문제**: `size-${Date.now()}` / `style-${Date.now()}`. 같은 밀리초에 2회 호출 시 ID 충돌 → 프리셋 데이터 손실.

**수정**: `crypto.randomUUID()` 또는 인크리먼트 카운터 사용

---

### C-08. 정적 SVG clipPath ID

**위치**: `src/ui/components/shared/icons.tsx:151-174`

**문제**: `ic_orth`, `ic_sc`, `ic_cv` 정적 ID. 다중 인스턴스 렌더링 시 DOM ID 중복 → 클립 패스 교란.

**수정**: React `useId()` 또는 `Math.random()` 기반 동적 ID

---

### C-09. `theme: 'light'` 하드코딩

**위치**: `src/ui/context/AppContext.tsx:583,935,943,961`

**문제**: 다크 테마가 무시되고 항상 light로 생성.

**수정**: 실제 현재 테마 값 전달

---

### C-10. `colorEl?.value || '#000000'`

**위치**: `src/ui/context/AppContext.tsx:831`

**문제**: DOM 요소가 없으면 **검은색으로 조용히 기본값 설정**.

**수정**: null 체크 후 적절한 fallback 또는 에러 처리

---

### C-11. `finalStrokeWeight`/`finalStrokeColor` undefined 가능

**위치**: `src/ui/context/AppContext.tsx:552,555`

**문제**: undefined가 플러그인 코어로 전달될 수 있음.

**수정**: undefined 가드 또는 명시적 기본값

---

### C-12. `as any` 캐스트

**위치**: `src/ui/context/AppContext.tsx:968-970`

**문제**: `badgePosition`/`badgeShape`/`badgeColorMode`에 타입 안전성 우회.

**수정**: 타입 정의 보완 후 캐스트 제거

---

### C-13. 선택된 노드 중 처음 2개만 연결

**위치**: `src/ui/context/AppContext.tsx:844-845`

**문제**: `sourceNodeId: nodes[0].id, targetNodeId: nodes[1].id`. 3개 이상 선택 시 나머지 무시.

**수정**: 다중 선택 시 사용자 피드백 또는 첫 2개만 명시적 선택

---

### C-14. 제목 조용히 잘림

**위치**: `src/ui/context/AppContext.tsx:526,878`

**문제**: `rawTitle.slice(0, 32)` 사용자 피드백 없이 잘림.

**수정**: 잘림 시 toast 알림 또는 UI에서 표시

---

### C-15. `msg.currentStatus` dead code

**위치**: `src/ui/hooks/useFigmaMessage.ts:68`

**문제**: `SELECTION_CHANGED` 메시지 타입에 `currentStatus` 필드가 없음.

**수정**: 타입 정의에 필드 추가 또는 코드 제거

---

### C-16. `defaultValue` stale

**위치**: `src/ui/App.tsx:328`

**문제**: uncontrolled input의 `defaultValue`는 마운트 시에만 적용. 선택 변경 시 stale title 표시.

**수정**: controlled input으로 전환 또는 `key` prop으로 리마운트

---

### C-17. `window._titleDebounce` 전역 해킹

**위치**: `src/ui/App.tsx:330-333`

**문제**: `window` 전역 프로퍼티에 타이머 ID 저장.

**수정**: `useRef` 또는 `useMemo`로 관리

---

### C-18. `document.getElementById` 직접 DOM 조작 (React state 이중 관리)

| 파일                                               | 라인                  |
| -------------------------------------------------- | --------------------- |
| `src/ui/components/node/TypeSection.tsx`           | 113-120 (8개 요소)    |
| `src/ui/components/connection/ConnectionPanel.tsx` | 20-88 (8개 요소)      |
| `src/ui/components/connection/ConnectSection.tsx`  | 895-900, 983-996      |
| `src/ui/components/appearance/SizeSection.tsx`     | 276-280 (합성 이벤트) |
| `src/ui/context/AppContext.tsx`                    | 831                   |

**수정**: React state/ref로 관리, 직접 DOM 접근 제거

---

### C-19. `selectedNodes` 배열을 useEffect deps에 사용

**위치**: `src/ui/components/connection/ConnectionPanel.tsx:91`

**문제**: 참조 변경 시마다 재실행 → 불필요한 DOM 조작 반복.

**수정**: `selectedNodes.length` 또는 필요한 개별 값만 deps에 사용

---

### C-20. `linkOn`/`linkUrl` dead feature

**위치**: `src/ui/components/connection/LinkSection.tsx:14,34`

**문제**: 토글/URL 상태가 실제 플러그인 동작에 연결되지 않음.

**수정**: 플러그인 코어에 연결하거나 UI 제거

---

### C-21. `isOn` 상태가 선택 변경 시 동기화되지 않음

**위치**: `src/ui/components/connection/LinkSection.tsx:10`

**문제**: 선택 변경 후 stale 상태 유지.

**수정**: `useEffect`로 선택 변경 시 상태 동기화

---

### C-22. `setUIState` 중복 호출

**위치**: `src/ui/components/connection/ConnectSection.tsx:564,571-573`

**문제**: `selectedConnectorColor` 중복 설정.

**수정**: 중복 호출 제거

---

### C-23. `connectedNodeNames` 첫 번째 노드만 사용

**위치**: `src/ui/components/connection/ConnectSection.tsx:672`

**문제**: 복수 커넥터 선택 시 첫 노드의 이름만 표시.

**수정**: 모든 선택된 노드 이름 표시

---

### C-24. 네이티브 컬러 입력 검은색 기본값

**위치**: `src/ui/components/connection/ConnectSection.tsx:793`

**문제**: `value={selectedColor.length === 7 ? selectedColor : '#000000'}` — 유효하지 않은 값일 때 검은색으로 표시.

**수정**: 유효하지 않을 때 placeholder 또는 mixed 표시

---

### C-25. onBlur/onKeyDown clamp 로직 중복

**위치**: `src/ui/components/connection/ConnectSection.tsx:903-928`

**문제**: 동일한 0.5-10 clamp 로직 2곳에 중복.

**수정**: 공통 유틸 함수로 추출

---

### C-26. radius max 값 불일치

**위치**: `src/ui/components/appearance/SizeSection.tsx:332` vs `193-194`

**문제**: max 값이 서로 다름.

**수정**: 일관된 max 값 사용

---

### C-27. 합성 이벤트 디스패치

**위치**: `src/ui/components/appearance/SizeSection.tsx:276-280`

**문제**: hidden input에 `dispatchEvent(new Event('change'))`.

**수정**: React state로 직접 관리

---

### C-28. 하드코딩된 색상/ID

| 위치                                                     | 문제                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/ui/components/appearance/StepBadgesSection.tsx:142` | `'#E11D48'` 하드코딩                                               |
| `src/ui/components/node/PhaseSection.tsx:109`            | `phase?.color \|\| '#EA2039'`                                      |
| `src/ui/App.tsx:262`                                     | `'none'` phase에 `'#EA2039'`                                       |
| `src/ui/context/AppContext.tsx:686`                      | `target?.id === 'style-white' \|\| 'style-black'` 하드코딩 ID 체크 |

**수정**: 테마/디자인 토큰으로 대체

---

### C-29. status 조용히 제거

**위치**: `src/ui/context/AppContext.tsx:966`

**문제**: 설명이 허용되지 않는 노드 타입에서 status가 조용히 제거됨.

**수정**: 사용자 피드백 또는 명시적 정책 문서화

---

### C-30. Settings 버튼 no-op

**위치**: `src/ui/App.tsx:354`

**문제**: `showToast('Settings 메뉴입니다.')`만 호출, 실제 기능 없음.

**수정**: 기능 구현 또는 버튼 제거

---

### C-31. `getCtaLabel` dead code

**위치**: `src/ui/App.tsx:41-44`

**문제**: 두 분기 모두 `'Connect'` 반환.

**수정**: 로직 구현 또는 함수 제거

---

### C-32. 텍스트 입력 디바운스 없음

**위치**: `src/ui/components/connection/LabelSection.tsx:38`

**문제**: 매 키스트로크마다 플러그인 호출.

**수정**: 디바운스 (예: 300ms) 적용

---

### C-33. `showToast` deps에 있지만 미사용

**위치**: `src/ui/hooks/useFigmaMessage.ts:193`

**문제**: useEffect deps 배열에 포함되나 핸들러에서 미사용.

**수정**: deps에서 제거 또는 실제 사용

---

### C-34. `document.execCommand('copy')` deprecated

**위치**: `src/ui/components/node/DescriptionSection.tsx:143`

**문제**: deprecated API fallback.

**수정**: `navigator.clipboard.writeText()` 우선, fallback으로 유지

---

### C-35. 랜덤 mask ID

**위치**: `src/ui/components/shared/icons.tsx:294`

**문제**: `Math.random().toString(36)` 기반 (충돌 확률 낮음).

**수정**: `useId()` 사용

---

### C-36. 복잡한 disabled 로직

**위치**: `src/ui/components/connection/ConnectSection.tsx:1361`

**문제**: 가독성/유지보수 위험.

**수정**: 조건 분해 또는 유틸 함수 추출

---

### C-37. dead code

**위치**: `src/ui/components/appearance/StepBadgesSection.tsx:113-138`

**문제**: `isHexHighSaturation`/`isHexDark` 미사용.

**수정**: 제거 또는 사용

---

<a id="medium"></a>

## 🟡 Medium — CSS / 테마 / 일관성 문제

### M-01. 다크모드 클래스 불일치 (4~5가지 선택자 혼용)

`src/ui/styles.css`에서 다크모드를 나타내는 선택자가 **4~5가지**로 혼용됩니다:

| 선택자                 | 라인              |
| ---------------------- | ----------------- |
| `body.figma-dark-auto` | 81-108, 2233-2250 |
| `body.figma-dark`      | 2158-2182         |
| `.figma-dark`          | 2158-2182         |
| `.theme-dark`          | 834-845           |
| `[data-theme="dark"]`  | 2158-2182         |

**수정**: 한 곳만 통일 (예: `[data-theme="dark"]`)

---

### M-02. 하드코딩된 라이트 색상 (다크모드 변형 없음)

| 선택자                     | 라인                                       | 색상                |
| -------------------------- | ------------------------------------------ | ------------------- |
| `.phase-dropdown-btn`      | 1012-1036                                  | `#ffffff` 배경      |
| focus 배경                 | 1150-1153, 1229-1233, 1351-1355            | `#ffffff`           |
| `.corner-btn.active` 등    | 2010-2014, 2050-2055, 2382-2387, 2418-2422 | `#ffffff`           |
| `.node-preview-card`       | 2075-2099                                  | `#ffffff` 배경      |
| `.anchor-handle`           | 2102-2116                                  | `#ffffff`           |
| `.elevation-inner-box`     | 1910-1918                                  | `#ffffff`           |
| `.btn-outline-action`      | 2790-2801                                  | `#ffffff`           |
| `.btn-cta-secondary:hover` | 2667-2670                                  | `#f5f5f5`           |
| 8개 status active          | 854-1007                                   | `#9CA3AF`~`#374151` |

**수정**: CSS 변수로 대체, 다크모드 변형 추가

---

### M-03. 프라이머리 컬러 fallback 불일치

| 선택자                             | 라인      | fallback                                         |
| ---------------------------------- | --------- | ------------------------------------------------ |
| `.conn-modal-hex-box:focus-within` | 4110-4113 | `var(--color-border-selected, #0d99ff)` **파랑** |
| `.conn-btn-save`                   | 4354-4366 | `var(--color-primary, #0d99ff)` **파랑**         |
| `.conn-btn-save:hover`             | 4368-4370 | `var(--color-primary-hover, #008ae6)` **파랑**   |

**문제**: 앱 전체는 **보라 `#8C4CF6`**를 프라이머리로 사용하는데, Connector Color 모달만 **파랑 `#0d99ff`** fallback을 사용합니다.

**수정**: `#0d99ff` → `#8C4CF6`, `#008ae6` → `#7A39E3`

---

### M-04. 취약한 CSS 선택자

| 패턴                            | 라인                        | 문제                                                 |
| ------------------------------- | --------------------------- | ---------------------------------------------------- |
| `input[placeholder="Mixed"]`    | 1288-1326                   | placeholder 텍스트에 결합, 20+ 선택자 + `!important` |
| `data-color="#ffffff"`          | 1811, 4044-4081             | 정확한 hex 문자열에 결합                             |
| `.dark` / `:not(.light)` 클래스 | 2275-2302                   | 클래스 기반 다크모드, 취약                           |
| `:has()` 선택자                 | 457-464, 588-595, 716, 1254 | 모던 CSS, webview 지원 의존                          |

**수정**: `data-*` 속성 또는 CSS 변수로 대체

---

### M-05. 하드코딩된 브랜드/다크 색상 (Figma 스펙상 의도)

| 선택자                                 | 라인                                                  | 색상      |
| -------------------------------------- | ----------------------------------------------------- | --------- |
| `.figma-dropdown-menu`                 | 1457-1475                                             | `#1e1e1e` |
| `.terminal-dropdown-popup` 등 5개      | 2486-2500, 2528-2544, 2829-2843, 2997-3011, 3161-3172 | `#1e1e1e` |
| `.phase-modal-footer`                  | 3477-3487                                             | `#1E1E1E` |
| `.size-modal-card`/`.style-modal-card` | 3552-3564                                             | `#1E1E1E` |
| `.figma-tooltip`                       | 3909-3927                                             | `#222222` |
| `.conn-color-modal-card`               | 3981-3994                                             | `#1e1e1e` |
| `.conn-color-wheel-gap`                | 4258-4265                                             | `#1e1e1e` |
| `.btn-phase-modal-save`                | 3504-3515                                             | `#8C4CF6` |
| `.btn-phase-modal-save:hover`          | 3517-3519                                             | `#7A39E3` |
| `.btn-phase-modal-delete`              | 3526-3537                                             | `#EA2039` |
| `.style-modal-card .style-color-chip`  | 3767-3777                                             | `#EA2039` |
| `.phase-color-preview-chip`            | 3341-3350                                             | `#EA2039` |
| `.figma-btn-24:hover`                  | 2753-2756                                             | `#7320d6` |
| hover `#8C4CF6`                        | 2522-2525, 2866-2869, 3045-3049                       | `#8C4CF6` |

**수정**: CSS 변수로 통일

---

### M-06. 하드코딩된 입력 배경

| 선택자                               | 라인      | 색상                     |
| ------------------------------------ | --------- | ------------------------ |
| `.prefix-input-box`                  | 3616-3628 | `#383838`                |
| `.icon-input-box`                    | 3659-3670 | `#383838`                |
| `.size-dropdown-box`                 | 3690-3706 | `#383838`                |
| `.style-modal-card .style-color-box` | 3740-3754 | `#383838`                |
| `.stroke-width-box`                  | 3813-3826 | `#2c2c2c`                |
| `.style-divider`                     | 3837-3843 | `#383838`                |
| `.conn-modal-hex-box`                | 4091-4104 | `#2c2c2c`                |
| `.phase-text-input`                  | 3271-3284 | `#383838`                |
| `.phase-color-picker-box`            | 3298-3312 | `#383838`                |
| `.picker-search-box`                 | 3956-3968 | `rgba(255,255,255,0.05)` |

**수정**: CSS 변수로 통일

---

### M-07. 중복 CSS 규칙

| 선택자                          | 라인                  |
| ------------------------------- | --------------------- |
| `.phase-color-picker-box:hover` | 3314-3316 + 3324-3326 |
| `.phase-color-picker-box:focus` | 3318-3322 + 3328-3330 |

**수정**: 중복 제거

---

### M-08. 기타 CSS

| 위치                          | 문제                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `styles.css:164`              | `*` 선택자에 `letter-spacing: 0 !important` 전역 적용 |
| `styles.css:189-199`          | `html/body` `overflow: hidden !important`             |
| `styles.css:3421-3434` 등 6곳 | 컬러 피커 핸들 `border: solid #ffffff` (의도됨)       |

---

<a id="low"></a>

## 🟢 Low — 코드 품질 / 유지보수

| #    | 위치                                                         | 문제                                                 |
| ---- | ------------------------------------------------------------ | ---------------------------------------------------- |
| L-01 | `src/ui/App.tsx:204-224`                                     | `handleRootClick` selector 목록이 길고 유지보수 위험 |
| L-02 | `src/ui/components/connection/ConnectSection.tsx:1361`       | 복잡한 disabled 로직                                 |
| L-03 | `src/ui/components/shared/icons.tsx:294`                     | 랜덤 mask ID (충돌 확률 낮음)                        |
| L-04 | `src/ui/components/node/DescriptionSection.tsx:143`          | `document.execCommand('copy')` deprecated            |
| L-05 | `src/ui/components/appearance/StepBadgesSection.tsx:113-138` | dead code `isHexHighSaturation`/`isHexDark`          |
| L-06 | `src/ui/hooks/useFigmaMessage.ts:193`                        | `showToast` deps에 포함되나 미사용                   |
| L-07 | `src/ui/App.tsx:41-44`                                       | `getCtaLabel` dead code (두 분기 동일 반환)          |

---

<a id="summary"></a>

## 📊 요약 및 수정 우선순위

### 심각도별 개수

| 심각도                              | 개수    |
| ----------------------------------- | ------- |
| 🔴 Critical (기능 깨짐/데이터 손실) | 37      |
| 🟡 Medium (CSS/테마/일관성)         | ~30     |
| 🟢 Low (코드 품질)                  | 7       |
| **합계**                            | **~74** |

### 핵심 수정 우선순위

| 순위 | 항목                                              | 영향도                                           |
| ---- | ------------------------------------------------- | ------------------------------------------------ |
| 1    | **C-01**: 3자리 hex `padStart` 버그               | 5개 모달에서 잘못된 색상 생성 (사용자 직접 체감) |
| 2    | **C-04**: Cancel 시 초기값 재적용                 | `'None'`이 색상으로 적용되는 치명적 버그         |
| 3    | **C-03**: Enter+blur 이중 커밋                    | 3곳에서 중복 apply                               |
| 4    | **C-02**: `parseInt` → `parseFloat`               | stroke weight 소수점 유실                        |
| 5    | **C-05**: `elevation >= 0` → `> 0`                | 논리 오류                                        |
| 6    | **C-06**: `Boolean(...)` getter                   | `hasValue` 항상 true                             |
| 7    | **C-07**: `Date.now()` ID → `crypto.randomUUID()` | 프리셋 데이터 손실                               |
| 8    | **C-08**: 정적 SVG clipPath ID → `useId()`        | 다중 인스턴스 렌더링 교란                        |
| 9    | **C-09**: `theme: 'light'` 하드코딩               | 다크 테마 무시                                   |
| 10   | **M-01**: CSS 다크모드 클래스 통일                | 4~5가지 선택자 혼용                              |
| 11   | **M-03**: CSS 프라이머리 fallback 통일            | `#0d99ff` → `#8C4CF6`                            |

---

<a id="files"></a>

## 📁 분석 대상 파일 목록

### 코어 플러그인

- `src/code.ts` — 플러그인 메인 로직
- `src/types.ts` — 타입 정의
- `src/customConnector.ts` — 커스텀 커넥터

### UI 상태 관리

- `src/ui/context/AppContext.tsx` — 전역 상태 (1,100+ 줄)
- `src/ui/hooks/useFigmaMessage.ts` — Figma 메시지 처리
- `src/ui/hooks/useAutoResize.ts` — 자동 리사이즈
- `src/ui/hooks/useSelectionSummary.ts` — 선택 요약
- `src/ui/utils/selectionUtils.ts` — 선택 유틸

### UI 컴포넌트

- `src/ui/App.tsx` — 앱 루트
- `src/ui/index.tsx` — 진입점
- `src/ui/components/node/` — 노드 패널 (5개)
- `src/ui/components/connection/` — 커넥션 패널 (5개)
- `src/ui/components/appearance/` — 외관 패널 (5개)
- `src/ui/components/modals/` — 모달 (7개)
- `src/ui/components/popovers/` — 팝오버 (2개)
- `src/ui/components/shared/` — 공용 컴포넌트 (6개)

### 스타일

- `src/ui/styles.css` — 4,370줄

---

## 📝 새 세션에서 이어서 작업하기

이 문서를 새 세션에서 열면 다음을 수행할 수 있습니다:

1. **우선순위 순으로 버그 수정**: "C-01부터 C-05까지 수정해줘"
2. **특정 영역 집중**: "모달 관련 버그(C-01, C-02, C-04)만 수정해줘"
3. **CSS 정리**: "M-01~M-08 CSS 문제를 정리해줘"
4. **전체 리팩토링**: "Critical 항목 전체를 수정해줘"

각 항목에 파일 경로와 라인 번호가 명시되어 있어 바로 수정에 착수할 수 있습니다.
