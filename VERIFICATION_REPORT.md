# UI Flow Diagram 플러그인 — 1차 검증 보고서

> **용도**: `BUG_REPORT.md`의 전 항목을 현재 코드와 대조 검증한 결과.
> 향후 버그 수정 작업 시 이 문서의 **판정**과 **근거 라인**을 기준으로 수정 범위를 결정하세요.
>
> - 검증일: 2026-09-28
> - 검증 대상: `BUG_REPORT.md` C-01~C-37, M-01~M-08, L-01~L-07 (총 52건)
> - 검증 방식: 코드 정적 대조 (코드 수정 없음)
> - 판정 기준: CONFIRMED / PARTIAL / FALSE POSITIVE / ALREADY FIXED / DESIGN INTENT

---

## 📌 수정 작업 시 반드시 확인할 사항

1. **FALSE POSITIVE 항목(C-15, C-31)은 수정하지 말 것** — 현재 코드는 정상 동작.
2. **PARTIAL 항목(C-04, C-20, M-07, L-07)은 사실인 부분만 수정** — 아래 근거를 참고해 범위를 좁힐 것.
3. **L-02~L-06은 C-33~C-37의 중복 보고** — 한 번만 수정하면 됨.
4. **공통 원인 그룹(A~H) 단위로 묶어 수정** — 같은 루트 원인의 항목은 한 번의 수정으로 함께 해결됨.
5. 수정 후 `BUG_REPORT.md`의 해당 항목에 판정 결과를 주석으로 기록할 것.

---

## 1. 검증 결과 요약

| 판정              | 개수 | 항목                   |
| ----------------- | ---- | ---------------------- |
| ✅ CONFIRMED      | 46   | 아래 2~5절             |
| ⚠️ PARTIAL        | 4    | C-04, C-20, M-07, L-07 |
| ❌ FALSE POSITIVE | 2    | C-15, C-31             |
| 🔧 ALREADY FIXED  | 0    | —                      |
| 🎨 DESIGN INTENT  | 0    | —                      |

---

## 2. Critical 검증 결과 (공통 원인 그룹별)

### Group A. 3자리 hex 확장 버그 — `padStart(6,'0')`

| 항목 | 판정         | 근거                                                                                                                                                                                                                                              |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | ✅ CONFIRMED | `src/ui/components/modals/ConnectorColorModal.tsx:121,126`, `FillColorModal.tsx:99`, `StrokeColorModal.tsx:89,97,102,120`, `StyleModal.tsx:123` — `"F00".padStart(6,'0')` → `"000F00"` (좌측 패딩). 정답은 문자별 2배(`"FFFF00"`). 5개 모달 공통. |

**수정 방향**: `hex.replace(/^#?([0-9a-f]{3})$/i, m => '#' + m[1].split('').map(c => c + c).join(''))` 형태의 문자별 확장으로 교체.

### Group B. 모달 커밋/캔슬 시맨틱

| 항목 | 판정         | 근거                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-03 | ✅ CONFIRMED | `FigmaLinkSection.tsx:130` (Enter→`commitUrl`+blur, blur→`commitUrl` 재발화; 단 `commitUrl`(80행)은 멱등이라 영향 완화), `StepBadgesSection.tsx:421`, `StyleSection.tsx:439` (fill) / `:485` (stroke)                                                                                                                                                 |
| C-04 | ⚠️ PARTIAL   | `FillColorModal.tsx:90` (cancel 시 무조건 `onApply(initialColor)`), `StrokeColorModal.tsx:113`, `ConnectorColorModal.tsx:108` (`!initialIsMixed` 가드 있음), `StyleModal.tsx:352` (cancel은 닫기만 — 해당 없음). 모달이 실시간 프리뷰(`onApply` 즉시 호출) 구조라 cancel=롤백은 부분적 의도. 실제 버그는 **'None' 상태가 초기 색상으로 롤백되는 점**. |

**수정 방향**:

- C-03: Enter 처리 후 `e.currentTarget.blur()` 제거 또는 blur 핸들러에서 중복 커밋 가드.
- C-04: cancel 시 'None' 상태가 초기 색상으로 롤백되지 않도록 `initialIsNone` 가드 추가 (FillColorModal/StrokeColorModal).

### Group C. 숫자 파싱 / clamp

| 항목 | 판정         | 근거                                                                                           |
| ---- | ------------ | ---------------------------------------------------------------------------------------------- |
| C-02 | ✅ CONFIRMED | `StrokeColorModal.tsx:211` `parseInt(e.target.value, 10) \|\| 0` (1.5→1), `StyleModal.tsx:336` |
| C-25 | ✅ CONFIRMED | `ConnectSection.tsx:903` (onBlur) / `:915` (onKeyDown) clamp 로직 중복                         |
| C-26 | ✅ CONFIRMED | `SizeSection.tsx:193` (max 999) vs `:332` (max 20) — radius 상한 불일치                        |

