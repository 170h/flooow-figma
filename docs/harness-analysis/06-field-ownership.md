# Harness Engineering 도입 분석 — 06. Field Ownership (폼 필드 상태 소유권 맵)

> **목적:** 각 폼 필드의 **상태 소유권(source of truth)** 과 읽기/쓰기 위치를 명시하여
> "React state만 갱신" / "DOM만 갱신"의 **반쪽 수정**을 방지한다.
> **근거:** INV-05 (02-architecture-invariants.md L84-93), R-01 (03-agent-failure-risks.md L36-46)
> **상위 문서:** [04-harness-architecture-design.md](./04-harness-architecture-design.md) §3 (06 역할), §5 (R-01)
> **검증 게이트:** `npm run check:constraints` (G2, DOM allowlist) + 수동 시나리오

---

## 1. 소유권 모델 (현재 아키텍처)

> **DOM이 폼 값의 source of truth, React state(`lastNodeConfig` / `uiState`)는 캐시/파생.**

- `applyCurrentNodeState`가 **DOM 값을 1차 소스로 읽고**, DOM 부재 시 ref로 폴백.
- 5개 이상 파일이 같은 DOM 필드를 읽기/쓰기 → 소유권 불분명이 `BUG_REPORT.md` 다수 항목의 원인.
- **규칙:** 신규 필드 추가 시 "어느 쪽이 truth인지" 명시. 기존 필드 수정 시 **읽기/쓰기 경로를 모두 찾아 동일 패턴으로** 수정. 반쪽 수정 금지.

> ⚠️ 이 모델은 **현재 상태의 기록**이다. 소유권을 뒤집거나(React를 truth로) 이중 소유를 만들면 INV-05 위반.

---

## 2. 필드별 소유권 맵

> **truth** = 값의 단일 소스 · **DOM ID** = `allowlists.json` `dom_id_registry` 등록 ID · **읽기/쓰기** = 대표 위치
> DOM ID는 `check:constraints` (G2)가 `dom_id_registry` 대조로 검증. 신규 ID는 allowlist 등록 필수.

### 2-1. 노드 (Node)

| 필드               | truth       | DOM ID                   | 읽기/쓰기 위치                                                       | 비고                      |
| ------------------ | ----------- | ------------------------ | -------------------------------------------------------------------- | ------------------------- |
| 제목 (title)       | DOM         | `node-title-input`       | DescriptionSection (쓰기), AppContext `applyCurrentNodeState` (읽기) | 디바운스 없음 (C-32)      |
| 설명 (description) | DOM         | `node-description-input` | DescriptionSection                                                   | 토글 `toggle-description` |
| 설명 표시 토글     | DOM         | `toggle-description`     | DescriptionSection                                                   | —                         |
| 노드 타입          | React state | —                        | TypeSection → `UPDATE_FLOW_NODE`                                     | DOM 아님 (버튼 그룹)      |

### 2-2. 크기 (Size)

| 필드            | truth | DOM ID                | 읽기/쓰기 위치                            | 비고                            |
| --------------- | ----- | --------------------- | ----------------------------------------- | ------------------------------- |
| 너비 (width)    | DOM   | `input-size-w`        | SizeSection (쓰기), `triggerApply` (읽기) | clamp 로직 (C-25)               |
| 높이 (height)   | DOM   | `input-size-h`        | SizeSection                               | —                               |
| 라운드 (radius) | DOM   | `input-size-radius`   | SizeSection                               | max 불일치 (C-26)               |
| 사이즈 모드     | DOM   | `select-size-mode`    | SizeSection                               | **dispatchEvent 사이트** (R-05) |
| 모드 값 (fixed) | DOM   | `size-mode-val-fixed` | SizeSection                               | —                               |
| 모드 값 (hug)   | DOM   | `size-mode-val-hug`   | SizeSection                               | —                               |

> 💡 **Size UI 타입별 활성/비활성 및 Preset 해제 규칙 (GEMINI §12)**:
> - **Screen 타입 전용 활성화**: Size 필드 및 Preset은 Screen 타입 노드에서만 활성화됩니다.
> - **비-Screen 타입 disabled 규격**: Process, Connector 등 타 타입에서는 UI를 숨기지 않고 배경(`var(--color-bg-secondary)`)을 유지한 채 텍스트/라벨/아이콘을 피그마 UI3 비활성 토큰(`var(--color-text-tertiary)`)으로 렌더링하고 `pointer-events: none`을 적용합니다.
> - **수동 변경 시 Preset 해제**: 사용자가 Width/Height/Radius를 직접 입력(`onChange`)하거나 Size Mode를 변경(`selectSizeMode`)하면 `selectedSizePresetId`를 `null`로 초기화합니다. 프로그램에 의한 변경(Fit Contents 자동 리사이즈 등)은 수동 변경으로 보지 않아 Preset을 유지합니다.
> - **포커스 입력 보호**: `(isDifferentNode || activeEl !== inputEl)` 가드로 인풋 타이핑 중 리렌더링 시 외부 동기화로 인한 값 덮어쓰기를 원천 방지합니다.

### 2-3. 외관 (Appearance)

