# Harness Engineering 도입 분석 — 05. Action Index (UI→Core 액션 인덱스)

> **목적:** `PluginAction` (UI→Core) 29종과 `CoreToUIMessage` (Core→UI) 6종을
> **액션 단위**로 인덱싱하여, 각 액션의 발신자/수신자/처리 위치/상태를 한눈에 확인하게 한다.
> **근거:** `src/types.ts` L280-327 (PluginAction), L379-415 (CoreToUIMessage)
> **상위 문서:** [04-harness-architecture-design.md](./04-harness-architecture-design.md) §4 (라우팅 테이블)
> **검증 게이트:** `npm run check:protocol` (G3)

---

## 1. 사용법

- **새 액션을 만들 때:** 이 인덱스에 등록하고, `types.ts` union + Core switch + (필요시) UI 수신 switch를 함께 수정.
- **버그를 추적할 때:** 액션 이름을 검색하여 발신/수신/처리 위치를 즉시 확인.
- **Harness가 NEW 위반을 보고할 때:** 이 인덱스에 없는 액션 = 미등록 신규 액션 → 회귀 의심.

---

## 2. UI → Core (`PluginAction`, 29종)

> 발신: `src/ui/**` (parent.postMessage) · 수신/처리: `src/code.ts` L4709-4802 `switch (msg.type)`
> 상태: ✅ = union+switch 모두 존재 · ⚠️ = union만 존재 (Core 미처리, KNOWN) · 🚫 = no-op

| #   | type                                | 상태     | 발신 위치 (UI)                   | Core 처리 함수                                                         | 비고                                                                           |
| --- | ----------------------------------- | -------- | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | `CREATE_FLOW_NODE`                  | ✅       | NodePanel / App                  | `createFlowNode()`                                                     | 노드 생성                                                                      |
| 2   | `UPDATE_FLOW_NODE`                  | ✅       | NodePanel (제목/설명/타입)       | `updateFlowNode()`                                                     | 노드 수정                                                                      |
| 3   | `CONNECT_POINTS`                    | ✅       | ConnectSection                   | `connectPoints()`                                                      | 점-점 연결                                                                     |
| 4   | `AUTO_CONNECT_SELECTED`             | ✅       | ConnectionPanel                  | `autoConnectSelected()`                                                | 선택 노드 자동 연결                                                            |
| 5   | `UPDATE_CONNECTOR_LABEL`            | ✅       | LabelSection                     | `updateConnectorLabel()`                                               | 커넥터 라벨                                                                    |
| 6   | `TOGGLE_NODE_THEME`                 | ✅       | StyleSection                     | `toggleNodeTheme()`                                                    | 라이트/다크 토글                                                               |
| 7   | `CREATE_CONNECTORS`                 | ⚠️ KNOWN | (현재 UI 미발신)                 | **없음**                                                               | union만 존재 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |
| 8   | `ADD_STEP_BADGES`                   | ✅       | StepBadgesSection                | `addStepBadges()`                                                      | 스텝 배지 추가                                                                 |
| 9   | `REMOVE_STEP_BADGES`                | ✅       | StepBadgesSection                | `removeStepBadges()`                                                   | 스텝 배지 제거                                                                 |
| 10  | `SET_PHASE`                         | ✅       | PhaseSection / PhaseModal        | `applyPhaseToSelected()`                                               | 페이즈 적용                                                                    |
| 11  | `SET_STATUS`                        | ✅       | StatusSection                    | `applyStatusToSelected()`                                              | 상태 적용                                                                      |
| 12  | `SET_ELEVATION`                     | ✅       | ElevationSection                 | `applyElevationToSelected()`                                           | 이보레이션 적용                                                                |
| 13  | `GET_STATUS_LIST`                   | ✅       | (UI 요청)                        | `syncStatusList()`                                                     | 상태 목록 동기화                                                               |
| 14  | `FOCUS_FRAME`                       | ✅       | (UI 요청)                        | `focusFrame()`                                                         | 프레임 포커스                                                                  |
| 15  | `GET_DESIGN_FRAMES`                 | ✅       | FigmaDesignPickerModal           | `getDesignFrames()`                                                    | 디자인 프레임 목록                                                             |
| 16  | `CREATE_TEMPLATE`                   | ⚠️ KNOWN | (현재 UI 미발신)                 | **없음**                                                               | union만 존재 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |
| 17  | `RESIZE_NODE`                       | ✅       | SizeSection / SizeModal          | `resizeNode()`                                                         | 노드 리사이즈                                                                  |
| 18  | `UPDATE_CONNECTOR_PROPERTIES`       | ✅       | ConnectionPanel (색상/두께/단자) | `updateConnectorProperties()`                                          | 커넥터 속성                                                                    |
| 19  | `SET_CONNECTOR_LINE_TYPE`           | ✅       | ConnectionPanel                  | `setConnectorLineType()`                                               | ELBOWED/STRAIGHT                                                               |
| 20  | `CONVERT_ALL_CONNECTORS_TO_ELBOWED` | ✅       | ConnectionPanel                  | `convertAllConnectorsToElbowed()`                                      | 전체 엘보 전환                                                                 |
| 21  | `EXTRACT_UI3_VARIABLES`             | ✅       | (UI 요청)                        | `extractUI3Variables()`                                                | UI3 변수 추출                                                                  |
| 22  | `SAVE_SETTINGS`                     | ✅       | (UI 요청)                        | `saveSettings()`                                                       | 설정 저장                                                                      |
| 23  | `LOAD_SETTINGS`                     | ✅       | (UI 요청)                        | `loadSavedSettings()`                                                  | 설정 로드                                                                      |
| 24  | `UNDO`                              | 🚫 no-op | (UI 요청)                        | no-op (의도적)                                                         | Figma 네이티브 언도 위임                                                       |
| 25  | `REDO`                              | 🚫 no-op | (UI 요청)                        | no-op (의도적)                                                         | Figma 네이티브 리도 위임                                                       |
| 26  | `CLOSE_PLUGIN`                      | ✅       | (UI 요청)                        | `figma.closePlugin()`                                                  | 플러그인 종료                                                                  |
| 27  | `NOTIFY`                            | ✅       | (UI 요청)                        | `notify()`                                                             | **UI 토스트 직접 구현 금지** — Core `figma.notify` 경유 (INV-02 round_trip)    |
| 28  | `RESIZE_WINDOW`                     | ✅       | useAutoResize                    | `figma.ui.resize` (clamp 200~1200)                                     | 창 높이 자동 조절                                                              |
| 29  | `INIT`                              | ✅       | useFigmaMessage (L187)           | `handleSelectionChange()` + `syncStatusList()` + `loadSavedSettings()` | 초기화                                                                         |