**수정 방향**: `parseInt` → `parseFloat`; clamp 로직을 공통 함수로 추출; radius max 값을 통일 (20 또는 999 중 하나).

### Group D. DOM 기반 상태 이중 관리 (공통 루트 원인)

| 항목 | 판정                  | 근거                                                                                                                                                                                                                         |
| ---- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-18 | ✅ CONFIRMED (전역적) | `AppContext.tsx:827` (DOM `toggle-conn-link`/`input-conn-link-url` 읽기), `useFigmaMessage.ts:52~131` (DOM 직접 쓰기), `ConnectionPanel.tsx:20`, `SizeSection.tsx:206`, `App.tsx:198` 등 — React state와 DOM value 이중 관리 |
| C-16 | ✅ CONFIRMED          | `App.tsx:328` `defaultValue={...}` — 선택 변경 시 stale                                                                                                                                                                      |
| C-17 | ✅ CONFIRMED          | `App.tsx:331` `(window as any)._titleDebounce` 전역 해킹                                                                                                                                                                     |
| C-20 | ⚠️ PARTIAL            | `LinkSection.tsx:14,34`는 `lastConnectorConfig`에 쓰지만, 읽기 경로는 DOM(`AppContext.tsx:837`) — dead code가 아닌 **이중 관리**                                                                                             |
| C-21 | ✅ CONFIRMED          | `LinkSection.tsx:10` `useState(false)` — 선택 변경 시 동기화 useEffect 없음                                                                                                                                                  |
| C-27 | ✅ CONFIRMED          | `SizeSection.tsx:279` `dispatchEvent(new Event('change'))` 합성 이벤트                                                                                                                                                       |
| C-32 | ✅ CONFIRMED          | `LabelSection.tsx:35` — 매 키스트로크 `setTimeout(..., 0)` apply, 디바운스 없음                                                                                                                                              |

**수정 방향**: DOM 직접 접근을 React state/props로 대체하는 것이 근본 해결이나, 리스크가 크므로 단기적으로는 (1) C-16 `defaultValue`→`value`+`onChange`, (2) C-17 전역 debounce를 ref로 이동, (3) C-21 동기화 useEffect 추가, (4) C-32 디바운스 적용.

### Group E. 선택 요약 / apply 로직

| 항목 | 판정         | 근거                                                                                             |
| ---- | ------------ | ------------------------------------------------------------------------------------------------ |
| C-05 | ✅ CONFIRMED | `AppContext.tsx:1115` `elevation >= 0` 항상 true                                                 |
| C-06 | ✅ CONFIRMED | `selectionUtils.ts:133` `Boolean(n.status)` getter — `undefined` 반환 불가, `hasValue` 항상 true |
| C-13 | ✅ CONFIRMED | `AppContext.tsx:844` — `nodes[0]`/`nodes[1]`만 연결                                              |
| C-23 | ✅ CONFIRMED | `ConnectionPanel.tsx:37` — `selectedNodes[0]?.connectedNodeNames` 첫 노드만                      |
| C-29 | ✅ CONFIRMED | `AppContext.tsx:574` — apply payload에 status 누락                                               |

**수정 방향**: C-05 `> 0`; C-06 getter가 `undefined` 반환 가능하도록 수정; C-13/C-23 다중 노드 처리; C-29 payload에 status 포함.

### Group F. ID 생성 / 충돌

| 항목 | 판정         | 근거                                                                     |
| ---- | ------------ | ------------------------------------------------------------------------ |
| C-07 | ✅ CONFIRMED | `AppContext.tsx:599,651` — `Date.now()` ID (동시 생성 시 충돌)           |
| C-08 | ✅ CONFIRMED | `icons.tsx:151,154,161,164,171,174` — 정적 clipPath ID (`#ic_orth` 등)   |
| C-35 | ✅ CONFIRMED | `icons.tsx:294` — `stroke-mask-${Math.random()}` 랜덤 ID (렌더마다 변동) |

**수정 방향**: C-07 `crypto.randomUUID()`; C-08/C-35 `useId()` 또는 컴포넌트 인스턴스별 안정적 ID.

### Group G. 하드코딩 / 미구현

