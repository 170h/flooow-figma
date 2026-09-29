# 0001 — Protocol Union ↔ Switch Drift (기존 코드 위반)

> **상태:** KNOWN (기존 코드에 이미 존재, Harness가 감지·기록)
> **분류:** R-08 / R-09 (프로토콜 불일치) · INV-03 / INV-04 위반
> **감지 게이트:** `npm run check:protocol` (G3)
> **등록 위치:** `.harness/protocol-rules.json`
> **생성일:** 2026-09-28

---

## 1. 요약

`src/types.ts`의 프로토콜 union 타입과 실제 `switch` 처리 사이에서 **10건의 불일치**가 존재한다.
이것은 **신규 회귀가 아니라 기존 코드에 이미 존재하는 상태**이며, 이번 Harness 도입 작업에서는
**버그 수정을 하지 않고** Harness가 이를 안정적으로 감지·기록하도록 등록한 것이다.

`check:protocol`은 이 10건을 `KNOWN`으로 분류하고 `NEW 0`을 보고한다.
따라서 `check:protocol`은 **FAIL (exit 1)** 이며, 이는 "기존 코드의 예상된 위반"이다.

---

## 2. 위반 상세 (10건)

### 2-1. UI → Core (`PluginAction`, union 29종)

| #   | type                | 위반 유형                         | 설명                                                              |
| --- | ------------------- | --------------------------------- | ----------------------------------------------------------------- |
| 1   | `CREATE_CONNECTORS` | union에서 Core 미처리 (unhandled) | `types.ts` union에 선언되어 있으나 `code.ts` `switch`에 case 없음 |
| 2   | `CREATE_TEMPLATE`   | union에서 Core 미처리 (unhandled) | `types.ts` union에 선언되어 있으나 `code.ts` `switch`에 case 없음 |

- **근거:** `src/types.ts` L280-327 (union 29종) vs `src/code.ts` L4709-4802 (switch 27 case)
- **영향:** UI가 이 두 action을 보내도 Core는 무시한다. (현재 UI에서 발신하지 않아 실질 영향 없음)

### 2-2. Core → UI (`CoreToUIMessage`, union 6종)

| #   | type                      | 위반 유형                                  | 설명                                                         |
| --- | ------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| 3   | `INIT_DONE`               | UI 수신 union 미선언 (undeclared_received) | `useFigmaMessage.ts`가 수신하나 union에 없음                 |
| 4   | `READY`                   | UI 수신 union 미선언 (undeclared_received) | `useFigmaMessage.ts`가 수신하나 union에 없음                 |
| 5   | `SWITCH_TAB`              | UI 수신 union 미선언 (undeclared_received) | `useFigmaMessage.ts`가 수신하나 union에 없음                 |
| 6   | `TOAST`                   | union에서 Core 미발신 (unsent)             | union에 선언되어 있으나 Core가 발신하지 않음                 |
| 7   | `STATUS_LIST_UPDATED`     | union에서 UI 미수신 (unreceived)           | union에 선언되어 있으나 UI가 수신 처리하지 않음              |
| 8   | `UI3_VARIABLES_EXTRACTED` | union에서 UI 미수신 (unreceived)           | union에 선언되어 있으나 UI가 수신 처리하지 않음              |
| 9   | `SETTINGS_LOADED`         | union에서 UI 미수신 (unreceived)           | union에 선언되어 있으나 UI가 수신 처리하지 않음              |
| 10  | `TOAST`                   | union에서 UI 미수신 (unreceived)           | union에 선언되어 있으나 UI가 수신 처리하지 않음 (6번과 중복) |

- **근거:** `src/types.ts` L379-415 (union 6종) vs `src/ui/hooks/useFigmaMessage.ts` L27-176 (수신 5 case)
- **영향:** `INIT_DONE`/`READY`/`SWITCH_TAB`은 union에 없으므로 타입 안전성 밖. `TOAST`는 UI 토스트 컴포넌트 직접 구현 금지(INV-02 round_trip)와 관련.

---

## 3. 왜 수정하지 않는가 (범위 제한)

- 이번 작업의 명시적 범위: **Harness 구현만**. 기존 애플리케이션 코드 수정 금지.
- `src/types.ts`, `src/code.ts`, `src/ui/hooks/useFigmaMessage.ts`는 모두 **보호 파일 / 수정 금지 대상**.
- 따라서 이 10건은 **Harness가 감지·기록하는 대상**으로 남기고, 실제 수정은 별도 작업으로 분리한다.

---

## 4. Harness가 어떻게 통제하는가

1. **`check:protocol` (G3)** — union ↔ switch ↔ 발신/수신 3자 정합성을 정적으로 검증.
   - `KNOWN` (protocol-rules.json 등록) → FAIL이지만 "예상된 위반"으로 보고.
   - `NEW` (미등록) → **회귀**로 보고, 반드시 FAIL.
2. **`protocol-rules.json`** — `known_unhandled`, `known_undeclared`, `known_unsent`, `known_unreceived`
   리스트에 위 10건을 등록하여 "기존 상태"와 "신규 회귀"를 구분.
3. **`AGENTS.md`** — 이 파일을 참조하여 "왜 check:protocol이 FAIL인지"를 설명.

---

## 5. 향후 수정 시 체크리스트 (별도 작업)

- [ ] `CREATE_CONNECTORS` / `CREATE_TEMPLATE`: Core switch에 case 추가 **또는** union에서 제거 (의도 확인 필요)
- [ ] `INIT_DONE` / `READY` / `SWITCH_TAB`: `CoreToUIMessage` union에 추가 (타입 안전성 확보)
- [ ] `TOAST`: Core 발신 구현 **또는** union에서 제거. UI 토스트 직접 구현 금지(INV-02) 준수
- [ ] `STATUS_LIST_UPDATED` / `UI3_VARIABLES_EXTRACTED` / `SETTINGS_LOADED`: UI 수신 처리 추가 **또는** union에서 제거
- [ ] 수정 후 `protocol-rules.json`의 `known_*` 리스트에서 해당 항목 제거
- [ ] `npm run check:protocol`이 **PASS (exit 0)** 가 되도록 확인
