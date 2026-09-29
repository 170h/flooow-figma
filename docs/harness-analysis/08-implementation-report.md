# Harness 시스템 구현 완료 보고서

> `04-harness-architecture-design.md` 스펙에 따라 Harness를 구현한 결과 보고서.
> 기존 애플리케이션 코드는 **수정하지 않았고**, 기존 프로토콜 불일치는 **수정하지 않고** Harness가 감지하도록 등록했다.

---

## 1. 생성된 파일 (10개)

| 파일                                                                                             | 역할                                                                             |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [`AGENTS.md`](../../AGENTS.md)                                                                   | Agent 단일 진입점 — 정체성·INV 요약·작업별 라우팅·금지사항·완료 게이트           |
| [`.harness/structure-rules.json`](../../.harness/structure-rules.json)                           | 금지 패턴 / 무시 디렉터리 / 보호 파일 / 편집 금지                                |
| [`.harness/protocol-rules.json`](../../.harness/protocol-rules.json)                             | 프로토콜 계약 레지스트리 (union/switch/수신 위치, KNOWN 위반, no-op, round_trip) |
| [`.harness/allowlists.json`](../../.harness/allowlists.json)                                     | DOM ID 레지스트리(31) / DOM 접근 파일(12) / dispatchEvent / postMessage 사이트   |
| [`05-action-index.md`](./05-action-index.md)                                                     | 액션별 발신 위치 인덱스 (R-06/R-11)                                              |
| [`06-field-ownership.md`](./06-field-ownership.md)                                               | 폼 필드 상태 소유권 맵 (R-01/INV-05)                                             |
| [`07-verification-gates.md`](./07-verification-gates.md)                                         | 완료 게이트 + 수동 체크리스트 (INV-10/R-13)                                      |
| [`failures/0001-protocol-union-switch-drift.md`](./failures/0001-protocol-union-switch-drift.md) | Failure Memory — KNOWN 10건 위반 기록                                            |
| [`scripts/check-protocol.mjs`](../../scripts/check-protocol.mjs)                                 | **G3 게이트** — union↔switch↔수신 3자 일치 (R-08/09, INV-03/04)                  |
| [`scripts/check-constraints.mjs`](../../scripts/check-constraints.mjs)                           | **G2 게이트** — 격리·DOM allowlist·dispatchEvent·window (R-02~05, INV-01/02/06)  |

---

## 2. 수정된 파일 (2개)

- [`README.md`](./README.md) — 05/06/07 + failures/ 인덱스 항목 추가
- [`package.json`](../../package.json) — 스크립트 3종 추가: `check:protocol`, `check:constraints`, `verify`

---

## 3. 검증 명령 결과 (5종)

| 명령                        | 결과                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run typecheck`         | ✅ **PASS** (EXIT 0) — `tsc --noEmit` 클린                                                     |
| `npm run build:all`         | ✅ **PASS** (EXIT 0) — dist/code.js 211.2kb, ui-bundle.js 1.4mb, ui.html 1588KB                |
| `npm run check:protocol`    | ⚠️ **FAIL (예상됨)** (EXIT 1) — **KNOWN 10 / NEW 0**                                           |
| `npm run check:constraints` | ✅ **PASS** (EXIT 0) — 모든 구조/제약 체크 통과                                                |
| `npm run verify`            | ⚠️ **FAIL (예상됨)** — typecheck+build:all 통과 후 check:protocol 단계에서 KNOWN 10건으로 중단 |

---

## 4. Harness가 감지한 기존 위반 (KNOWN 10건 — "기존 코드의 예상된 위반")

`check:protocol`이 `src/types.ts` union ↔ `src/code.ts` switch ↔ `src/ui/hooks/useFigmaMessage.ts` 수신 3자 불일치를 **수정 없이** 정확히 감지:

- **UI→Core (`PluginAction` union 29 / Core switch 27):** `CREATE_CONNECTORS`, `CREATE_TEMPLATE` — union에 있으나 Core switch 미처리 (unhandled)
- **Core→UI (`CoreToUIMessage` union 6):**
  - `INIT_DONE`, `READY`, `SWITCH_TAB` — UI가 수신하나 union 미선언 (undeclared_received)
  - `TOAST` — union 선언 있으나 Core 미발신 (unsent)
  - `STATUS_LIST_UPDATED`, `UI3_VARIABLES_EXTRACTED`, `SETTINGS_LOADED`, `TOAST` — union 선언 있으나 UI 미수신 (unreceived)

이 10건은 `protocol-rules.json`의 KNOWN 레지스트리에 등록되어 있어 **NEW 위반 0**으로 정상 분류된다. 신규 위반이 생기면 `check:protocol`이 NEW로 감지해 FAIL한다.

---

## 5. 기존 애플리케이션 코드 미수정 확인 (git)

```
 M package.json
?? .harness/
?? AGENTS.md
?? docs/
?? scripts/check-constraints.mjs
?? scripts/check-protocol.mjs
```

- **`src/` 파일이 diff에 전혀 없음** — `src/code.ts`, `src/ui/**`, `src/ui.html`, `dist/**` 모두 미변경 확인
- 유일한 tracked 변경은 `package.json` (스크립트 3종 추가)
- `check:constraints`가 `src/ui/`에서 `figma.` 사용 0건, `customConnector` import 0건을 확인하여 격리(INV-01/06) 유지 검증

---

## 참고

- `package.json`의 `keywords` 배열이 멀티라인으로 표시되는 것은 저장 시 포맷터(환경) 동작이며, 유효한 JSON이고 허용 수정 범위 내이므로 기능에 영향 없음.
- `check:protocol`의 FAIL은 스펙상 의도된 동작으로, 기존 코드의 프로토콜 불일치를 Harness가 감지하는 것을 의미한다 (수정 대상 아님).