| 항목 | 판정         | 근거                                                                                            |
| ---- | ------------ | ----------------------------------------------------------------------------------------------- |
| C-09 | ✅ CONFIRMED | `AppContext.tsx:583,935,943,961` — `theme: 'light'` 하드코딩                                    |
| C-10 | ✅ CONFIRMED | `AppContext.tsx:831` — `colorEl?.value \|\| '#000000'`                                          |
| C-11 | ✅ CONFIRMED | `AppContext.tsx:550` — `finalStrokeWeight`/`finalStrokeColor` undefined 가능                    |
| C-12 | ✅ CONFIRMED | `AppContext.tsx:968` — `as any` 캐스트                                                          |
| C-14 | ✅ CONFIRMED | `AppContext.tsx:526,878` — `.slice(0, 32)` 제목 조용히 잘림                                     |
| C-24 | ✅ CONFIRMED | `ConnectSection.tsx:793` — 네이티브 컬러 입력 검은색 기본값                                     |
| C-28 | ✅ CONFIRMED | `StepBadgesSection.tsx:142` `\|\| '#E11D48'`, `App.tsx:262` `'#EA2039'`, `PhaseSection.tsx:109` |
| C-30 | ✅ CONFIRMED | `App.tsx:353` — Settings 버튼 `showToast`만 호출 (no-op)                                        |

**수정 방향**: C-09 현재 테마 감지; C-10/C-11 undefined 가드; C-12 타입 정의; C-14 잘림 시 토스트/표시; C-24 현재 색상 기본값; C-28 상수화; C-30 기능 구현 또는 버튼 제거.

### Group H. 기타 React / 코드 품질

| 항목 | 판정         | 근거                                                                                                          |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| C-19 | ✅ CONFIRMED | `ConnectionPanel.tsx:91` — `selectedNodes` 배열을 useEffect deps에 사용                                       |
| C-22 | ✅ CONFIRMED | `ConnectSection.tsx:564,571` — `setUIState({ selectedConnectorColor })` 중복 호출                             |
| C-33 | ✅ CONFIRMED | `useFigmaMessage.ts:193` — `showToast` deps에 있으나 미사용                                                   |
| C-34 | ✅ CONFIRMED | `DescriptionSection.tsx:143` — `document.execCommand('copy')` (fallback)                                      |
| C-36 | ✅ CONFIRMED | `ConnectSection.tsx:1363` — 복잡한 disabled 로직                                                              |
| C-37 | ✅ CONFIRMED | `StepBadgesSection.tsx:113` `isHexHighSaturation`, `:129` `isHexDark` — 정의만 있고 호출 0건 (전체 검색 확인) |

**수정 방향**: C-19 deps를 원시값으로; C-22 중복 제거; C-33 deps 제거; C-34 fallback 유지하되 주석 명시 (브라우저 호환성); C-36 로직 단순화; C-37 dead code 삭제.

---

## 3. FALSE POSITIVE 항목 (수정 대상에서 제외)

| 항목 | 판정              | 근거                                                                                                                                                                                                                                                                    |
| ---- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-15 | ❌ FALSE POSITIVE | `msg.currentStatus`는 dead code가 아님. `code.ts:1553`에서 `workflow_status` pluginData로 계산, `:1590`에서 SELECTION_CHANGED payload로 전송, `types.ts:384` 타입 정의, `useFigmaMessage.ts:68`에서 `node.status \|\| msg.currentStatus`로 소비 — 전체 데이터 흐름 정상 |
| C-31 | ❌ FALSE POSITIVE | `getCtaLabel`은 dead code가 아님. `App.tsx:32` 정의, `:112`에서 호출, `:450`에서 렌더링. 다만 `:41~44` 내부분기가 둘 다 `'Connect'` 반환하는 중복 분기는 사실 (L-07과 동일 관측)                                                                                        |

---

## 4. Medium 검증 결과 (CSS/테마)

| 항목 | 판정         | 근거                                                                                                                                                             |
| ---- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 | ✅ CONFIRMED | `styles.css:82` `body.figma-dark-auto`, `:111` `body.figma-dark`, `:834` `.theme-dark`, `:1281` `.figma-dark`, `:2158` `[data-theme="dark"]` — 5가지 선택자 혼용 |
| M-02 | ✅ CONFIRMED | `styles.css:1015` `#ffffff`, `:1000` `#16A34A`/`#374151` — 다크모드 변형 없음                                                                                    |
| M-03 | ✅ CONFIRMED | `styles.css:4112,4359` `#0d99ff`, `:4369` `#008ae6` — 앱 프라이머리 `#8C4CF6`과 불일치                                                                           |
| M-04 | ✅ CONFIRMED | `styles.css:1289` `input[placeholder="Mixed"]`, `:2294` `:not(.light)`, 457/588 `:has()` — 취약 선택자                                                           |
| M-05 | ✅ CONFIRMED | `styles.css:1462` `#1e1e1e` — 리포트 자체도 "Figma 스펙상 의도"로 명시 (의도된 하드코딩)                                                                         |
| M-06 | ✅ CONFIRMED | `styles.css:3620` `#383838` 입력 배경 하드코딩                                                                                                                   |
| M-07 | ⚠️ PARTIAL   | `styles.css:3314` = `:3324` `:hover` 규칙 중복은 실재. 그러나 3318 `:focus` vs 3328 `:focus-within`은 다른 의사클래스로 중복 아님                                |
| M-08 | ✅ CONFIRMED | `styles.css:164` `letter-spacing: 0 !important`, `:189` `overflow: hidden`                                                                                       |

