# Harness Engineering 도입 분석 — 07. Verification Gates (완료 검증 게이트)

> **목적:** "작업 완료"를 선언하기 전 반드시 통과해야 할 **자동 + 수동 검증 게이트**를 정의한다.
> **근거:** INV-10 (02-architecture-invariants.md L150-162), R-13 (03-agent-failure-risks.md L152-163)
> **상위 문서:** [04-harness-architecture-design.md](./04-harness-architecture-design.md) §7 (자동/수동 검증)
> **실행:** `npm run verify` (package.json) — 자동 게이트 일괄 실행

---

## 1. 게이트 원칙

- **완료 = 모든 게이트 통과.** 게이트 미통과 시 "완료" 선언 금지 (R-13).
- **자동 게이트**는 `npm run verify`로 일괄 실행, **수동 게이트**는 Figma 데스크톱에서 확인.
- **KNOWN 위반** (protocol-rules.json 등록)은 `check:protocol`이 FAIL시키나 "예상된 위반"으로 보고.
- **NEW 위반** (미등록)은 반드시 FAIL — 회귀이므로 차단.

---

## 2. 자동 검증 게이트 (G1~G4)

| 게이트               | 명령                        | 검증 내용                                                       | 근거                           | 통과 기준                      |
| -------------------- | --------------------------- | --------------------------------------------------------------- | ------------------------------ | ------------------------------ |
| **G1** 타입 안전성   | `npm run typecheck`         | `tsc --noEmit` 컴파일 타임 타입                                 | INV-07                         | exit 0                         |
| **G2** 구조/제약     | `npm run check:constraints` | 샌드박스 격리·DOM allowlist·dispatchEvent·window 상태·금지 패턴 | INV-01/02/06, R-02/03/04/05/12 | exit 0 (NEW 위반 0)            |
| **G3** 프로토콜 계약 | `npm run check:protocol`    | union↔switch↔수신 3자 일치 + 발신 사이트 대조                   | INV-03/04, R-08/09             | NEW 위반 0 (KNOWN는 FAIL 허용) |
| **G4** 빌드          | `npm run build:all`         | core→UI→인라인 순서, `dist/ui.html` 산출                        | INV-09                         | exit 0                         |

### 2-1. `npm run verify` (일괄)

```
npm run typecheck && npm run build:all && npm run check:protocol && npm run check:constraints
```

> ⚠️ **현재 상태:** `check:protocol`이 **KNOWN 10건**으로 FAIL (exit 1) — [failures/0001](./failures/0001-protocol-union-switch-drift.md).
> 따라서 `npm run verify`는 **G3에서 중단**된다. 이는 "기존 코드의 예상된 위반"이며,
> 신규 회귀(NEW)가 0건인 한 Harness는 정상 작동한다.
> **판독법:** `check:protocol` 출력에서 `NEW 위반 (신규, 미등록): 0` 이면 Harness 관점 통과.

### 2-2. 게이트별 판독

| 출력                                 | 의미                                             | 대응                                      |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------- |
| `check:constraints` → `PASS`         | 구조/제약 모두 충족                              | 통과                                      |
| `check:protocol` → `KNOWN n / NEW 0` | 기존 위반만, 신규 회귀 없음                      | Harness 관점 통과 (기존 위반은 별도 작업) |
| `check:protocol` → `NEW ≥ 1`         | **신규 회귀**                                    | **차단** — union/switch/수신 중 하나 누락 |
| `check:constraints` → `NEW ≥ 1`      | **신규 회귀** (미등록 DOM ID/파일/figma./window) | **차단** — allowlist 등록 또는 코드 수정  |

---

## 3. 수동 검증 게이트 (Figma 데스크톱 필수)

> 자동 게이트는 **정적 분석**의 한계가 있다. 다음 시나리오는 Figma 데스크톱에서 **반드시 수동 확인**.

| #   | 시나리오                                                  | 근거                     | 확인 포인트                                           |
| --- | --------------------------------------------------------- | ------------------------ | ----------------------------------------------------- |
| M1  | **폼 필드 동기화** — 노드 선택 시 폼 값 복원              | INV-05 / R-01            | DOM truth가 React state에 정확히 반영, 반쪽 수정 없음 |
| M2  | **useAutoResize / RESIZE_WINDOW** — 창 높이 진동/울찔     | R-03 / GEMINI §8         | 높이 자동 조절 시 jitter 없음, clamp 200~1200         |
| M3  | **커넥터 렌더링** — 단자 크기, SQUARE 면 채움             | GEMINI §3/§4             | 단자 크기 영구 고정, 임의 변경 없음                   |
| M4  | **배타적 아코디언** — 3사 상호 배타 + flicker 차단        | GEMINI §7                | 한 번에 하나만 열림, 비동기 깜빡임 없음               |
| M5  | **드롭다운/팝오버 격리** — 레이아웃 시프트, click-outside | GEMINI §6                | 열림/닫힘 시 레이아웃 이동 없음                       |
| M6  | **NOTIFY 토스트 왕복** — 이중 알림 없음                   | R-07 / INV-02 round_trip | UI 토스트 직접 구현 금지, Core `figma.notify` 1회     |
| M7  | **INIT 핸드셰이크** — 마운트 시 응답                      | INV-03                   | `INIT` 발신 → Core 응답 → UI 초기화                   |
| M8  | **BUG_REPORT CONFIRMED 회귀** — 수정 항목 재발 없음       | R-13                     | 해당 항목 시나리오 재실행                             |

---

## 4. 완료 게이트 체크리스트 (Agent 필수)

작업을 "완료"로 처리하기 전 아래를 **모두** 확인:

- [ ] `npm run typecheck` → exit 0
- [ ] `npm run build:all` → exit 0, `dist/ui.html` 생성
- [ ] `npm run check:constraints` → `PASS` (NEW 위반 0)
- [ ] `npm run check:protocol` → `NEW 위반 0` (KNOWN는 [failures/0001](./failures/0001-protocol-union-switch-drift.md) 참조)
- [ ] 해당 작업의 **수동 게이트 (M1~M8 중 관련 항목)** Figma 데스크톱 확인
- [ ] **범위 외 파일 미수정** 확인 (`git diff --stat` — `src/code.ts`, `src/ui/**`, `dist/**` 등 보호 파일 변경 없음)
- [ ] 신규 DOM ID/액션/파일 → `allowlists.json` / `protocol-rules.json` / `05` / `06`에 등록

> ⚠️ 위 중 하나라도 미충족이면 **완료 선언 금지** (R-13). 미충족 항목은 결과에 명시.

---

## 5. 게이트와 파일의 대응

| 게이트                 | 소비하는 Harness 파일                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| G2 (check:constraints) | `.harness/structure-rules.json`, `.harness/allowlists.json`                                      |
| G3 (check:protocol)    | `.harness/protocol-rules.json`, `src/types.ts`, `src/code.ts`, `src/ui/hooks/useFigmaMessage.ts` |
| 수동 M1                | `06-field-ownership.md`                                                                          |
| 수동 M6/M7             | `05-action-index.md`, `failures/0001`                                                            |
| 완료 체크리스트        | `AGENTS.md` §완료게이트                                                                          |