| 필드           | truth | DOM ID               | 읽기/쓰기 위치    | 비고                              |
| -------------- | ----- | -------------------- | ----------------- | --------------------------------- |
| 이보레이션     | DOM   | `toggle-elevation`   | ElevationSection  | `elevation >= 0` 항상 true (C-05) |
| 상태 (status)  | DOM   | `toggle-status`      | StatusSection     | 조용히 제거 (C-29)                |
| 스텝 배지 토글 | DOM   | `toggle-step-badges` | StepBadgesSection | —                                 |
| 스텝 번호      | DOM   | `input-step-number`  | StepBadgesSection | —                                 |

### 2-4. 커넥터 (Connector)

| 필드          | truth | DOM ID                  | 읽기/쓰기 위치  | 비고                        |
| ------------- | ----- | ----------------------- | --------------- | --------------------------- |
| 라벨 토글     | DOM   | `toggle-conn-label`     | LabelSection    | —                           |
| 라벨 텍스트   | DOM   | `input-conn-label`      | LabelSection    | —                           |
| 라인 색상     | DOM   | `conn-line-color`       | ConnectionPanel | 3자리 hex padStart (C-01)   |
| 스트로크 두께 | DOM   | `input-stroke-weight`   | ConnectionPanel | parseInt 소수점 유실 (C-02) |
| 시작 단자     | DOM   | `select-start-terminal` | ConnectSection  | 단자 크기 고정 (GEMINI §4)  |
| 종료 단자     | DOM   | `select-end-terminal`   | ConnectSection  | —                           |
| 시작 오프셋   | DOM   | `input-start-offset`    | ConnectSection  | —                           |
| 종료 오프셋   | DOM   | `input-end-offset`      | ConnectSection  | —                           |
| 링크 토글     | DOM   | `toggle-conn-link`      | LinkSection     | dead feature (C-20)         |
| 링크 URL      | DOM   | `input-conn-link-url`   | LinkSection     | —                           |
| 링크 그룹     | DOM   | `conn-link-group`       | LinkSection     | —                           |

### 2-5. Figma 링크 / 프리뷰

| 필드                 | truth | DOM ID                     | 읽기/쓰기 위치   | 비고 |
| -------------------- | ----- | -------------------------- | ---------------- | ---- |
| 단일 스크린 URL      | DOM   | `single-screen-url`        | FigmaLinkSection | —    |
| 단일 Figma 링크 토글 | DOM   | `toggle-single-figma-link` | FigmaLinkSection | —    |
| 앵커 프리뷰 박스     | DOM   | `conn-anchor-preview-box`  | ConnectionPanel  | —    |
| 프리뷰 노드1 텍스트  | DOM   | `preview-node-1-text`      | ConnectionPanel  | —    |
| 프리뷰 노드2 텍스트  | DOM   | `preview-node-2-text`      | ConnectionPanel  | —    |

### 2-6. 앱 루트

| 필드          | truth | DOM ID        | 읽기/쓰기 위치      | 비고             |
| ------------- | ----- | ------------- | ------------------- | ---------------- |
| 플러그인 루트 | DOM   | `plugin-root` | App / useAutoResize | 높이 측정 (R-03) |
| 루트 컨테이너 | DOM   | `root`        | App                 | —                |

---

## 3. React state (캐시/파생) — truth 아님

| state            | 위치       | 역할                     | 비고                       |
| ---------------- | ---------- | ------------------------ | -------------------------- |
| `lastNodeConfig` | AppContext | 선택 노드 설정 캐시      | DOM 1차, ref 폴백          |
| `uiState`        | AppContext | UI 표시 상태 (토글/패널) | 파생                       |
| `selectedNodes`  | AppContext | 선택 노드 목록           | useEffect deps 주의 (C-19) |

> ⚠️ 이 state들은 **DOM의 파생/캐시**일 뿐. DOM과 불일치 시 **DOM이 우선**.
> `window._titleDebounce` 같은 전역 해킹(C-17)은 R-04 위반 — `check:constraints` (W 체크)가 감지.

---

## 4. 필드 추가/수정 절차 (Checklist)

1. **truth 결정:** DOM이냐 React state냐 명시 (현재 아키텍처상 폼 값은 DOM).
2. **DOM ID 신규 생성 시:** `allowlists.json` `dom_id_registry` + (필요시) `dom_access_files` 등록.
3. **읽기/쓰기 경로 모두 수정:** "React state만" / "DOM만"의 반쪽 수정 금지 (INV-05).
4. **`dispatchEvent` 사용 시:** `allowlists.json` `dispatch_event_sites` + 페어링 핸들러 등록 (R-05).
5. `npm run check:constraints` 실행 → **PASS** 확인 (미등록 DOM ID/파일 = NEW 위반).
6. 수동 시나리오: 노드 선택 시 폼 값 복원 확인 (INV-05/R-01).

> ⚠️ `dom_id_registry`에 없는 정적 `getElementById('X')`를 추가하면 `check:constraints`가 **NEW 위반**으로 FAIL한다.
> 템플릿 리터럴(동적) ID는 레지스트리 대상이 아니므로 검증에서 제외된다.