**수정 방향**: M-01 단일 선택자 체계로 통일 (예: `body.figma-dark`); M-02~M-06 CSS 변수화; M-03 `#8C4CF6`으로 통일; M-04 클래스 기반 선택자로 교체; M-07 `:hover` 중복만 제거.

---

## 5. Low 검증 결과

| 항목 | 판정         | 근거                                                                                                             |
| ---- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| L-01 | ✅ CONFIRMED | `App.tsx:204` — `handleRootClick` selector 목록 길고 유지보수 위험                                               |
| L-02 | ✅ CONFIRMED | `ConnectSection.tsx:1363` — **C-36과 동일 코드 (중복 보고)**                                                     |
| L-03 | ✅ CONFIRMED | `icons.tsx:294` — **C-35와 동일 코드 (중복 보고)**                                                               |
| L-04 | ✅ CONFIRMED | `DescriptionSection.tsx:143` — **C-34와 동일 코드 (중복 보고)**                                                  |
| L-05 | ✅ CONFIRMED | `StepBadgesSection.tsx:113` — **C-37과 동일 코드 (중복 보고)**                                                   |
| L-06 | ✅ CONFIRMED | `useFigmaMessage.ts:193` — **C-33과 동일 코드 (중복 보고)**                                                      |
| L-07 | ⚠️ PARTIAL   | `App.tsx:41~44` 두 분기 동일 반환(`'Connect'`)은 사실이나, 함수 자체는 사용 중 (C-31 FALSE POSITIVE와 동일 코드) |

---

## 6. 수정 우선순위 (검증 반영 후)

| 순위 | 항목     | 판정              | 비고                                              |
| ---- | -------- | ----------------- | ------------------------------------------------- |
| 1    | C-01     | ✅ CONFIRMED      | 5개 모달 공통 hex 버그 — 사용자 직접 체감         |
| 2    | C-04     | ⚠️ PARTIAL        | 'None' 롤백만 수정 대상 (cancel=롤백 구조는 유지) |
| 3    | C-03     | ✅ CONFIRMED      | 3곳 Enter+blur 이중 커밋                          |
| 4    | C-02     | ✅ CONFIRMED      | `parseInt` → `parseFloat`                         |
| 5    | C-05     | ✅ CONFIRMED      | `>= 0` → `> 0`                                    |
| 6    | C-06     | ✅ CONFIRMED      | getter가 `undefined` 반환 가능하도록 수정         |
| 7    | C-07     | ✅ CONFIRMED      | `Date.now()` → `crypto.randomUUID()`              |
| 8    | C-08     | ✅ CONFIRMED      | 정적 clipPath ID → `useId()`                      |
| 9    | C-09     | ✅ CONFIRMED      | `theme: 'light'` 하드코딩 제거                    |
| 10   | M-01     | ✅ CONFIRMED      | 다크모드 선택자 통일                              |
| 11   | M-03     | ✅ CONFIRMED      | `#0d99ff`/`#008ae6` → `#8C4CF6`                   |
| —    | ~~C-15~~ | ❌ FALSE POSITIVE | **수정 대상에서 제외** (이미 정상 동작)           |
| —    | ~~C-31~~ | ❌ FALSE POSITIVE | **수정 대상에서 제외** (함수 사용 중)             |

---

## 7. 검증 결론

- 52건 중 **46건이 현재 코드에서 재현 가능**함을 확인.
- **C-15, C-31**은 리포트 오류로 정상 동작하는 코드로 확인 → 수정 대상에서 제외.
- **C-04, C-20, M-07, L-07**은 부분적으로만 사실 → 수정 범위 축소 필요.
- **L-02~L-06**은 C-33~C-37의 중복 보고 → 한 번만 수정.
- 공통 원인 그룹(A~H) 단위로 묶어 수정하면 효율적.