---

## 3. Core → UI (`CoreToUIMessage`, 6종)

> 발신: `src/code.ts` `postToUI()` · 수신: `src/ui/hooks/useFigmaMessage.ts` L27-176 `switch (msg.type)`
> 상태: ✅ = union+수신 모두 존재 · ⚠️ = union만 존재 (UI 미수신, KNOWN) · ❗ = 수신만 존재 (union 미선언, KNOWN)

| #   | type                      | 상태     | Core 발신 위치            | UI 수신 처리              | 비고                                                                           |
| --- | ------------------------- | -------- | ------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| 1   | `SELECTION_CHANGED`       | ✅       | `handleSelectionChange()` | `useFigmaMessage.ts` L28  | 선택 변경                                                                      |
| 2   | `STATUS_LIST_UPDATED`     | ⚠️ KNOWN | `syncStatusList()`        | **없음**                  | union만 존재 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |
| 3   | `DESIGN_FRAMES_LOADED`    | ✅       | `getDesignFrames()`       | `useFigmaMessage.ts` L164 | 디자인 프레임 로드                                                             |
| 4   | `UI3_VARIABLES_EXTRACTED` | ⚠️ KNOWN | `extractUI3Variables()`   | **없음**                  | union만 존재 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |
| 5   | `SETTINGS_LOADED`         | ⚠️ KNOWN | `loadSavedSettings()`     | **없음**                  | union만 존재 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |
| 6   | `TOAST`                   | ⚠️ KNOWN | **없음** (Core 미발신)    | **없음**                  | union만 존재 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |

### 3-1. union에 없으나 UI가 수신하는 type (KNOWN, 3종)

| type         | UI 수신 위치              | 비고                                                                           |
| ------------ | ------------------------- | ------------------------------------------------------------------------------ |
| `INIT_DONE`  | `useFigmaMessage.ts` L158 | union 미선언 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |
| `READY`      | `useFigmaMessage.ts` L159 | union 미선언 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |
| `SWITCH_TAB` | `useFigmaMessage.ts` L169 | union 미선언 — [failures/0001](./failures/0001-protocol-union-switch-drift.md) |

---

## 4. 액션 추가/수정 절차 (Checklist)

1. `src/types.ts` union에 type 추가 (단일 소스 오브 트루스, INV-07)
2. `src/code.ts` `switch (msg.type)`에 case 추가 (UI→Core) **또는** `useFigmaMessage.ts` switch에 case 추가 (Core→UI)
3. 이 인덱스(05)에 행 추가
4. `npm run check:protocol` 실행 → **PASS** 확인 (NEW 위반 0건)
5. `npm run verify` 전체 실행

> ⚠️ union만 추가하고 switch를 누락하면 `check:protocol`이 **NEW 위반**으로 FAIL한다.
> 반대로 switch만 추가하고 union을 누락하면 `undeclared_handled`/`undeclared_received` NEW 위반으로 FAIL한다.
